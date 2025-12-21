import type { Context } from 'grammy';
import {
  getPlankaToken,
  deletePlankaToken,
  createLinkState,
  createNewChatSession,
  listUserSessions,
} from '@rastar/shared';
import { getAiClient } from '../services/ai-client.js';
import { stripTrailingSlash } from '../utils/formatting.js';

const LINK_PORTAL_BASE_URL = process.env.LINK_PORTAL_BASE_URL || 'http://localhost:8787';

/**
 * Handle /start command
 */
export async function handleStartCommand(ctx: Context) {
  console.log('[telegram-bot] /start', { fromId: ctx.from?.id, username: ctx.from?.username });
  
  const name = ctx.from?.first_name || 'there';
  const client = await getAiClient();
  const hasAI = client !== null;
  
  await ctx.reply(
    [
      `👋 <b>Hi ${name}!</b>`,
      '',
      hasAI
        ? '🤖 I\'m an AI assistant that can help you manage your Planka tasks right from Telegram.'
        : 'I can help you manage your Planka tasks right from Telegram.',
      '',
      '🔧 <b>Available Commands:</b>',
      '',
      '🔗 /link_planka - Connect your Planka account',
      '📊 /planka_status - Check connection status',
      '🔓 /planka_unlink - Disconnect your account',
      ...(hasAI
        ? [
            '💬 /new_chat - Start a new conversation',
            '📚 /history - View your chat sessions',
            '🗑️ /clear_chat - Clear current conversation',
          ]
        : []),
      '',
      '💡 <b>Getting Started:</b>',
      hasAI
        ? 'Just send me a message to start chatting! I can help you with Planka tasks once you connect your account with /link_planka'
        : 'Start by running /link_planka to connect your account!',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
}

/**
 * Handle /link_planka command
 */
export async function handleLinkPlankaCommand(ctx: Context) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  console.log('[telegram-bot] /link_planka', { telegramUserId });

  // Check if already linked
  const existingToken = await getPlankaToken(telegramUserId);
  if (existingToken) {
    await ctx.reply(
      [
        '✅ Your Planka account is already linked!',
        '',
        `Base URL: ${existingToken.plankaBaseUrl}`,
        '',
        '💡 To re-link your account:',
        '1. First run /planka_unlink',
        '2. Then run /link_planka again',
      ].join('\n'),
    );
    return;
  }

  const state = await createLinkState(telegramUserId);
  const linkUrl = `${stripTrailingSlash(LINK_PORTAL_BASE_URL)}/link/planka?state=${encodeURIComponent(state)}`;

  console.log('[telegram-bot] /planka_link - generated URL:', linkUrl);

  await ctx.reply(
    [
      '🔗 <b>Link Your Planka Account</b>',
      '',
      '1️⃣ Click the link below (or copy and paste in browser):',
      `<a href="${linkUrl}">Open Secure Link Portal</a>`,
      '',
      '📋 Or copy this URL:',
      `<code>${linkUrl}</code>`,
      '',
      '2️⃣ Enter your Planka credentials',
      '3️⃣ Return here after successful linking',
      '',
      '⏱️ This link expires in 10 minutes',
      '🔒 Your password is never stored - only used to get an access token',
      '',
      '💡 <i>Note: Localhost links may not be clickable - use the URL above</i>',
    ].join('\n'),
    { 
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true }
    },
  );
}

/**
 * Handle /planka_status command
 */
export async function handlePlankaStatusCommand(ctx: Context) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  console.log('[telegram-bot] /planka_status', { telegramUserId });

  const token = await getPlankaToken(telegramUserId);
  if (!token) {
    await ctx.reply(
      [
        '❌ <b>Not Connected</b>',
        '',
        'Your Planka account is not linked yet.',
        '',
        '🔗 Run /link_planka to connect your account',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
    return;
  }

  await ctx.reply(
    [
      '✅ <b>Connected</b>',
      '',
      `🌐 Base URL: <code>${token.plankaBaseUrl}</code>`,
      '',
      '💡 You can now use Planka commands in this bot',
      '',
      'To disconnect: /planka_unlink',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
}

/**
 * Handle /planka_unlink command
 */
export async function handlePlankaUnlinkCommand(ctx: Context) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  console.log('[telegram-bot] /planka_unlink', { telegramUserId });

  const removed = await deletePlankaToken(telegramUserId);
  
  if (removed) {
    await ctx.reply(
      [
        '✅ <b>Account Unlinked</b>',
        '',
        'Your Planka account has been disconnected.',
        '',
        '🔗 Run /link_planka to connect again',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  } else {
    await ctx.reply(
      [
        'ℹ️ <b>No Account Linked</b>',
        '',
        'There was no Planka account connected to unlink.',
        '',
        '🔗 Run /link_planka to connect an account',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  }
}

/**
 * Handle /new_chat command
 */
export async function handleNewChatCommand(ctx: Context) {
  const client = await getAiClient();
  if (!client) {
    await ctx.reply('❌ AI chat is not configured. Please set OPENROUTER_API_KEY in admin panel.');
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  // Create new session
  await createNewChatSession(telegramUserId);
  await ctx.reply(
    [
      '✨ <b>New Chat Started</b>',
      '',
      '🧹 Previous conversation history has been cleared.',
      '💬 Send me a message to start a fresh conversation!',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
}

/**
 * Handle /history command
 */
export async function handleHistoryCommand(ctx: Context) {
  const client = await getAiClient();
  if (!client) {
    await ctx.reply('❌ AI chat is not configured.');
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  const sessions = await listUserSessions(telegramUserId);
  
  if (sessions.length === 0) {
    await ctx.reply('📚 No chat sessions yet. Send me a message to start!');
    return;
  }

  const sessionList = sessions
    .slice(0, 5)
    .map((s: any, idx: number) => {
      const date = new Date(s.updatedAt).toLocaleDateString();
      const time = new Date(s.updatedAt).toLocaleTimeString();
      const msgCount = s.messageCount || 0;
      return `${idx + 1}. ${date} ${time} - ${msgCount} messages`;
    })
    .join('\n');

  await ctx.reply(
    `📚 <b>Recent Chat Sessions:</b>\n\n${sessionList}\n\n<i>Showing ${Math.min(5, sessions.length)} of ${sessions.length} sessions</i>`,
    { parse_mode: 'HTML' },
  );
}

/**
 * Handle /clear_chat command
 */
export async function handleClearChatCommand(ctx: Context) {
  const client = await getAiClient();
  if (!client) {
    await ctx.reply('❌ AI chat is not configured.');
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  await createNewChatSession(telegramUserId);
  await ctx.reply('🗑️ <b>Chat cleared!</b>\n\nStarting fresh. Send me a message!', {
    parse_mode: 'HTML',
  });
}
