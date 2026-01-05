/**
 * Chat management commands for thread-based sessions
 * Clear Chat functionality - mode-aware (thread vs simple)
 */

import type { BotContext } from '../../bot.js';
import { getPrisma, getSystemConfig } from '@rad/shared';

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
 * Handle "Clear Chat" - Behavior depends on chat mode:
 * - Thread mode: Delete the current topic/thread
 * - Simple mode: Clear AI history only (keep messages visible)
 */
export async function handleClearChatCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) return;

  const chatMode = await getChatMode();
  
  if (chatMode === 'simple') {
    // Simple mode: Just clear AI history, don't delete messages
    try {
      const prisma = getPrisma();
      // Delete all chat sessions and messages for this user
      await prisma.chatSession.deleteMany({
        where: { telegramUserId }
      });
      
      // Clear session data
      if (ctx.session) {
        ctx.session.currentChatTopicId = undefined;
        ctx.session.topicContext = undefined;
        if (ctx.session.threadSessions) {
          ctx.session.threadSessions = {};
        }
      }
      
      const language = ctx.session?.language || 'fa';
      const { t } = await import('../../utils/i18n-helper.js');
      
      await ctx.reply(
        t(language, 'chat-history-cleared'),
        { parse_mode: 'HTML' }
      );
      
      console.log('[chat-management] Cleared AI history for user:', telegramUserId);
    } catch (error) {
      console.error('[chat-management] Failed to clear history:', error);
      await ctx.reply('❌ Failed to clear chat history. Please try again.');
    }
    return;
  }

  // Thread mode: Delete the current topic/thread
  const topicId = ctx.message?.message_thread_id || ctx.callbackQuery?.message?.message_thread_id;
  
  if (!topicId) {
    await ctx.reply(
      '💡 <b>This command only works inside a topic/thread.</b>\n\n' +
      'To delete a thread:\n' +
      '1. Open the thread you want to delete\n' +
      '2. Use /clear_chat inside that thread',
      { parse_mode: 'HTML' }
    );
    return;
  }

  try {
    // Delete the topic (Bot API 9.3+ supports deleteForumTopic in private chats)
    if (ctx.chat?.type === 'private') {
      await ctx.api.deleteForumTopic(ctx.chat.id, topicId);
      console.log('[chat-management] Deleted topic:', topicId);
      
      // Clear the session data for this topic
      if (ctx.session) {
        if (ctx.session.threadSessions && topicId) {
          delete ctx.session.threadSessions[topicId];
        }
        if (ctx.session.currentChatTopicId === topicId) {
          ctx.session.currentChatTopicId = undefined;
          ctx.session.topicContext = undefined;
        }
      }
      
      // Delete database records for this thread
      const prisma = getPrisma();
      await prisma.chatSession.deleteMany({
        where: {
          telegramUserId,
          threadId: BigInt(topicId)
        }
      });
      
      // Note: Can't send confirmation to deleted topic - topic is now gone
      console.log('[chat-management] Topic deleted successfully');
    }
  } catch (error: any) {
    console.error('[chat-management] Failed to delete topic:', {
      error: error.message,
      topicId,
      description: error.description
    });
    
    const errorMsg = error?.description?.includes('TOPIC_ID_INVALID')
      ? '⚠️ This thread cannot be deleted. Please make sure you\'re inside a valid topic thread.'
      : '❌ Failed to delete this thread. Make sure you have permission to manage topics.';
    
    await ctx.reply(errorMsg, { 
      parse_mode: 'HTML', 
      message_thread_id: topicId 
    });
  }
}
