import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrisma } from '@rad/shared';
import { Cron } from 'croner';

interface RouteParams {
  params: Promise<{ name: string }>;
}

/**
 * GET /api/jobs/[name] - Get a specific job with history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name: jobName } = await params;
    const prisma = getPrisma();

    const job = await prisma.scheduledJob.findUnique({
      where: { name: jobName },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 50,
        },
        targetUsers: true,
        targetPacks: {
          include: { pack: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Format response
    const formattedJob = {
      id: job.id,
      name: job.name,
      displayName: job.displayName,
      description: job.description,
      schedule: job.schedule,
      timezone: job.timezone,
      enabled: job.enabled,
      jobKey: job.jobKey,
      jobType: job.jobType,
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
      createdAt: Number(job.createdAt),
      updatedAt: Number(job.updatedAt),
      executions: job.executions.map((e) => ({
        id: e.id,
        status: e.status,
        startedAt: Number(e.startedAt),
        completedAt: e.completedAt ? Number(e.completedAt) : null,
        durationMs: e.durationMs,
        usersAffected: e.usersAffected,
        result: e.result ? JSON.parse(e.result) : null,
        error: e.error,
        metadata: e.metadata ? JSON.parse(e.metadata) : null,
      })),
    };

    return NextResponse.json({ job: formattedJob });
  } catch (error) {
    console.error('[API] Failed to fetch job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[name] - Update job configuration
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name: jobName } = await params;
    const body = await request.json();
    const { schedule, timezone, enabled, config, jobKey, jobType, targets } = body;

    const prisma = getPrisma();

    // Check job exists
    const existing = await prisma.scheduledJob.findUnique({
      where: { name: jobName },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Validate cron expression (basic check)
    if (schedule && !isValidCron(schedule)) {
      return NextResponse.json(
        { error: 'Invalid cron expression' },
        { status: 400 }
      );
    }

    // Update job
    const now = BigInt(Date.now());
    const updated = await prisma.scheduledJob.update({
      where: { name: jobName },
      data: {
        schedule: schedule ?? existing.schedule,
        timezone: timezone ?? existing.timezone,
        enabled: enabled ?? existing.enabled,
        jobKey: jobKey ?? existing.jobKey,
        jobType: jobType ?? existing.jobType,
        config: config !== undefined ? JSON.stringify(config) : existing.config,
        updatedAt: now,
        // Recalculate next run if schedule changed
        nextRunAt: schedule ? calculateNextRun(schedule, timezone ?? existing.timezone) : existing.nextRunAt,
      },
    });

    if (targets) {
      const includeUsers = Array.isArray(targets.includeUsers) ? targets.includeUsers : [];
      const excludeUsers = Array.isArray(targets.excludeUsers) ? targets.excludeUsers : [];
      const packIds = Array.isArray(targets.packIds) ? targets.packIds : [];

      const excludeSet = new Set(excludeUsers.map(String));
      const includeFiltered = includeUsers.map(String).filter((u: string) => !excludeSet.has(u));

      await prisma.scheduledJobTargetUser.deleteMany({
        where: { jobId: existing.id },
      });
      await prisma.scheduledJobTargetPack.deleteMany({
        where: { jobId: existing.id },
      });

      if (includeFiltered.length > 0 || excludeUsers.length > 0) {
        await prisma.scheduledJobTargetUser.createMany({
          data: [
            ...includeFiltered.map((telegramUserId: string) => ({
              jobId: existing.id,
              telegramUserId,
              mode: 'include',
              createdAt: now,
            })),
            ...excludeUsers.map((telegramUserId: string) => ({
              jobId: existing.id,
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
            jobId: existing.id,
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
        id: updated.id,
        name: updated.name,
        schedule: updated.schedule,
        timezone: updated.timezone,
        enabled: updated.enabled,
        config: updated.config ? JSON.parse(updated.config) : {},
        jobKey: updated.jobKey,
        jobType: updated.jobType,
      },
    });
  } catch (error) {
    console.error('[API] Failed to update job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

/**
 * Validate cron expression using croner library
 */
function isValidCron(expression: string): boolean {
  try {
    const parts = expression.trim().split(/\s+/);
    // Standard cron has 5 parts, some systems support 6 (with seconds)
    if (parts.length < 5 || parts.length > 6) {
      return false;
    }
    
    // Try to parse with croner - will throw if invalid
    new Cron(expression);
    return true;
  } catch (error) {
    console.error('[cron-validation] Invalid cron expression:', expression, error);
    return false;
  }
}

/**
 * Calculate next run time from cron expression
 * Returns null on parse error
 */
function calculateNextRun(schedule: string, timezone: string): bigint | null {
  try {
    // This is a simplified calculation
    // In production, use the croner library on the server side
    // For now, just return null and let the scheduler calculate it
    return null;
  } catch {
    return null;
  }
}
