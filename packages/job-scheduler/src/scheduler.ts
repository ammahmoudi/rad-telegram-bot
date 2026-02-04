/**
 * Scheduler Service
 * Manages cron-based job scheduling using Croner
 * Syncs with database for persistence and admin panel control
 */

import { Cron } from 'croner';
import { getPrisma } from '@rad/shared';
import { jobRegistry } from './job-registry.js';
import { queueManager } from './queue-manager.js';
import type { ScheduledJobRecord, JobConfig, QueueConfig, JobTargets } from './types.js';

interface CronJob {
  name: string;
  cron: Cron;
}

class Scheduler {
  private cronJobs: Map<string, CronJob> = new Map();
  private isRunning = false;
  private prismaInstance: ReturnType<typeof getPrisma> | null = null;

  /**
   * Lazy getter for Prisma instance
   * Ensures DATABASE_URL is loaded before Prisma initializes
   */
  private getPrismaInstance() {
    if (!this.prismaInstance) {
      this.prismaInstance = getPrisma();
    }
    return this.prismaInstance;
  }

  /**
   * Initialize the scheduler
   * - Syncs job definitions to database
   * - Starts cron jobs for enabled jobs
   */
  async initialize(queueConfig: QueueConfig): Promise<void> {
    console.log('[scheduler] Initializing...');

    // Initialize the queue manager
    await queueManager.initialize(queueConfig);

    // Sync job definitions to database
    await this.syncJobDefinitions();

    // Load and start enabled jobs
    await this.loadAndStartJobs();

    this.isRunning = true;
    console.log('[scheduler] Initialized and running');
  }

  /**
   * Sync job definitions from registry to database
   * Creates new jobs, updates existing ones (preserving user config)
   */
  private async syncJobDefinitions(): Promise<void> {
    const definitions = jobRegistry.getDefaults();
    const now = BigInt(Date.now());

    for (const def of definitions) {
      const existing = await this.getPrismaInstance().scheduledJob.findUnique({
        where: { name: def.name },
      });

      if (!existing) {
        // Create new job record
        await this.getPrismaInstance().scheduledJob.create({
          data: {
            name: def.name,
            jobKey: def.name,
            jobType: 'coded',
            displayName: def.displayName,
            description: def.description,
            schedule: def.schedule,
            timezone: def.timezone,
            enabled: true,
            config: JSON.stringify(def.config),
            createdAt: now,
            updatedAt: now,
            nextRunAt: this.calculateNextRun(def.schedule, def.timezone),
          },
        });
        console.log(`[scheduler] Created job: ${def.name}`);
      } else {
        // Update display name and description only (preserve user settings)
        await this.getPrismaInstance().scheduledJob.update({
          where: { name: def.name },
          data: {
            displayName: def.displayName,
            description: def.description,
            jobKey: existing.jobKey || def.name,
            jobType: existing.jobType || 'coded',
            updatedAt: now,
          },
        });
        console.log(`[scheduler] Updated job: ${def.name}`);
      }
    }
  }

  /**
   * Load enabled jobs from database and start their cron schedules
   */
  private async loadAndStartJobs(): Promise<void> {
    const jobs = await this.getPrismaInstance().scheduledJob.findMany({
      where: { enabled: true },
    });

    for (const job of jobs) {
      await this.startJobCron(job as ScheduledJobRecord);
    }

    console.log(`[scheduler] Started ${jobs.length} cron jobs`);
  }

  /**
   * Start a cron job for a specific job record
   */
  private async startJobCron(job: ScheduledJobRecord): Promise<void> {
    // Stop existing cron if any
    this.stopJobCron(job.name);

    const jobKey = job.jobKey || job.name;

    // Verify job handler exists
    if (!jobRegistry.has(jobKey)) {
      console.warn(`[scheduler] No handler registered for job: ${jobKey}`);
      return;
    }

    // Create cron job
    const cron = new Cron(job.schedule, {
      timezone: job.timezone,
    }, async () => {
      await this.executeJob(job.name);
    });

    this.cronJobs.set(job.name, { name: job.name, cron });

    // Update next run time
    await this.updateNextRunTime(job.name, job.schedule, job.timezone);

    console.log(`[scheduler] Started cron for job: ${job.name} (${job.schedule} ${job.timezone})`);
  }

