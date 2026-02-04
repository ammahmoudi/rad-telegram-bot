/**
 * Scheduler Initialization
 * Sets up the job scheduler and queue system for the telegram bot
 */

import {
  scheduler,
  queueManager,
  registerAllJobs,
  type QueueConfig,
} from '@rad/job-scheduler';
import { notificationService } from '../services/notification/index.js';
import type { Bot, Api, RawApi } from 'grammy';
import type { BotContext } from '../bot.js';

// Redis configuration from environment
function getRedisConfig(): QueueConfig['redis'] {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
  };
}

/**
 * Initialize the scheduler system
 * Call this during bot startup
 */
export async function initializeScheduler(bot: Bot<BotContext, Api<RawApi>>): Promise<void> {
  console.log('[scheduler-init] Starting scheduler initialization...');

  // Check if Redis is configured
  if (!process.env.REDIS_HOST && process.env.NODE_ENV === 'production') {
    console.warn('[scheduler-init] REDIS_HOST not set, scheduler disabled in production');
    return;
  }

  try {
    // Initialize notification service with bot
    notificationService.initialize(bot);

    // Register all job definitions
    registerAllJobs();

    // Initialize scheduler with queue config
    const queueConfig: QueueConfig = {
      redis: getRedisConfig(),
      notificationHandler: async (notifications) => {
        if (!notificationService.isReady()) {
          console.warn('[scheduler-init] Notification service not ready');
          return;
        }

        await notificationService.sendBatch(
          notifications.map((n) => ({
            telegramUserId: n.telegramUserId,
            message: n.message,
            parseMode: n.parseMode,
            silent: n.silent,
            replyMarkup: n.replyMarkup,
          }))
        );
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    };

    await scheduler.initialize(queueConfig);

    console.log('[scheduler-init] Scheduler initialized successfully');
  } catch (error) {
    console.error('[scheduler-init] Failed to initialize scheduler', error);
    
    // In development, log warning but don't crash
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[scheduler-init] Scheduler disabled - Redis may not be running');
    } else {
      throw error;
    }
  }
}

/**
 * Shutdown the scheduler gracefully
 * Call this during bot shutdown
 */
export async function shutdownScheduler(): Promise<void> {
  console.log('[scheduler-init] Shutting down scheduler...');
  
  try {
    await scheduler.shutdown();
    console.log('[scheduler-init] Scheduler shut down successfully');
  } catch (error) {
    console.error('[scheduler-init] Error during scheduler shutdown', error);
  }
}

/**
 * Check scheduler health
 */
export function isSchedulerHealthy(): boolean {
  return scheduler.isActive() && queueManager.isReady();
}
