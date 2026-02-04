/**
 * Notification Service Types
 */

export interface NotificationPayload {
  telegramUserId: string;
  message: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  silent?: boolean;
  replyMarkup?: any;
}

export interface NotificationResult {
  telegramUserId: string;
  success: boolean;
  messageId?: number;
  error?: string;
}

export interface NotificationBatchResult {
  total: number;
  successful: number;
  failed: number;
  results: NotificationResult[];
}
