/**
 * Notification Service
 * Handles sending notifications to Telegram users from scheduled jobs
 */

import type { Bot, Context } from 'grammy';
import type { NotificationPayload, NotificationResult, NotificationBatchResult } from './types.js';

// Rate limiting settings
const MESSAGES_PER_SECOND = 25; // Telegram limit is 30/sec, we use 25 for safety
const BATCH_DELAY_MS = 1000 / MESSAGES_PER_SECOND;

class NotificationService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bot: Bot<any> | null = null;
  private isInitialized = false;

  /**
   * Initialize the notification service with a bot instance
   */
  initialize<C extends Context>(bot: Bot<C>): void {
    this.bot = bot;
    this.isInitialized = true;
    console.log('[notification-service] Initialized');
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.bot !== null;
  }

  /**
   * Send a single notification
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.bot) {
      return {
        telegramUserId: payload.telegramUserId,
        success: false,
        error: 'Notification service not initialized',
      };
    }

    try {
      const message = await this.bot.api.sendMessage(
        payload.telegramUserId,
        payload.message,
        {
          parse_mode: payload.parseMode ?? 'HTML',
          disable_notification: payload.silent ?? false,
          reply_markup: payload.replyMarkup,
        }
      );

      console.log('[notification-service] Sent notification', {
        userId: payload.telegramUserId,
        messageId: message.message_id,
      });

      return {
        telegramUserId: payload.telegramUserId,
        success: true,
        messageId: message.message_id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error('[notification-service] Failed to send notification', {
        userId: payload.telegramUserId,
        error: errorMessage,
      });

      return {
        telegramUserId: payload.telegramUserId,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send notifications to multiple users with rate limiting
   */
  async sendBatch(payloads: NotificationPayload[]): Promise<NotificationBatchResult> {
    const results: NotificationResult[] = [];
    let successful = 0;
    let failed = 0;

    console.log('[notification-service] Starting batch send', { count: payloads.length });

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      
      // Rate limiting delay
      if (i > 0) {
        await this.delay(BATCH_DELAY_MS);
      }

      const result = await this.send(payload);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Log progress every 10 messages
      if ((i + 1) % 10 === 0) {
        console.log('[notification-service] Batch progress', {
          sent: i + 1,
          total: payloads.length,
          successful,
          failed,
        });
      }
    }

    console.log('[notification-service] Batch send complete', {
      total: payloads.length,
      successful,
      failed,
    });

    return {
      total: payloads.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Send a notification with retry logic
   */
  async sendWithRetry(
    payload: NotificationPayload,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<NotificationResult> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.send(payload);
      
      if (result.success) {
        return result;
      }

      lastError = result.error ?? 'Unknown error';

      // Check if error is retryable
      if (!this.isRetryableError(lastError)) {
        return result;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log('[notification-service] Retrying', {
          userId: payload.telegramUserId,
          attempt,
          delay,
        });
        await this.delay(delay);
      }
    }

    return {
      telegramUserId: payload.telegramUserId,
      success: false,
      error: `Failed after ${maxRetries} attempts: ${lastError}`,
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: string): boolean {
    const retryablePatterns = [
      'Too Many Requests',
      'ETIMEOUT',
      'ECONNRESET',
      'network',
      '429',
      '503',
      '504',
    ];

    const lowerError = error.toLowerCase();
    return retryablePatterns.some(pattern => 
      lowerError.includes(pattern.toLowerCase())
    );
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const notificationService = new NotificationService();
