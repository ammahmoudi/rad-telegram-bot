/**
 * Scheduler Types
 * Type definitions for the job scheduling system
 */

export interface JobConfig {
  [key: string]: unknown;
}

export interface JobContext {
  jobId: string;
  jobName: string;
  jobKey: string;
  executionId: string;
  config: JobConfig;
  startedAt: Date;
  targets?: JobTargets;
}

export interface JobResult {
  success: boolean;
  usersAffected: number;
  summary: string;
  details?: Record<string, unknown>;
  errors?: string[];
  notifications?: JobNotification[];
}

export interface JobTargets {
  includeUserIds: string[];
  excludeUserIds: string[];
  packIds: string[];
  finalUserIds: string[];
}

export interface JobNotification {
  telegramUserId: string;
  message: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  silent?: boolean;
  replyMarkup?: Record<string, unknown>;
}

export interface JobDefinition {
  /** Unique identifier for this job type */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Description of what this job does */
  description: string;
  /** Default cron schedule (can be overridden in DB) */
  defaultSchedule: string;
  /** Default timezone */
  defaultTimezone?: string;
  /** Default configuration */
  defaultConfig?: JobConfig;
  /** Whether this job should be seeded into DB on startup */
  seedOnStartup?: boolean;
  /** The actual job handler function */
  handler: (context: JobContext) => Promise<JobResult>;
}

export interface ScheduledJobRecord {
  id: string;
  name: string;
  jobKey: string;
  jobType: string;
  displayName: string;
  description: string | null;
  schedule: string;
  timezone: string;
  enabled: boolean;
  config: string | null;
  lastRunAt: bigint | null;
  nextRunAt: bigint | null;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface JobExecutionRecord {
  id: string;
  jobId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt: bigint;
  completedAt: bigint | null;
  durationMs: number | null;
  result: string | null;
  error: string | null;
  usersAffected: number;
  metadata: string | null;
}

export type JobStatus = 'pending' | 'running' | 'success' | 'failed';

export interface JobStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDurationMs: number;
  lastExecution: JobExecutionRecord | null;
}

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  notificationHandler?: (notifications: JobNotification[], context: JobContext) => Promise<void>;
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
  };
}
