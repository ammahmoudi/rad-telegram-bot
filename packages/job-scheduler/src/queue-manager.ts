/**
 * Queue Manager
 * BullMQ-based job queue for reliable job execution
 * Provides Redis-backed job queuing with retries, concurrency control, and monitoring
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import type { JobContext, JobResult, QueueConfig, JobTargets, JobNotification } from './types.js';
import { jobRegistry } from './job-registry.js';

const QUEUE_NAME = 'scheduled-jobs';

export interface QueueJobData {
  jobName: string;
  jobKey: string;
  jobId: string;
  executionId: string;
  config: Record<string, unknown>;
  startedAt: number;
  targets?: JobTargets;
}

class QueueManager {
  private queue: Queue<QueueJobData, JobResult, string> | null = null;
  private worker: Worker<QueueJobData, JobResult, string> | null = null;
  private queueEvents: QueueEvents | null = null;
  private connection: Redis | null = null;
  private isInitialized = false;
  private notificationHandler: QueueConfig['notificationHandler'] | null = null;

  /**
   * Initialize the queue manager with Redis connection
   */
  async initialize(config: QueueConfig): Promise<void> {
    if (this.isInitialized) {
      console.log('[queue-manager] Already initialized');
      return;
    }

    console.log('[queue-manager] Initializing with Redis', { 
      host: config.redis.host, 
      port: config.redis.port,
    });

    try {
      this.notificationHandler = config.notificationHandler ?? null;

      // Create Redis connection
      this.connection = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db ?? 0,
        maxRetriesPerRequest: null, // Required by BullMQ
        retryStrategy: () => null, // Don't retry on connection error
        enableReadyCheck: false,
        enableOfflineQueue: false,
        connectTimeout: 3000,
      });

      // Test connection with timeout
      await Promise.race([
        new Promise(resolve => this.connection!.on('connect', resolve)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
        ),
      ]);
    } catch (error) {
      console.warn('[queue-manager] Redis unavailable, running in offline mode', {
        error: (error as Error).message,
        hint: 'Start Redis with: docker compose up -d redis',
      });
      this.isInitialized = true;
      return;
    }

    // Create queue
    this.queue = new Queue<QueueJobData, JobResult, string>(QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: config.defaultJobOptions?.attempts ?? 3,
        backoff: config.defaultJobOptions?.backoff ?? {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: config.defaultJobOptions?.removeOnComplete ?? 100,
        removeOnFail: config.defaultJobOptions?.removeOnFail ?? 50,
      },
    });

    // Create worker to process jobs
    this.worker = new Worker<QueueJobData, JobResult, string>(
      QUEUE_NAME,
      async (job: Job<QueueJobData, JobResult, string>) => {
        return this.processJob(job);
      },
      {
        connection: this.connection!,
        concurrency: 5, // Process up to 5 jobs concurrently
      }
    );

    // Setup event handlers
    this.setupEventHandlers();

    // Create queue events for monitoring
    this.queueEvents = new QueueEvents(QUEUE_NAME, {
      connection: this.connection!,
    });

    this.isInitialized = true;
    console.log('[queue-manager] Initialized successfully');
  }

  /**
   * Process a job from the queue
   */
  private async processJob(job: Job<QueueJobData, JobResult, string>): Promise<JobResult> {
    const { jobName, jobKey, jobId, executionId, config, startedAt, targets } = job.data;

    console.log('[queue-manager] Processing job', { jobName, executionId });

    const context: JobContext = {
      jobId,
      jobName,
      jobKey,
      executionId,
      config,
      startedAt: new Date(startedAt),
      targets,
    };

    try {
      const result = await jobRegistry.execute(jobKey, context);
      await this.handleNotifications(result, context);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[queue-manager] Job processing failed', { 
        jobName, 
        executionId,
        error: errorMessage,
      });
      throw error;
    }
  }

  private async handleNotifications(result: JobResult, context: JobContext): Promise<void> {
    if (!result.notifications || result.notifications.length === 0) {
      return;
    }

    if (!this.notificationHandler) {
      console.warn('[queue-manager] Notifications produced but no handler configured', {
        jobName: context.jobName,
        jobKey: context.jobKey,
        count: result.notifications.length,
      });
      return;
    }

    try {
      await this.notificationHandler(result.notifications as JobNotification[], context);
    } catch (error) {
      console.error('[queue-manager] Notification handler failed', {
        jobName: context.jobName,
        jobKey: context.jobKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    if (!this.worker) return;

    this.worker.on('completed', (job) => {
      console.log('[queue-manager] Job completed', { 
        jobId: job.id, 
        jobName: job.data.jobName,
        result: job.returnvalue,
      });
    });

    this.worker.on('failed', (job, error) => {
      console.error('[queue-manager] Job failed', { 
        jobId: job?.id, 
        jobName: job?.data.jobName,
        error: error.message,
      });
    });

    this.worker.on('error', (error) => {
      console.error('[queue-manager] Worker error', { error: error.message });
    });
  }

  /**
   * Add a job to the queue for immediate execution
   */
  async addJob(data: QueueJobData, options?: { delay?: number; priority?: number }): Promise<Job<QueueJobData, JobResult, string>> {
    if (!this.queue) {
      console.warn('[queue-manager] Queue offline, job not persisted:', data.jobName);
      // Return a mock job object that won't crash
      return {
        id: 'offline-' + Date.now(),
        data,
      } as any;
    }

    const job = await this.queue.add(data.jobName, data, {
      delay: options?.delay,
      priority: options?.priority,
    });

    console.log('[queue-manager] Job added to queue', { 
      queueJobId: job.id,
      jobName: data.jobName,
      executionId: data.executionId,
    });

    return job;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    if (!this.queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Get recent jobs from the queue
   */
  async getRecentJobs(limit = 20): Promise<Job<QueueJobData, JobResult, string>[]> {
    if (!this.queue) {
      return [];
    }

    const jobs = await this.queue.getJobs(['completed', 'failed', 'active', 'waiting'], 0, limit);
    return jobs;
  }

  /**
   * Clean up old jobs
   */
  async cleanOldJobs(olderThanMs: number): Promise<void> {
    if (!this.queue) {
      return;
    }

    await this.queue.clean(olderThanMs, 100, 'completed');
    await this.queue.clean(olderThanMs, 50, 'failed');
    console.log('[queue-manager] Cleaned old jobs');
  }

  /**
   * Pause the worker
   */
  async pause(): Promise<void> {
    if (this.worker) {
      await this.worker.pause();
      console.log('[queue-manager] Worker paused');
    }
  }

  /**
   * Resume the worker
   */
  async resume(): Promise<void> {
    if (this.worker) {
      this.worker.resume();
      console.log('[queue-manager] Worker resumed');
    }
  }

  /**
   * Shutdown the queue manager gracefully
   */
  async shutdown(): Promise<void> {
    console.log('[queue-manager] Shutting down...');

    if (this.worker) {
      await this.worker.close();
    }

    if (this.queueEvents) {
      await this.queueEvents.close();
    }

    if (this.queue) {
      await this.queue.close();
    }

    if (this.connection) {
      await this.connection.quit();
    }

    this.isInitialized = false;
    console.log('[queue-manager] Shutdown complete');
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const queueManager = new QueueManager();
