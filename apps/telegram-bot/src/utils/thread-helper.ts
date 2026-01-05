import type { BotContext } from '../bot.js';
import { getSystemConfig } from '@rad/shared';

/**
 * Get chat mode from system config or environment
 */
async function getChatMode(): Promise<'thread' | 'simple'> {
  // Try system config first (admin panel setting)
  const configMode = await getSystemConfig('CHAT_MODE');
  if (configMode) {
    const mode = configMode.toLowerCase();
    if (mode === 'simple') return 'simple';
    if (mode === 'thread') return 'thread';
  }
  
  // Fall back to environment variable
  const envMode = process.env.CHAT_MODE?.toLowerCase();
  if (envMode === 'simple') return 'simple';
  
  // Default to thread mode
  return 'thread';
}

/**
 * Get the current thread ID from context
 * Returns undefined if in simple mode
 */
export async function getCurrentThreadId(ctx: BotContext): Promise<number | undefined> {
  const chatMode = await getChatMode();
  
  // In simple mode, never use thread IDs
  if (chatMode === 'simple') {
    return undefined;
  }
  
  // In thread mode, return thread ID from context
  return (
    ctx.session?.currentChatTopicId ||
    ctx.message?.message_thread_id ||
    ctx.callbackQuery?.message?.message_thread_id ||
    ctx.msg?.message_thread_id
  );
}

/**
 * Create reply options with thread context
 * Respects chat mode - only adds thread ID in thread mode
 */
export async function withThreadContext(
  ctx: BotContext,
  options: Record<string, any> = {}
): Promise<Record<string, any>> {
  const threadId = await getCurrentThreadId(ctx);
  
  if (threadId) {
    return {
      ...options,
      message_thread_id: threadId,
    };
  }
  
  return options;
}
