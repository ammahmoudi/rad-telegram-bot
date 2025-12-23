import type { Context } from 'grammy';
import {
  getPlankaToken,
  deletePlankaToken,
  getRastarToken,
  deleteRastarToken,
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
      '� <b>Planka:</b>',
      '🔗 /link_planka - Connect your Planka account',
      '📊 /planka_status - Check Planka connection',
      '🔓 /planka_unlink - Disconnect Planka',
      '',
      '🍽️ <b>Rastar (Food Menu):</b>',
      '� /link_rastar - Connect your Rastar account',
      '�📊 /rastar_status - Check Rastar connection',
      '🔓 /rastar_unlink - Disconnect Rastar',
      '',
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
    // Check token expiry
    const now = Date.now();
    const expiresIn = Math.max(0, existingToken.expiresAt - now);
    const expiresInHours = Math.floor(expiresIn / (1000 * 60 * 60));
    
    // Token is expired
    if (expiresIn <= 0) {
      await ctx.reply(
        [
          '⚠️ <b>Token Expired</b>',
          '',
          'Your Planka access token has expired.',
          '',
          '🔄 Please re-link your account:',
          '1. Run /planka_unlink',
          '2. Then run /link_planka again',
        ].join('\n'),
        { parse_mode: 'HTML' },
      );
      return;
    }
    
    await ctx.reply(
      [
        '✅ Your Planka account is already linked!',
        '',
        `Base URL: ${existingToken.plankaBaseUrl}`,
        `Token expires in: ${expiresInHours} hours`,
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

  // Check token expiry
  const now = Date.now();
  const expiresIn = Math.max(0, token.expiresAt - now);
  const expiresInHours = Math.floor(expiresIn / (1000 * 60 * 60));
  const expiresInMinutes = Math.floor((expiresIn % (1000 * 60 * 60)) / (1000 * 60));

  // Token is expired
  if (expiresIn <= 0) {
    await ctx.reply(
      [
        '⚠️ <b>Token Expired</b>',
        '',
        `🌐 Base URL: <code>${token.plankaBaseUrl}</code>`,
        '',
        '❌ Your access token has expired and can no longer be used.',
        '',
        '🔄 <b>To reconnect:</b>',
        '1. Run /planka_unlink to remove the expired token',
        '2. Then run /link_planka to get a new token',
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
      `⏰ Token expires in: ${expiresInHours}h ${expiresInMinutes}m`,
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

// ============================================================================
// Rastar Commands
// ============================================================================

/**
 * Handle /link_rastar command
 */
export async function handleLinkRastarCommand(ctx: Context) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  console.log('[telegram-bot] /link_rastar', { telegramUserId });

  // Check if already linked
  const existingToken = await getRastarToken(telegramUserId);
  if (existingToken) {
    // Check token expiry
    const now = Date.now();
    const expiresIn = Math.max(0, existingToken.expiresAt - now);
    const expiresInHours = Math.floor(expiresIn / (1000 * 60 * 60));
    
    // Token is expired
    if (expiresIn <= 0) {
      await ctx.reply(
        [
          '⚠️ <b>Token Expired</b>',
          '',
          'Your Rastar access token has expired.',
          '',
          '🔄 Please re-link your account:',
          '1. Run /rastar_unlink',
          '2. Then run /link_rastar again',
        ].join('\n'),
        { parse_mode: 'HTML' },
      );
      return;
    }
    
    await ctx.reply(
      [
        '✅ Your Rastar account is already linked!',
        '',
        `Email: ${existingToken.email}`,
        `Token expires in: ${expiresInHours} hours`,
        '',
        '💡 To re-link your account:',
        '1. First run /rastar_unlink',
        '2. Then run /link_rastar again',
      ].join('\n'),
    );
    return;
  }

  const state = await createLinkState(telegramUserId);
  const linkUrl = `${stripTrailingSlash(LINK_PORTAL_BASE_URL)}/link/rastar?state=${encodeURIComponent(state)}`;

  console.log('[telegram-bot] /link_rastar - generated URL:', linkUrl);

  await ctx.reply(
    [
      '🔗 <b>Link Your Rastar Account</b>',
      '',
      '1️⃣ Click the link below (or copy and paste in browser):',
      `<a href="${linkUrl}">Open Secure Link Portal</a>`,
      '',
      '📋 Or copy this URL:',
      `<code>${linkUrl}</code>`,
      '',
      '2️⃣ Enter your Rastar credentials (my.rastar.company)',
      '3️⃣ Return here after successful linking',
      '',
      '⚠️ <b>Note:</b> This link expires in 10 minutes and can only be used once.',
      '',
      '🍽️ <b>After linking, you can:</b>',
      '• View daily food menus',
      '• Select your lunch choices',
      '• Manage your food selections',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
}

/**
 * Handle /rastar_status command
 */
export async function handleRastarStatusCommand(ctx: Context) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  console.log('[telegram-bot] /rastar_status', { telegramUserId });

  const token = await getRastarToken(telegramUserId);
  
  if (!token) {
    await ctx.reply(
      [
        '❌ <b>Rastar Not Connected</b>',
        '',
        '🍽️ Rastar provides access to:',
        '• View daily food menus',
        '• Select your lunch choices',
        '• Manage your food selections',
        '',
        '💡 To connect:',
        'Run /link_rastar to securely link your account',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
    return;
  }

  // Check token expiry
  const now = Date.now();
  const expiresIn = Math.max(0, token.expiresAt - now);
  const expiresInHours = Math.floor(expiresIn / (1000 * 60 * 60));
  const expiresInMinutes = Math.floor((expiresIn % (1000 * 60 * 60)) / (1000 * 60));

  // Token is expired
  if (expiresIn <= 0) {
    await ctx.reply(
      [
        '⚠️ <b>Token Expired</b>',
        '',
        `👤 Email: ${token.email}`,
        `🆔 User ID: ${token.userId}`,
        '',
        '❌ Your access token has expired and can no longer be used.',
        '',
        '🔄 <b>To reconnect:</b>',
        '1. Run /rastar_unlink to remove the expired token',
        '2. Then run /link_rastar to get a new token',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
    return;
  }

  await ctx.reply(
    [
      '✅ <b>Rastar Connected</b>',
      '',
      `👤 Email: ${token.email}`,
      `🆔 User ID: ${token.userId}`,
      `⏰ Token expires in: ${expiresInHours}h ${expiresInMinutes}m`,
      '',
      '🍽️ <b>Available Features:</b>',
      '• View daily food menus',
      '• Select lunch items',
      '• Manage your selections',
      '',
      '💬 Just chat with me to use these features!',
      'Example: "Show me today\'s menu" or "Select lunch option 2"',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
}

/**
 * Handle /rastar_unlink command
 */
export async function handleRastarUnlinkCommand(ctx: Context) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  console.log('[telegram-bot] /rastar_unlink', { telegramUserId });

  const token = await getRastarToken(telegramUserId);
  if (!token) {
    await ctx.reply(
      [
        'ℹ️ <b>Not Connected</b>',
        '',
        'Your Rastar account is not currently linked.',
        '',
        '💡 To connect:',
        'Run /link_rastar to securely link your account',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
    return;
  }

  const deleted = await deleteRastarToken(telegramUserId);
  if (deleted) {
    await ctx.reply(
      [
        '✅ <b>Rastar Disconnected</b>',
        '',
        `Account ${token.email} has been unlinked.`,
        '',
        '🔗 To reconnect later:',
        'Run /link_rastar to securely link your account',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  } else {
    await ctx.reply(
      [
        '⚠️ <b>Error</b>',
        '',
        'Could not disconnect your Rastar account.',
        'Please try again or contact support.',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  }
}