  /**
   * Stop a specific cron job
   */
  private stopJobCron(name: string): void {
    const cronJob = this.cronJobs.get(name);
    if (cronJob) {
      cronJob.cron.stop();
      this.cronJobs.delete(name);
      console.log(`[scheduler] Stopped cron for job: ${name}`);
    }
  }

  /**
   * Execute a job by adding it to the queue
   */
  async executeJob(jobName: string): Promise<string> {
    const job = await this.getPrismaInstance().scheduledJob.findUnique({
      where: { name: jobName },
    });

    if (!job) {
      throw new Error(`Job not found: ${jobName}`);
    }

    const now = BigInt(Date.now());

    // Create execution record
    const execution = await this.getPrismaInstance().jobExecution.create({
      data: {
        jobId: job.id,
        status: 'pending',
        startedAt: now,
      },
    });

    // Parse config
    const config: JobConfig = job.config ? JSON.parse(job.config) : {};
    const jobKey = job.jobKey || job.name;
    const targets = await this.resolveTargets(job.id);

    // Add to queue
    await queueManager.addJob({
      jobName: job.name,
      jobKey,
      jobId: job.id,
      executionId: execution.id,
      config,
      startedAt: Number(now),
      targets,
    });

    // Update job last run time
    await this.getPrismaInstance().scheduledJob.update({
      where: { id: job.id },
      data: {
        lastRunAt: now,
        nextRunAt: this.calculateNextRun(job.schedule, job.timezone),
        updatedAt: now,
      },
    });

    console.log(`[scheduler] Queued job execution: ${jobName}`, { executionId: execution.id });

    return execution.id;
  }

  /**
   * Manually trigger a job execution (from admin panel)
   */
  async triggerJob(jobName: string): Promise<string> {
    console.log(`[scheduler] Manual trigger: ${jobName}`);
    return this.executeJob(jobName);
  }

  /**
   * Resolve target users for a job (includes/excludes + character packs)
   */
  private async resolveTargets(jobId: string): Promise<JobTargets> {
    const prisma = this.getPrismaInstance();

    const [includeUsers, excludeUsers, packTargets] = await Promise.all([
      prisma.scheduledJobTargetUser.findMany({
        where: { jobId, mode: 'include' },
        select: { telegramUserId: true },
      }),
      prisma.scheduledJobTargetUser.findMany({
        where: { jobId, mode: 'exclude' },
        select: { telegramUserId: true },
      }),
      prisma.scheduledJobTargetPack.findMany({
        where: { jobId, mode: 'include' },
        select: { packId: true },
      }),
    ]);

    const includeUserIds = includeUsers.map(u => u.telegramUserId);
    const excludeUserIds = excludeUsers.map(u => u.telegramUserId);
    const packIds = packTargets.map(p => p.packId);

    let baseUserIds: string[] = [];

    if (includeUserIds.length > 0) {
      baseUserIds = [...includeUserIds];
    }

    if (packIds.length > 0) {
      const packUsers = await prisma.userPackAssignment.findMany({
        where: { packId: { in: packIds } },
        select: { telegramUserId: true },
      });
      const packUserIds = packUsers.map(p => p.telegramUserId);
      baseUserIds = [...new Set([...baseUserIds, ...packUserIds])];
    }

    if (baseUserIds.length === 0) {
      const allUsers = await prisma.telegramUser.findMany({
        select: { id: true },
      });
      baseUserIds = allUsers.map(u => u.id);
    }

    const excluded = new Set(excludeUserIds);
    const finalUserIds = baseUserIds.filter(id => !excluded.has(id));

    return {
      includeUserIds,
      excludeUserIds,
      packIds,
      finalUserIds,
    };
  }

