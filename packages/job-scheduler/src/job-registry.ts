/**
 * Job Registry
 * Central registry for all job definitions
 * Jobs register themselves here, and the scheduler uses this to execute them
 */

import type { JobDefinition, JobContext, JobResult } from './types.js';

class JobRegistry {
  private jobs: Map<string, JobDefinition> = new Map();

  /**
   * Register a job definition
   */
  register(job: JobDefinition): void {
    if (this.jobs.has(job.name)) {
      console.warn(`[job-registry] Job '${job.name}' is already registered, overwriting`);
    }
    this.jobs.set(job.name, job);
    console.log(`[job-registry] Registered job: ${job.name}`);
  }

  /**
   * Get a job definition by name
   */
  get(name: string): JobDefinition | undefined {
    return this.jobs.get(name);
  }

  /**
   * Get all registered jobs
   */
  getAll(): JobDefinition[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Check if a job is registered
   */
  has(name: string): boolean {
    return this.jobs.has(name);
  }

  /**
   * Execute a job by name
   */
  async execute(name: string, context: JobContext): Promise<JobResult> {
    const job = this.get(name);
    if (!job) {
      throw new Error(`Job '${name}' not found in registry`);
    }

    console.log(`[job-registry] Executing job: ${name}`, { executionId: context.executionId });
    
    try {
      const result = await job.handler(context);
      console.log(`[job-registry] Job '${name}' completed`, { 
        executionId: context.executionId,
        success: result.success,
        usersAffected: result.usersAffected,
      });
      return result;
    } catch (error) {
      console.error(`[job-registry] Job '${name}' failed`, { 
        executionId: context.executionId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get default configurations for all jobs
   * Used when seeding/syncing job definitions to the database
   */
  getDefaults(): Array<{
    name: string;
    displayName: string;
    description: string;
    schedule: string;
    timezone: string;
    config: Record<string, unknown>;
  }> {
    return this.getAll()
      .filter(job => job.seedOnStartup !== false)
      .map(job => ({
      name: job.name,
      displayName: job.displayName,
      description: job.description,
      schedule: job.defaultSchedule,
      timezone: job.defaultTimezone ?? 'Asia/Tehran',
      config: job.defaultConfig ?? {},
    }));
  }
}

// Singleton instance
export const jobRegistry = new JobRegistry();
