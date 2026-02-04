/**
 * Weekly Food Check Job
 * Runs every Friday night at 10 PM to check unselected food for the upcoming week
 * Provides comprehensive overview of unselected days with AI-enhanced messaging
 */

import { BaseJob } from './base-job.js';
import type { JobContext, JobResult } from '../types.js';
import type { JobNotification } from './types.js';
import {
  getUsersWithUnselectedDays,
  formatFoodOptions,
  generateRecommendations,
  createRecommendationPrompt,
  type UserFoodStatus,
} from '@rad/rastar-service';

export interface WeeklyFoodCheckConfig {
  /** Number of days ahead to check (default: 7) */
  daysAhead: number;
  /** Minimum unselected days to trigger notification (default: 2) */
  minUnselectedDays: number;
  /** Whether to include AI-powered recommendations */
  includeRecommendations: boolean;
  /** Whether to use AI to format the message nicely */
  useAiFormatting: boolean;
  /** AI model to use for formatting (if enabled) */
  aiModel?: string;
  /** OpenRouter API key (if using AI) */
  openRouterApiKey?: string;
  /** Whether to send silently (no notification sound) */
  silentNotifications: boolean;
  /** Custom message template (optional) */
  messageTemplate?: string;
  /** Index signature for JobConfig compatibility */
  [key: string]: unknown;
}

const DEFAULT_CONFIG: WeeklyFoodCheckConfig = {
  daysAhead: 7,
  minUnselectedDays: 2,
  includeRecommendations: true,
  useAiFormatting: false,
  aiModel: 'meta-llama/llama-3.1-8b-instruct:free',
  silentNotifications: false,
};

export class WeeklyFoodCheckJob extends BaseJob {
  private pendingNotifications: JobNotification[] = [];

  constructor() {
    super({
      name: 'weekly-food-check',
      displayName: '📅 Weekly Food Check',
      description: 'Checks unselected food for the upcoming week every Friday night',
      defaultSchedule: '0 22 * * 5', // Friday 10 PM
      defaultTimezone: 'Asia/Tehran',
      defaultConfig: DEFAULT_CONFIG,
    });
  }

  async execute(context: JobContext): Promise<JobResult> {
    const config = { ...DEFAULT_CONFIG, ...context.config } as WeeklyFoodCheckConfig;
    
    console.log(`[${this.name}] Checking food selections for next ${config.daysAhead} days...`);

    // Get users with unselected days
    let usersWithUnselected = await getUsersWithUnselectedDays(config.daysAhead);

    // Apply targeting if specified
    const targetIds = context.targets?.finalUserIds;
    if (targetIds && targetIds.length > 0) {
      usersWithUnselected = usersWithUnselected.filter(u => targetIds.includes(u.telegramUserId));
    }

    // Filter by minimum unselected days
    usersWithUnselected = usersWithUnselected.filter(
      u => u.upcomingUnselectedCount >= config.minUnselectedDays
    );

    if (usersWithUnselected.length === 0) {
      return {
        success: true,
        usersAffected: 0,
        summary: `No users found with ${config.minUnselectedDays}+ unselected days`,
      };
    }

    console.log(`[${this.name}] Found ${usersWithUnselected.length} users with unselected days`);

    // Generate notifications for each user
    this.pendingNotifications = [];
    
    for (const user of usersWithUnselected) {
      try {
        const message = await this.buildMessage(user, config);
        
        this.pendingNotifications.push({
          telegramUserId: user.telegramUserId,
          message,
          parseMode: 'HTML',
          silent: config.silentNotifications,
        });
      } catch (error) {
        console.error(`[${this.name}] Error building message for user ${user.telegramUserId}:`, error);
        // Continue with other users
      }
    }

    return {
      success: true,
      usersAffected: usersWithUnselected.length,
      summary: `Prepared weekly food check for ${usersWithUnselected.length} users`,
      notifications: this.pendingNotifications,
      details: {
        notifications: this.pendingNotifications.length,
        daysChecked: config.daysAhead,
        minThreshold: config.minUnselectedDays,
        users: usersWithUnselected.map(u => ({
          id: u.telegramUserId,
          unselectedCount: u.upcomingUnselectedCount,
        })),
      },
    };
  }

  /**
   * Build message for a user with unselected days
   */
  private async buildMessage(
    user: UserFoodStatus,
    config: WeeklyFoodCheckConfig
  ): Promise<string> {
    // Generate recommendations if enabled
    let recommendations: any[] = [];
    if (config.includeRecommendations) {
      recommendations = generateRecommendations(user.unselectedDays);
    }

    // If AI formatting is enabled, use AI to create a nice message
    if (config.useAiFormatting && config.openRouterApiKey) {
      try {
        return await this.buildAiFormattedMessage(user, recommendations, config);
      } catch (error) {
        console.error(`[${this.name}] AI formatting failed, falling back to standard:`, error);
        // Fall back to standard message
      }
    }

    // Standard message format
    return config.includeRecommendations
      ? this.buildMessageWithRecommendations(user, recommendations)
      : this.buildBasicMessage(user);
  }

