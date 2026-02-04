/**
 * Unselected Food Reminder Job
 * Runs daily at 10 PM to remind users who haven't selected food for tomorrow
 */

import { BaseJob } from './base-job.js';
import type { JobContext, JobResult } from '../types.js';
import type { JobNotification } from './types.js';
import {
  getUsersWithUnselectedTomorrow,
  formatFoodOptions,
  generateRecommendations,
  formatRecommendationsMessage,
} from '@rad/rastar-service';

export interface FoodReminderConfig {
  /** Whether to include AI-powered recommendations */
  includeRecommendations: boolean;
  /** Whether to send silently (no notification sound) */
  silentNotifications: boolean;
  /** Custom message template (optional) */
  messageTemplate?: string;
  /** Index signature for JobConfig compatibility */
  [key: string]: unknown;
}

const DEFAULT_CONFIG: FoodReminderConfig = {
  includeRecommendations: true,
  silentNotifications: false,
};

export class UnselectedFoodReminderJob extends BaseJob {
  // Store pending notifications for telegram bot to send
  private pendingNotifications: JobNotification[] = [];

  constructor() {
    super({
      name: 'unselected-food-reminder',
      displayName: '🍽️ Food Selection Reminder',
      description: 'Reminds users who have not selected food for tomorrow at 10 PM daily',
      defaultSchedule: '0 22 * * *', // 10 PM daily
      defaultTimezone: 'Asia/Tehran',
      defaultConfig: DEFAULT_CONFIG,
    });
  }

  async execute(context: JobContext): Promise<JobResult> {
    const config = { ...DEFAULT_CONFIG, ...context.config } as FoodReminderConfig;
    
    console.log(`[${this.name}] Checking for users with unselected food...`);

    // Get users who haven't selected food for tomorrow
    let usersWithUnselected = await getUsersWithUnselectedTomorrow();

    const targetIds = context.targets?.finalUserIds;
    if (targetIds && targetIds.length > 0) {
      usersWithUnselected = usersWithUnselected.filter(u => targetIds.includes(u.telegramUserId));
    }

    if (usersWithUnselected.length === 0) {
      return {
        success: true,
        usersAffected: 0,
        summary: 'All users have selected food for tomorrow',
      };
    }

    console.log(`[${this.name}] Found ${usersWithUnselected.length} users without selection`);

    // Generate notifications for each user
    this.pendingNotifications = [];
    
    for (const user of usersWithUnselected) {
      let message: string;

      if (config.includeRecommendations) {
        // Generate AI-powered recommendations
        const recommendations = generateRecommendations(user.unselectedDays);
        message = this.buildMessageWithRecommendations(user, recommendations);
      } else {
        message = this.buildBasicMessage(user);
      }

      this.pendingNotifications.push({
        telegramUserId: user.telegramUserId,
        message,
        parseMode: 'HTML',
        silent: config.silentNotifications,
      });
    }

    return {
      success: true,
      usersAffected: usersWithUnselected.length,
      summary: `Prepared reminders for ${usersWithUnselected.length} users`,
      notifications: this.pendingNotifications,
      details: {
        notifications: this.pendingNotifications.length,
        users: usersWithUnselected.map(u => u.telegramUserId),
      },
    };
  }

  /**
   * Build a message with food recommendations
   */
  private buildMessageWithRecommendations(
    user: { email: string; unselectedDays: any[] },
    recommendations: any[]
  ): string {
    const lines = [
      '⏰ <b>یادآوری انتخاب غذا</b>',
      '',
      'سلام! 👋',
      'فردا غذا انتخاب نکردی! ⚠️',
      '',
    ];

    // Add food options
    const optionsText = formatFoodOptions(user.unselectedDays);
    lines.push('🍽️ <b>گزینه‌های موجود:</b>');
    lines.push(optionsText);
    lines.push('');

    // Add recommendations
    if (recommendations.length > 0) {
      lines.push('💡 <b>پیشنهاد ما:</b>');
      for (const rec of recommendations) {
        lines.push(`   ➤ <b>${rec.recommendedFood.name}</b>`);
        if (rec.reason) {
          lines.push(`   📝 ${rec.reason}`);
        }
      }
      lines.push('');
    }

    lines.push('برای انتخاب غذا به پنل رستار مراجعه کن یا اینجا پیام بده! 📲');

    return lines.join('\n');
  }

  /**
   * Build a basic reminder message without recommendations
   */
  private buildBasicMessage(user: { email: string; unselectedDays: any[] }): string {
    const optionsText = formatFoodOptions(user.unselectedDays);

    return [
      '⏰ <b>یادآوری انتخاب غذا</b>',
      '',
      'سلام! 👋',
      'فردا غذا انتخاب نکردی! ⚠️',
      '',
      '🍽️ <b>گزینه‌های موجود:</b>',
      optionsText,
      '',
      'برای انتخاب غذا به پنل رستار مراجعه کن یا اینجا پیام بده! 📲',
    ].join('\n');
  }

  /**
   * Get pending notifications for the telegram bot to send
   * Called by the notification service after job completion
   */
  getPendingNotifications(): JobNotification[] {
    return this.pendingNotifications;
  }

  /**
   * Clear pending notifications after they've been sent
   */
  clearPendingNotifications(): void {
    this.pendingNotifications = [];
  }
}

// Singleton instance
export const unselectedFoodReminderJob = new UnselectedFoodReminderJob();
