/**
 * Base Job
 * Abstract base class providing common functionality for all jobs
 * Extend this class to create new job types
 */

import type { JobContext, JobResult, JobDefinition, JobConfig } from './types.js';
import { scheduler } from '../scheduler.js';

export interface BaseJobOptions {
  name: string;
  displayName: string;
  description: string;
  defaultSchedule: string;
  defaultTimezone?: string;
  defaultConfig?: JobConfig;
  seedOnStartup?: boolean;
}

/**
 * Abstract base class for jobs
 * Provides common functionality and enforces the job contract
 */
export abstract class BaseJob {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly defaultSchedule: string;
  readonly defaultTimezone: string;
  readonly defaultConfig: JobConfig;
  readonly seedOnStartup: boolean;

  constructor(options: BaseJobOptions) {
    this.name = options.name;
    this.displayName = options.displayName;
    this.description = options.description;
    this.defaultSchedule = options.defaultSchedule;
    this.defaultTimezone = options.defaultTimezone ?? 'Asia/Tehran';
    this.defaultConfig = options.defaultConfig ?? {};
    this.seedOnStartup = options.seedOnStartup ?? true;
  }

  /**
   * Main execution method - must be implemented by subclasses
   */
  abstract execute(context: JobContext): Promise<JobResult>;

  /**
   * Called before execution starts
   * Override for custom pre-execution logic
   */
  protected async beforeExecute(context: JobContext): Promise<void> {
    console.log(`[${this.name}] Starting execution`, { executionId: context.executionId });
    await scheduler.updateExecutionStatus(context.executionId, 'running');
  }

  /**
   * Called after successful execution
   * Override for custom post-execution logic
   */
  protected async afterExecute(context: JobContext, result: JobResult): Promise<void> {
    console.log(`[${this.name}] Completed`, { 
      executionId: context.executionId,
      usersAffected: result.usersAffected,
    });
    
    await scheduler.updateExecutionStatus(context.executionId, 'success', {
      summary: result.summary,
      usersAffected: result.usersAffected,
    });
  }

  /**
   * Called when execution fails
   * Override for custom error handling
   */
  protected async onError(context: JobContext, error: Error): Promise<void> {
    console.error(`[${this.name}] Failed`, { 
      executionId: context.executionId,
      error: error.message,
    });
    
    await scheduler.updateExecutionStatus(context.executionId, 'failed', {
      error: error.message,
    });
  }

  /**
   * The handler function that wraps execute with lifecycle hooks
   * This is what gets registered with the job registry
   */
  getHandler(): (context: JobContext) => Promise<JobResult> {
    return async (context: JobContext): Promise<JobResult> => {
      try {
        await this.beforeExecute(context);
        const result = await this.execute(context);
        await this.afterExecute(context, result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        await this.onError(context, err);
        throw err;
      }
    };
  }

  /**
   * Convert to JobDefinition for registration
   */
  toDefinition(): JobDefinition {
    return {
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      defaultSchedule: this.defaultSchedule,
      defaultTimezone: this.defaultTimezone,
      defaultConfig: this.defaultConfig,
      seedOnStartup: this.seedOnStartup,
      handler: this.getHandler(),
    };
  }
}

/**
 * Helper function to create a simple job without extending BaseJob
 */
export function createJob(
  options: BaseJobOptions & {
    execute: (context: JobContext) => Promise<JobResult>;
  }
): JobDefinition {
  return {
    name: options.name,
    displayName: options.displayName,
    description: options.description,
    defaultSchedule: options.defaultSchedule,
    defaultTimezone: options.defaultTimezone ?? 'Asia/Tehran',
    defaultConfig: options.defaultConfig ?? {},
    handler: options.execute,
  };
}
