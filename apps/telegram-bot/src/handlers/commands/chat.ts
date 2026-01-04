import type { BotContext } from '../../bot.js';
import {
  getUserLanguage,
  createNewChatSession,
  listUserSessions,
} from '@rad/shared';
import { getAiClient } from '../../services/ai-client.js';

/**
 * Handle /new_chat command
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

  // Create new session
  await createNewChatSession(telegramUserId);
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

  await createNewChatSession(telegramUserId);
  
  await ctx.reply(ctx.t('chat-cleared'), {
    parse_mode: 'HTML',
  });
}
