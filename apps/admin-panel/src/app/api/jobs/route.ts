import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrisma } from '@rad/shared';
import { scheduler } from '@rad/job-scheduler';

// Scheduler initialization flag
let schedulerInitialized = false;

/**
 * Ensure scheduler is initialized with Redis config
 */
async function ensureSchedulerInitialized() {
  if (schedulerInitialized) return;
  
  await scheduler.initialize({
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    },
  });
  
  schedulerInitialized = true;
  console.log('[admin-api] Scheduler initialized');
}

/**
 * GET /api/jobs - Get all scheduled jobs with their status
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const prisma = getPrisma();

    // Get all jobs with last execution info
    const jobs = await prisma.scheduledJob.findMany({
      orderBy: { name: 'asc' },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
        targetUsers: true,
        targetPacks: {
          include: { pack: true },
        },
      },
    });

    // Format response
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      jobKey: job.jobKey,
      jobType: job.jobType,
      displayName: job.displayName,
      description: job.description,
      schedule: job.schedule,
      timezone: job.timezone,
      enabled: job.enabled,
      config: job.config ? JSON.parse(job.config) : {},
      targets: {
        includeUsers: job.targetUsers.filter(t => t.mode === 'include').map(t => t.telegramUserId),
        excludeUsers: job.targetUsers.filter(t => t.mode === 'exclude').map(t => t.telegramUserId),
        packIds: job.targetPacks.filter(t => t.mode === 'include').map(t => t.packId),
        packs: job.targetPacks.filter(t => t.mode === 'include').map(t => ({
          id: t.packId,
          name: t.pack.name,
        })),
      },
      lastRunAt: job.lastRunAt ? Number(job.lastRunAt) : null,
      nextRunAt: job.nextRunAt ? Number(job.nextRunAt) : null,
      lastExecution: job.executions[0]
        ? {
            id: job.executions[0].id,
            status: job.executions[0].status,
            startedAt: Number(job.executions[0].startedAt),
            completedAt: job.executions[0].completedAt
              ? Number(job.executions[0].completedAt)
              : null,
            durationMs: job.executions[0].durationMs,
            usersAffected: job.executions[0].usersAffected,
            error: job.executions[0].error,
          }
        : null,
    }));

    return NextResponse.json({ jobs: formattedJobs });
  } catch (error) {
    console.error('[API] Failed to fetch jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs - Trigger a job manually
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const prisma = getPrisma();

    if (action === 'trigger') {
      const { jobName } = body;
      if (!jobName) {
        return NextResponse.json(
          { error: 'Invalid request. Use action: "trigger" and provide jobName' },
          { status: 400 }
        );
      }

      // Check job exists
      const job = await prisma.scheduledJob.findUnique({
        where: { name: jobName },
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      // Ensure scheduler is initialized
      await ensureSchedulerInitialized();

      // Trigger the job via scheduler
      try {
        const executionId = await scheduler.triggerJob(jobName);
        
        return NextResponse.json({
          success: true,
          message: `Job ${jobName} triggered`,
          executionId,
        });
      } catch (error) {
        console.error('[API] Failed to trigger job:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to trigger job' },
          { status: 500 }
        );
      }
    }

    if (action === 'create') {
      const {
        name,
        displayName,
        description,
        schedule,
        timezone,
        enabled,
        jobKey,
        jobType,
        config,
        targets,
      } = body;

      if (!displayName || !schedule) {
        return NextResponse.json(
          { error: 'displayName and schedule are required' },
          { status: 400 }
        );
      }

      const finalName = (name && String(name).trim().length > 0)
        ? String(name).trim()
        : slugify(displayName);

      const existing = await prisma.scheduledJob.findUnique({
        where: { name: finalName },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Job name already exists' },
          { status: 409 }
        );
      }

      const now = BigInt(Date.now());
      const created = await prisma.scheduledJob.create({
        data: {
          name: finalName,
          jobKey: jobKey || finalName,
          jobType: jobType || 'coded',
          displayName,
          description: description || null,
          schedule,
          timezone: timezone || 'Asia/Tehran',
          enabled: enabled ?? true,
          config: config !== undefined ? JSON.stringify(config) : null,
          createdAt: now,
          updatedAt: now,
        },
      });

      if (targets) {
        const includeUsers = Array.isArray(targets.includeUsers) ? targets.includeUsers : [];
        const excludeUsers = Array.isArray(targets.excludeUsers) ? targets.excludeUsers : [];
        const packIds = Array.isArray(targets.packIds) ? targets.packIds : [];

        const excludeSet = new Set(excludeUsers.map(String));
        const includeFiltered = includeUsers.map(String).filter(u => !excludeSet.has(u));

        if (includeFiltered.length > 0 || excludeUsers.length > 0) {
          await prisma.scheduledJobTargetUser.createMany({
            data: [
              ...includeFiltered.map((telegramUserId: string) => ({
                jobId: created.id,
                telegramUserId,
                mode: 'include',
                createdAt: now,
              })),
              ...excludeUsers.map((telegramUserId: string) => ({
                jobId: created.id,
                telegramUserId: String(telegramUserId),
                mode: 'exclude',
                createdAt: now,
              })),
            ],
          });
        }

        if (packIds.length > 0) {
          await prisma.scheduledJobTargetPack.createMany({
            data: packIds.map((packId: string) => ({
              jobId: created.id,
              packId: String(packId),
              mode: 'include',
              createdAt: now,
            })),
          });
        }
      }

      return NextResponse.json({
        success: true,
        job: {
          id: created.id,
          name: created.name,
          displayName: created.displayName,
          schedule: created.schedule,
          timezone: created.timezone,
          enabled: created.enabled,
          jobKey: created.jobKey,
          jobType: created.jobType,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use action: "trigger" or "create"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Failed to trigger job:', error);
    return NextResponse.json(
      { error: 'Failed to trigger job' },
      { status: 500 }
    );
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
