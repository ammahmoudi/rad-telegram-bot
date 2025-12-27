import type { Context } from 'grammy';
import { Keyboard, InlineKeyboard } from 'grammy';
import {
  getPlankaToken,
  deletePlankaToken,
  getRastarToken,
  deleteRastarToken,
  createLinkState,
  createNewChatSession,
  listUserSessions,
  getUserLanguage,
  validatePlankaToken,
} from '@rad/shared';
import { getAiClient } from '../services/ai-client.js';
import { stripTrailingSlash } from '../utils/formatting.js';
import { getUserI18n } from '../i18n.js';
import {
  getMainMenuKeyboard,
  getPlankaConnectedKeyboard,
  getPlankaNotConnectedKeyboard,
  getPlankaExpiredKeyboard,
  getRastarConnectedKeyboard,
  getRastarNotConnectedKeyboard,
  getRastarExpiredKeyboard,
} from './keyboards.js';

const LINK_PORTAL_BASE_URL = process.env.LINK_PORTAL_BASE_URL || 'http://localhost:8787';

/**
 * Handle /start command
 */
export async function handleStartCommand(ctx: Context) {
  console.log('[telegram-bot] /start', { fromId: ctx.from?.id, username: ctx.from?.username });
  
  const telegramUserId = String(ctx.from?.id ?? '');
  const language = await getUserLanguage(telegramUserId);
  const name = ctx.from?.first_name || 'there';
  const client = await getAiClient();
  const hasAI = client !== null;
  
  // Build reply keyboard with user's language
  const keyboard = getMainMenuKeyboard(language);
  
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
      '',
      '⌨️ <b>Quick Access:</b> Use the buttons below to quickly access common features!',
    ].join('\n'),
    { parse_mode: 'HTML', reply_markup: keyboard },
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

  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  
  // Check if already linked
  const existingToken = await getPlankaToken(telegramUserId);
  if (existingToken) {
    const keyboard = getPlankaConnectedKeyboard(language);
    await ctx.reply(
      [
        t('planka.already_linked'),
        '',
        t('planka.base_url', { url: existingToken.plankaBaseUrl }),
        '',
        t('planka.relink_instructions'),
        t('planka.step1'),
        t('planka.step2'),
      ].join('\n'),
      { reply_markup: keyboard },
    );
    return;
  }

  const state = await createLinkState(telegramUserId);
  const linkUrl = `${stripTrailingSlash(LINK_PORTAL_BASE_URL)}/link/planka?state=${encodeURIComponent(state)}`;

  console.log('[telegram-bot] /planka_link - generated URL:', linkUrl);

  const keyboard = getPlankaNotConnectedKeyboard(language);
  await ctx.reply(
    [
      t('planka.link_title'),
      '',
      t('planka.link_step1'),
      `<a href="${linkUrl}">${t('planka.link_portal')}</a>`,
      '',
      t('planka.link_copy'),
      `<code>${linkUrl}</code>`,
      '',
      t('planka.link_step2'),
      t('planka.link_step3'),
      '',
      t('planka.link_expires'),
      t('planka.link_security'),
      '',
      `💡 <i>${t('planka.link_localhost_note')}</i>`,
    ].join('\n'),
    { 
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      reply_markup: keyboard
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

  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  const token = await getPlankaToken(telegramUserId);
  
  if (!token) {
    const keyboard = getPlankaNotConnectedKeyboard(language);
    
    await ctx.reply(
      [
        t('planka.not_connected'),
        '',
        t('planka.not_connected_message'),
        '',
        t('planka.connect_instruction'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
    return;
  }

  // Validate that the token actually works
  const isValid = await validatePlankaToken(telegramUserId);
  
  if (!isValid) {
    const keyboard = getPlankaExpiredKeyboard(language);
    
    await ctx.reply(
      [
        '⚠️ <b>' + t('planka.token_invalid') + '</b>',
        '',
        `🌐 ${t('planka.base_url', { url: token.plankaBaseUrl })}`,
        '',
        '❌ ' + t('planka.token_invalid_message'),
        '',
        '🔄 <b>' + t('planka.reconnect_steps') + '</b>',
        '1. ' + t('planka.unlink_first'),
        '2. ' + t('planka.link_again'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
    return;
  }

  const keyboard = getPlankaConnectedKeyboard(language);

  await ctx.reply(
    [
      t('planka.connected'),
      '',
      `🌐 ${t('planka.base_url', { url: token.plankaBaseUrl })}`,
      '',
      t('planka.can_use'),
      '',
      t('planka.disconnect_command'),
    ].join('\n'),
    { parse_mode: 'HTML', reply_markup: keyboard },
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

  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  const removed = await deletePlankaToken(telegramUserId);
  
  const keyboard = getPlankaNotConnectedKeyboard(language);
  if (removed) {
    await ctx.reply(
      [
        t('planka.unlinked'),
        '',
        t('planka.unlinked_message'),
        '',
        t('planka.connect_instruction'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
  } else {
    await ctx.reply(
      [
        t('planka.no_account'),
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

  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  
  // Check if already linked
  const existingToken = await getRastarToken(telegramUserId);
  if (existingToken) {
    // Check token expiry
    const now = Date.now();
    const expiresIn = Math.max(0, existingToken.expiresAt - now);
    const expiresInHours = Math.floor(expiresIn / (1000 * 60 * 60));
    const expiresInMinutes = Math.floor((expiresIn % (1000 * 60 * 60)) / (1000 * 60));
    
    // Token is expired
    if (expiresIn <= 0) {
      const keyboard = getRastarExpiredKeyboard(language);
      await ctx.reply(
        [
          t('rastar.token_expired'),
          '',
          t('rastar.token_expired_message'),
          '',
          t('rastar.reconnect_title'),
          t('rastar.reconnect_step1'),
          t('rastar.reconnect_step2'),
        ].join('\n'),
        { parse_mode: 'HTML', reply_markup: keyboard },
      );
      return;
    }
    
    const keyboard = getRastarConnectedKeyboard(language);
    await ctx.reply(
      [
        t('rastar.already_linked'),
        '',
        `${t('rastar.email')}: ${existingToken.email}`,
        t('rastar.token_expires_in', { hours: expiresInHours, minutes: expiresInMinutes }),
        '',
        t('rastar.relink_instructions'),
        t('rastar.step1'),
        t('rastar.step2'),
      ].join('\n'),
      { reply_markup: keyboard },
    );
    return;
  }

  const state = await createLinkState(telegramUserId);
  const linkUrl = `${stripTrailingSlash(LINK_PORTAL_BASE_URL)}/link/rastar?state=${encodeURIComponent(state)}`;

  console.log('[telegram-bot] /link_rastar - generated URL:', linkUrl);

  const keyboard = getRastarNotConnectedKeyboard(language);
  await ctx.reply(
    [
      t('rastar.link_title'),
      '',
      t('rastar.link_step1'),
      `<a href="${linkUrl}">${t('rastar.link_portal')}</a>`,
      '',
      t('rastar.link_copy'),
      `<code>${linkUrl}</code>`,
      '',
      t('rastar.link_step2'),
      t('rastar.link_step3'),
      '',
      t('rastar.link_expires'),
      '',
      t('rastar.after_linking'),
      t('rastar.feature_menu'),
      t('rastar.feature_select'),
      t('rastar.feature_manage'),
    ].join('\n'),
    { parse_mode: 'HTML', reply_markup: keyboard },
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

  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  const token = await getRastarToken(telegramUserId);
  
  if (!token) {
    const keyboard = getRastarNotConnectedKeyboard(language);
    
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
      { parse_mode: 'HTML', reply_markup: keyboard },
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
    const keyboard = getRastarExpiredKeyboard(language);
    
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
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
    return;
  }

  const keyboard = getRastarConnectedKeyboard(language);

  await ctx.reply(
    [
      t('rastar.connected'),
      '',
      `👤 ${t('rastar.email')}: ${token.email}`,
      t('rastar.user_id', { userId: token.userId }),
      t('rastar.token_expires_in', { hours: expiresInHours, minutes: expiresInMinutes }),
      '',
      t('rastar.available_features'),
      t('rastar.feature_menu'),
      t('rastar.feature_select'),
      t('rastar.feature_manage'),
      '',
      t('rastar.chat_instruction'),
      t('rastar.example'),
    ].join('\n'),
    { parse_mode: 'HTML', reply_markup: keyboard },
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

  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  const token = await getRastarToken(telegramUserId);
  
  const keyboard = getRastarNotConnectedKeyboard(language);
  if (!token) {
    await ctx.reply(
      [
        t('rastar.not_connected'),
        '',
        t('rastar.not_connected_message'),
        '',
        t('rastar.connect_instruction'),
        t('rastar.connect_command'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
    return;
  }

  const deleted = await deleteRastarToken(telegramUserId);
  if (deleted) {
    await ctx.reply(
      [
        t('rastar.disconnected'),
        '',
        t('rastar.disconnected_message', { email: token.email }),
        '',
        t('rastar.reconnect_later'),
        t('rastar.connect_command'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
  } else {
    await ctx.reply(
      [
        t('rastar.error'),
        '',
        t('rastar.error_message'),
        '',
        t('rastar.try_again'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
  }
}

/**
 * Handle /menu command - Show keyboard menu
 */
export async function handleMenuCommand(ctx: Context) {
  const telegramUserId = String(ctx.from?.id ?? '');
  const language = await getUserLanguage(telegramUserId);
  const keyboard = getMainMenuKeyboard(language);
  
  await ctx.reply(
    [
      '⌨️ <b>Quick Access Menu</b>',
      '',
      'Use the buttons below to quickly access features:',
      '',
      '📊 <b>Planka Status</b> - Check Planka connection',
      '🍽️ <b>Rastar Status</b> - Check Rastar connection',
      '📋 <b>Today\'s Menu</b> - View food options',
      '⚠️ <b>Unselected Days</b> - Check missing food selections',
      '🔴 <b>Delayed Tasks</b> - View overdue Planka tasks',
      '📂 <b>My Boards</b> - View Planka boards',
      '💬 <b>New Chat</b> - Start fresh conversation',
      '📚 <b>History</b> - View chat history',
      '',
      'Or just type your message naturally!',
    ].join('\n'),
    { parse_mode: 'HTML', reply_markup: keyboard },
  );
}