  /**
   * Update a job's configuration
   */
  async updateJobConfig(
    jobName: string,
    updates: {
      schedule?: string;
      enabled?: boolean;
      config?: JobConfig;
      timezone?: string;
    }
  ): Promise<void> {
    const job = await this.getPrismaInstance().scheduledJob.findUnique({
      where: { name: jobName },
    });

    if (!job) {
      throw new Error(`Job not found: ${jobName}`);
    }

    const now = BigInt(Date.now());
    const newSchedule = updates.schedule ?? job.schedule;
    const newTimezone = updates.timezone ?? job.timezone;

    await this.getPrismaInstance().scheduledJob.update({
      where: { name: jobName },
      data: {
        schedule: newSchedule,
        timezone: newTimezone,
        enabled: updates.enabled,
        config: updates.config ? JSON.stringify(updates.config) : undefined,
        nextRunAt: this.calculateNextRun(newSchedule, newTimezone),
        updatedAt: now,
      },
    });

    // Restart or stop cron based on enabled status
    const enabled = updates.enabled ?? job.enabled;
    if (enabled) {
      const updatedJob = await this.getPrismaInstance().scheduledJob.findUnique({
        where: { name: jobName },
      });
      if (updatedJob) {
        await this.startJobCron(updatedJob as ScheduledJobRecord);
      }
    } else {
      this.stopJobCron(jobName);
    }

    console.log(`[scheduler] Updated job config: ${jobName}`, updates);
  }

  /**
   * Calculate next run time for a cron schedule
   */
  private calculateNextRun(schedule: string, timezone: string): bigint | null {
    try {
      const cron = new Cron(schedule, { timezone });
      const next = cron.nextRun();
      cron.stop();
      return next ? BigInt(next.getTime()) : null;
    } catch (error) {
      console.error('[scheduler] Failed to calculate next run', { schedule, error });
      return null;
    }
  }

  /**
   * Update next run time in database
   */
  private async updateNextRunTime(name: string, schedule: string, timezone: string): Promise<void> {
    const nextRun = this.calculateNextRun(schedule, timezone);
    await this.getPrismaInstance().scheduledJob.update({
      where: { name },
      data: { 
        nextRunAt: nextRun,
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  /**
   * Get all jobs with their status
   */
  async getAllJobs(): Promise<Array<ScheduledJobRecord & { isActive: boolean }>> {
    const jobs = await this.getPrismaInstance().scheduledJob.findMany({
      orderBy: { name: 'asc' },
    });

    return jobs.map(job => ({
      ...job as ScheduledJobRecord,
      isActive: this.cronJobs.has(job.name),
    }));
  }

  /**
   * Get job execution history
   */
  async getJobExecutions(
    jobName?: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Array<{
    execution: any;
    job: { name: string; displayName: string };
  }>> {
    const where = jobName
      ? { job: { name: jobName } }
      : {};

    const executions = await this.getPrismaInstance().jobExecution.findMany({
      where,
      include: {
        job: {
          select: { name: true, displayName: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });

    return executions.map(e => ({
      execution: e,
      job: e.job,
    }));
  }

  /**
   * Update execution status (called by queue worker)
   */
  async updateExecutionStatus(
    executionId: string,
    status: 'running' | 'success' | 'failed',
    result?: {
      summary?: string;
      usersAffected?: number;
      error?: string;
    }
  ): Promise<void> {
    const now = BigInt(Date.now());
    const execution = await this.getPrismaInstance().jobExecution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      console.error('[scheduler] Execution not found:', executionId);
      return;
    }

    const durationMs = execution.startedAt 
      ? Number(now - execution.startedAt) 
      : null;

    await this.getPrismaInstance().jobExecution.update({
      where: { id: executionId },
      data: {
        status,
        completedAt: status !== 'running' ? now : undefined,
        durationMs,
        result: result?.summary ? JSON.stringify({ summary: result.summary }) : undefined,
        usersAffected: result?.usersAffected ?? 0,
        error: result?.error,
      },
    });
  }

  /**
   * Stop all cron jobs and shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[scheduler] Shutting down...');

    // Stop all cron jobs
    for (const [name, cronJob] of this.cronJobs) {
      cronJob.cron.stop();
      console.log(`[scheduler] Stopped cron: ${name}`);
    }
    this.cronJobs.clear();

    // Shutdown queue manager
    await queueManager.shutdown();

    this.isRunning = false;
    console.log('[scheduler] Shutdown complete');
  }

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const scheduler = new Scheduler();
