/**
 * Jobs - Public API
 */

export * from './types.js';
export { BaseJob } from './base-job.js';
export * from './unselected-food-reminder.job.js';
export * from './custom-message.job.js';

// Registration helper
import { jobRegistry } from '../job-registry.js';
import { unselectedFoodReminderJob } from './unselected-food-reminder.job.js';
import { customMessageJob } from './custom-message.job.js';

/**
 * Register all job definitions with the job registry
 * Call this during application startup
 */
export function registerAllJobs(): void {
  console.log('[jobs] Registering all job definitions...');
  
  // Register each job
  jobRegistry.register(unselectedFoodReminderJob.toDefinition());
  jobRegistry.register(customMessageJob.toDefinition());
  
  // Add more job registrations here
  
  console.log('[jobs] All jobs registered');
}
