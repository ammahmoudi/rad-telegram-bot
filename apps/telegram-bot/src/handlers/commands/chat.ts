import type { BotContext } from '../../bot.js';
import {
  getUserLanguage,
  createNewChatSession,
  listUserSessions,
} from '@rad/shared';
import { getAiClient } from '../../services/ai-client.js';

/**
 * Handle /new_chat command
 * Only works in simple mode - in thread mode, each thread is already a separate session
 */
export async function handleNewChatCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(ctx.t('errors-user-not-identified'));
    return;
  }

  const client = await getAiClient();
  if (!client) {
    await ctx.reply(ctx.t('errors-ai-not-configured'));
    return;
  }

  // Check chat mode - this command only works in simple mode
  const { getSystemConfig } = await import('@rad/shared');
  const chatMode = await getSystemConfig('CHAT_MODE') || process.env.CHAT_MODE || 'thread';
  const isSimpleMode = chatMode.toLowerCase() === 'simple';
  
  if (!isSimpleMode) {
    await ctx.reply(ctx.t('chat-simple-mode-only'), { parse_mode: 'HTML' });
    return;
  }
  
  // Create new session (simple mode only, no threadId)
  await createNewChatSession(telegramUserId, null);
  
  console.log('[new_chat] Created new session in simple mode:', { telegramUserId });
  
  await ctx.reply(
    [
      '✨ <b>' + ctx.t('chat-new-started') + '</b>',
      '',
      '🧹 ' + ctx.t('chat-history-cleared'),
      '💬 ' + ctx.t('chat-send-message'),
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
}

/**
 * Handle /history command
 */
export async function handleHistoryCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(ctx.t('errors-user-not-identified'));
    return;
  }

  const client = await getAiClient();
  if (!client) {
    await ctx.reply(ctx.t('errors-ai-not-configured-short'));
    return;
  }

  const sessions = await listUserSessions(telegramUserId);
  
  if (sessions.length === 0) {
    await ctx.reply(ctx.t('chat-no-sessions'));
    return;
  }

  const sessionList = sessions
    .slice(0, 5)
    .map((s: any, idx: number) => {
      const date = new Date(s.updatedAt).toLocaleDateString();
      const time = new Date(s.updatedAt).toLocaleTimeString();
      const msgCount = s.messageCount || 0;
      return `${idx + 1}. ${date} ${time} - ${msgCount} ${ctx.t('chat-messages')}`;
    })
    .join('\n');

  await ctx.reply(
    `📚 <b>${ctx.t('chat-recent-sessions')}</b>\n\n${sessionList}\n\n<i>${ctx.t('chat-showing', { shown: Math.min(5, sessions.length), total: sessions.length })}</i>`,
    { parse_mode: 'HTML' },
  );
}

/**
 * Handle /clear_chat command
 * Only works in simple mode - creates a new session to clear chat history
 * In thread mode, users should create a new thread for a fresh conversation
 */
export async function handleClearChatCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(ctx.t('errors-user-not-identified'));
    return;
  }

  const client = await getAiClient();
  if (!client) {
    await ctx.reply(ctx.t('errors-ai-not-configured-short'));
    return;
  }

  // Check chat mode - this command only works in simple mode
  const { getSystemConfig } = await import('@rad/shared');
  const chatMode = await getSystemConfig('CHAT_MODE') || process.env.CHAT_MODE || 'thread';
  const isSimpleMode = chatMode.toLowerCase() === 'simple';
  
  if (!isSimpleMode) {
    await ctx.reply(ctx.t('chat-thread-mode-info'), { parse_mode: 'HTML' });
    return;
  }
  
  // Create new session (simple mode only, no threadId)
  await createNewChatSession(telegramUserId, null);
  
  console.log('[clear_chat] Created new session in simple mode:', { telegramUserId });
  
  await ctx.reply(ctx.t('chat-cleared'), {
    parse_mode: 'HTML',
  });
}
