/**
 * Custom Message Job
 * Sends a custom message to targeted users
 */

import { BaseJob } from './base-job.js';
import type { JobContext, JobResult, JobNotification } from '../types.js';

export interface CustomMessageConfig {
  message: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  silent?: boolean;
  [key: string]: unknown;
}

export class CustomMessageJob extends BaseJob {
  constructor() {
    super({
      name: 'custom-message',
      displayName: '✉️ Custom Message',
      description: 'Send a custom message to targeted users',
      defaultSchedule: '0 9 * * *',
      defaultTimezone: 'Asia/Tehran',
      defaultConfig: { message: '' },
      seedOnStartup: false,
    });
  }

  async execute(context: JobContext): Promise<JobResult> {
    const config = context.config as CustomMessageConfig;
    const targets = context.targets?.finalUserIds ?? [];

    if (!config.message || config.message.trim().length === 0) {
      return {
        success: false,
        usersAffected: 0,
        summary: 'Custom message is empty',
        errors: ['Custom message text is required'],
      };
    }

    const notifications: JobNotification[] = targets.map((userId) => ({
      telegramUserId: userId,
      message: config.message,
      parseMode: config.parseMode ?? 'HTML',
      silent: config.silent ?? false,
    }));

    return {
      success: true,
      usersAffected: notifications.length,
      summary: `Prepared ${notifications.length} custom notifications`,
      notifications,
    };
  }
}

export const customMessageJob = new CustomMessageJob();
