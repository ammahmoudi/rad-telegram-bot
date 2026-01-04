import type { BotContext } from '../bot.js';
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
import {
  getMainMenuKeyboard,
  getPlankaConnectedKeyboard,
  getPlankaNotConnectedKeyboard,
  getPlankaExpiredKeyboard,
  getRastarConnectedKeyboard,
  getRastarNotConnectedKeyboard,
  getRastarExpiredKeyboard,
} from './keyboards.js';

const LINK_PORTAL_BASE_URL = process.env.LINK_PORTAL_URL || 'http://localhost:3002';

/**
 * Handle /start command
 */
export async function handleStartCommand(ctx: BotContext) {
  console.log('[telegram-bot] /start', { fromId: ctx.from?.id, username: ctx.from?.username });
  
  const telegramUserId = String(ctx.from?.id ?? '');
  const language = await getUserLanguage(telegramUserId);
  const name = ctx.from?.first_name || 'there';
  const client = await getAiClient();
  const hasAI = client !== null;
  
  // Create/update user in database
  try {
    const { getPrisma } = await import('@rad/shared');
    const prisma = getPrisma();
    const now = Date.now();
    await prisma.telegramUser.upsert({
      where: { id: telegramUserId },
      update: {
        firstName: ctx.from?.first_name || null,
        lastName: ctx.from?.last_name || null,
        username: ctx.from?.username || null,
        lastSeenAt: now,
        updatedAt: now,
      },
      create: {
        id: telegramUserId,
        firstName: ctx.from?.first_name || null,
        lastName: ctx.from?.last_name || null,
        username: ctx.from?.username || null,
        role: 'user',
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (dbError) {
    console.error('[telegram-bot] Could not create/update user:', dbError);
  }
  
  // Build reply keyboard with user's language
  const keyboard = getMainMenuKeyboard(language);
  
  // Get welcome message from user's pack or default pack
  const { getWelcomeMessage } = await import('../config/welcome-messages.js');
  const welcomeMessage = await getWelcomeMessage(language as 'fa' | 'en', telegramUserId, name);
  
  await ctx.reply(welcomeMessage, { parse_mode: 'HTML', reply_markup: keyboard });
}

/**
 * Handle /link_planka command
 */
export async function handleLinkPlankaCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  console.log('[telegram-bot] /link_planka', { telegramUserId });

  const language = await getUserLanguage(telegramUserId);
  
  // Check if already linked
  const existingToken = await getPlankaToken(telegramUserId);
  if (existingToken) {
    const keyboard = getPlankaConnectedKeyboard(language);
    await ctx.reply(
      [
        ctx.t('planka-already-linked'),
        '',
        ctx.t('planka-base-url', { url: existingToken.plankaBaseUrl }),
        '',
        ctx.t('planka-relink-instructions'),
        ctx.t('planka-step1'),
        ctx.t('planka-step2'),
      ].join('\n'),
      { reply_markup: keyboard },
    );
    return;
  }

  const state = await createLinkState(telegramUserId);
  const linkUrl = `${stripTrailingSlash(LINK_PORTAL_BASE_URL)}/link/planka?state=${encodeURIComponent(state)}`;

  console.log('[telegram-bot] /planka_link - generated URL:', linkUrl);

  const isLocalhost = linkUrl.includes('localhost') || linkUrl.includes('127.0.0.1');
  const keyboard = getPlankaNotConnectedKeyboard(language, linkUrl);
  
  // Different message format for localhost vs production
  const messageLines = [
    ctx.t('planka-link-title'),
    '',
  ];
  
  if (isLocalhost) {
    // For localhost, just show the copyable link
    messageLines.push(
      '📋 ' + ctx.t('planka-link-copy'),
      `<code>${linkUrl}</code>`,
      '',
      '💡 ' + ctx.t('planka-link-localhost-note'),
    );
  } else {
    // For production, show clickable link and copyable version
    messageLines.push(
      ctx.t('planka-link-step1'),
      `<a href="${linkUrl}">${ctx.t('planka-link-portal')}</a>`,
      '',
      ctx.t('planka-link-copy'),
      `<code>${linkUrl}</code>`,
    );
  }
  
  messageLines.push(
    '',
    ctx.t('planka-link-step2'),
    ctx.t('planka-link-step3'),
    '',
    ctx.t('planka-link-expires'),
    ctx.t('planka-link-security'),
  );
  
  await ctx.reply(
    messageLines.join('\n'),
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
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('callback_errors.user_not_identified'));
    return;
  }

  const client = await getAiClient();
  if (!client) {
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('command_errors.ai_not_configured'));
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
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('callback_errors.user_not_identified'));
    return;
  }

  const client = await getAiClient();
  if (!client) {
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('command_errors.ai_not_configured_short'));
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
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('callback_errors.user_not_identified'));
    return;
  }

  const client = await getAiClient();
  if (!client) {
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('command_errors.ai_not_configured_short'));
    return;
  }

  await createNewChatSession(telegramUserId);
  
  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  await ctx.reply(t('command_errors.chat_cleared'), {
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

  const isLocalhost = linkUrl.includes('localhost') || linkUrl.includes('127.0.0.1');
  const keyboard = getRastarNotConnectedKeyboard(language, linkUrl);
  
  // Different message format for localhost vs production
  const messageLines = [
    t('rastar.link_title'),
    '',
  ];
  
  if (isLocalhost) {
    // For localhost, just show the copyable link
    messageLines.push(
      '📋 ' + t('rastar.link_copy'),
      `<code>${linkUrl}</code>`,
      '',
      '💡 ' + t('rastar.link_localhost_note'),
    );
  } else {
    // For production, show clickable link and copyable version
    messageLines.push(
      t('rastar.link_step1'),
      `<a href="${linkUrl}">${t('rastar.link_portal')}</a>`,
      '',
      t('rastar.link_copy'),
      `<code>${linkUrl}</code>`,
    );
  }
  
  messageLines.push(
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
  );
  
  await ctx.reply(
    messageLines.join('\n'),
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
        `⚠️ <b>${t('rastar.token_expired')}</b>`,
        '',
        `👤 ${t('rastar.email')}: ${token.email}`,
        `🆔 ${t('rastar.user_id_label')}: ${token.userId}`,
        '',
        `❌ ${t('rastar.token_expired_message')}`,
        '',
        `🔄 <b>${t('rastar.reconnect_instructions')}</b>`,
        `1. ${t('rastar.reconnect_step1')}`,
        `2. ${t('rastar.reconnect_step2')}`,
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