  /**
   * Build message using AI formatting
   */
  private async buildAiFormattedMessage(
    user: UserFoodStatus,
    recommendations: any[],
    config: WeeklyFoodCheckConfig
  ): Promise<string> {
    const prompt = this.createAiPrompt(user, recommendations, config.daysAhead);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'HTTP-Referer': 'https://github.com/ammahmoudi/rad-telegram-bot',
        'X-Title': 'RAD Telegram Bot - Weekly Food Check',
      },
      body: JSON.stringify({
        model: config.aiModel || 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly food reminder assistant. Create concise, helpful messages in Persian about unselected food days.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const aiMessage = data.choices?.[0]?.message?.content;
    
    if (!aiMessage) {
      throw new Error('No message content in AI response');
    }

    return aiMessage.trim();
  }

  /**
   * Create AI prompt for message formatting
   */
  private createAiPrompt(
    user: UserFoodStatus,
    recommendations: any[],
    daysAhead: number
  ): string {
    const foodOptions = formatFoodOptions(user.unselectedDays);
    const hasRecommendations = recommendations.length > 0;

    let prompt = `
Create a friendly Persian (فارسی) message for a user who has ${user.upcomingUnselectedCount} unselected food days in the next ${daysAhead} days.

UNSELECTED DAYS AND OPTIONS:
${foodOptions}
`;

    if (hasRecommendations) {
      const recsText = recommendations
        .map(r => `${r.date}: ${r.recommendedFood.name} (${r.reason})`)
        .join('\n');
      
      prompt += `
RECOMMENDATIONS:
${recsText}
`;
    }

    prompt += `
Create a short, friendly reminder message in Persian (max 300 characters) that:
1. Greets the user warmly
2. Mentions it's their weekly food check
3. Lists the unselected days briefly
${hasRecommendations ? '4. Includes the recommended foods' : ''}
5. Encourages them to select food soon
6. Uses emojis appropriately (🍽️, 📅, ⚠️, 💡, etc.)
7. Uses HTML formatting (<b>, <i>) for emphasis

Keep it conversational and helpful!
`.trim();

    return prompt;
  }

  /**
   * Build message with recommendations
   */
  private buildMessageWithRecommendations(
    user: UserFoodStatus,
    recommendations: any[]
  ): string {
    const lines = [
      '📅 <b>بررسی هفتگی غذا</b>',
      '',
      'سلام! 👋',
      `تو ${user.upcomingUnselectedCount} روز از هفته آینده هنوز غذا انتخاب نکردی! ⚠️`,
      '',
    ];

    // Group by date for cleaner display
    const byDate = new Map<string, any[]>();
    for (const day of user.unselectedDays) {
      const items = byDate.get(day.date) ?? [];
      items.push(day);
      byDate.set(day.date, items);
    }

    lines.push('🍽️ <b>روزهای انتخاب نشده:</b>');
    for (const [date, items] of byDate.entries()) {
      const foodNames = items.map(i => i.food.name).join(' | ');
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('fa-IR', { weekday: 'long' });
      lines.push(`   📅 ${dayName} (${date}): ${foodNames}`);
    }
    lines.push('');

    // Add recommendations
    if (recommendations.length > 0) {
      lines.push('💡 <b>پیشنهادهای ما:</b>');
      for (const rec of recommendations) {
        const dateObj = new Date(rec.date);
        const dayName = dateObj.toLocaleDateString('fa-IR', { weekday: 'short' });
        lines.push(`   ${dayName}: <b>${rec.recommendedFood.name}</b>`);
        if (rec.reason) {
          lines.push(`      📝 ${rec.reason}`);
        }
      }
      lines.push('');
    }

    lines.push('💬 برای انتخاب سریع، اینجا پیام بده یا به پنل رستار برو! 📲');
    lines.push('');
    lines.push(`📊 آمار: ${user.upcomingUnselectedCount} از ${user.totalAvailableDays} روز انتخاب نشده`);

    return lines.join('\n');
  }

  /**
   * Build basic message without recommendations
   */
  private buildBasicMessage(user: UserFoodStatus): string {
    const lines = [
      '📅 <b>بررسی هفتگی غذا</b>',
      '',
      'سلام! 👋',
      `تو ${user.upcomingUnselectedCount} روز از هفته آینده هنوز غذا انتخاب نکردی! ⚠️`,
      '',
    ];

    // Group by date
    const byDate = new Map<string, any[]>();
    for (const day of user.unselectedDays) {
      const items = byDate.get(day.date) ?? [];
      items.push(day);
      byDate.set(day.date, items);
    }

    lines.push('🍽️ <b>روزهای انتخاب نشده:</b>');
    for (const [date, items] of byDate.entries()) {
      const foodNames = items.map(i => i.food.name).join(' | ');
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('fa-IR', { weekday: 'long' });
      lines.push(`   📅 ${dayName} (${date}): ${foodNames}`);
    }
    lines.push('');

    lines.push('💬 برای انتخاب غذا به پنل رستار مراجعه کن یا اینجا پیام بده! 📲');
    lines.push('');
    lines.push(`📊 آمار: ${user.upcomingUnselectedCount} از ${user.totalAvailableDays} روز انتخاب نشده`);

    return lines.join('\n');
  }

  /**
   * Get pending notifications
   */
  getPendingNotifications(): JobNotification[] {
    return this.pendingNotifications;
  }

  /**
   * Clear pending notifications
   */
  clearPendingNotifications(): void {
    this.pendingNotifications = [];
  }
}

// Singleton instance
export const weeklyFoodCheckJob = new WeeklyFoodCheckJob();
