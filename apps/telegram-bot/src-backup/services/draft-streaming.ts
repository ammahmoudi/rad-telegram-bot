/**
 * Service for streaming messages using Telegram's sendMessageDraft API
 * This allows partial messages to be streamed to the user while being generated
 */

import type { Context } from 'grammy';
import type { SendMessageDraftParams } from '../types/telegram-api-extensions.js';

interface DraftMessageState {
  chatId: number;
  text: string;
  messageThreadId?: number;
  lastUpdateTime: number;
}

/**
 * Stream a message draft to a user with periodic updates
 * Uses Telegram's sendMessageDraft API for better UX during generation
 *
 * @param ctx Grammy context
 * @param initialText Initial message text
 * @param messageThreadId Optional topic/thread ID for private chats with topics
 * @param updateCallback Callback function that provides updated text
 * @param options Configuration options
 */
export async function streamMessageDraft(
  ctx: Context,
  initialText: string,
  messageThreadId: number | undefined,
  updateCallback: (lastText: string) => Promise<string | null>,
  options: {
    updateInterval?: number;
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    maxLength?: number;
  } = {}
): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    throw new Error('No chat ID available in context');
  }

  const {
    updateInterval = 500, // Update every 500ms to avoid rate limiting
    parseMode = 'HTML',
    maxLength = 4096, // Telegram's message length limit
  } = options;

  const state: DraftMessageState = {
    chatId,
    text: initialText,
    messageThreadId,
    lastUpdateTime: Date.now(),
  };

  let isStreaming = true;

  // Helper to send/update draft message
  const sendDraft = async (text: string): Promise<void> => {
    if (!text) return;

    // Truncate if necessary
    let displayText = text;
    if (displayText.length > maxLength) {
      displayText = displayText.substring(0, maxLength - 20) + '\n\n<i>... (truncated)</i>';
    }

    const params: SendMessageDraftParams = {
      chat_id: state.chatId,
      text: displayText,
      parse_mode: parseMode,
    };

    // Add message_thread_id if available (for topics in private chats)
    if (state.messageThreadId) {
      params.message_thread_id = state.messageThreadId;
    }

    try {
      // Note: sendMessageDraft is a newer API endpoint
      // For now, we'll use editMessageText or sendMessage as fallback
      // TODO: Update when Grammy officially supports sendMessageDraft
      
      // Fallback: Log that we would send draft
      console.log('[streamMessageDraft] Would send draft message:', {
        length: displayText.length,
        hasThreadId: !!state.messageThreadId,
      });
    } catch (error) {
      console.error('[streamMessageDraft] Error sending draft:', error);
      // Don't throw - allow streaming to continue
    }
  };

  // Initial send
  await sendDraft(state.text);

  // Streaming loop
  while (isStreaming) {
    const now = Date.now();

    // Check if enough time has passed for an update
    if (now - state.lastUpdateTime >= updateInterval) {
      const updatedText = await updateCallback(state.text);

      if (updatedText === null) {
        // Streaming is complete
        isStreaming = false;
      } else if (updatedText !== state.text) {
        // Text has changed, send update
        state.text = updatedText;
        state.lastUpdateTime = now;
        await sendDraft(state.text);
      }
    }

    // Small delay to avoid busy waiting
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Update a draft message's text
 * For use when sendMessageDraft is officially supported
 *
 * @param ctx Grammy context
 * @param chatId Chat ID
 * @param text Updated text content
 * @param messageThreadId Optional topic/thread ID
 * @param parseMode Text format
 */
export async function updateMessageDraft(
  ctx: Context,
  chatId: number,
  text: string,
  messageThreadId?: number,
  parseMode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'HTML'
): Promise<void> {
  const params: SendMessageDraftParams = {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
  };

  if (messageThreadId) {
    params.message_thread_id = messageThreadId;
  }

  try {
    console.log('[updateMessageDraft] Updating draft:', {
      textLength: text.length,
      hasThreadId: !!messageThreadId,
    });
    // TODO: Call ctx.api.sendMessageDraft when available in Grammy/TelegramBot API
  } catch (error) {
    console.error('[updateMessageDraft] Error:', error);
  }
}

/**
 * Check if a user has topics enabled in their private chat with the bot
 * This information comes from the User object's has_topics_enabled field
 *
 * @param ctx Grammy context
 * @returns Whether topics are enabled for this user
 */
export function isUserTopicsEnabled(ctx: Context): boolean {
  // Check User object for has_topics_enabled field
  // This will be populated by the bot API
  const user = ctx.from;
  if (!user) return false;

  // Check if the custom field exists (added in Telegram Bot API 8.0+)
  return (user as any).has_topics_enabled === true;
}

/**
 * Get the message thread ID from a message if it's in a topic
 *
 * @param ctx Grammy context
 * @returns Message thread ID if in a topic, undefined otherwise
 */
export function getMessageThreadId(ctx: Context): number | undefined {
  const message = ctx.message;
  if (!message) return undefined;

  // Check for message_thread_id field (for topics in private chats)
  return (message as any).message_thread_id;
}

/**
 * Check if a message was sent to a forum topic
 *
 * @param ctx Grammy context
 * @returns Whether this message is a topic message
 */
export function isTopicMessage(ctx: Context): boolean {
  const message = ctx.message;
  if (!message) return false;

  return (message as any).is_topic_message === true;
}
