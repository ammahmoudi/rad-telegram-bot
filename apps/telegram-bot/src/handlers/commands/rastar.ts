import type { BotContext } from '../../bot.js';
import {
  getRastarToken,
  deleteRastarToken,
  getUserLanguage,
  createLinkState,
} from '@rad/shared';
import { stripTrailingSlash } from '../../utils/formatting.js';
import {
  getRastarConnectedKeyboard,
  getRastarNotConnectedKeyboard,
  getRastarExpiredKeyboard,
} from '../keyboards.js';

const LINK_PORTAL_BASE_URL = process.env.LINK_PORTAL_URL || 'http://localhost:3002';

/**
 * Handle /link_rastar command
 */
export async function handleLinkRastarCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(ctx.t('errors-user-not-identified'));
    return;
  }

  console.log('[telegram-bot] /link_rastar', { telegramUserId });

  const language = await getUserLanguage(telegramUserId);
  
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
          ctx.t('rastar-token-expired'),
          '',
          ctx.t('rastar-token-expired-message'),
          '',
          ctx.t('rastar-reconnect-title'),
          ctx.t('rastar-reconnect-step1'),
          ctx.t('rastar-reconnect-step2'),
        ].join('\n'),
        { parse_mode: 'HTML', reply_markup: keyboard },
      );
      return;
    }
    
    const keyboard = getRastarConnectedKeyboard(language);
    await ctx.reply(
      [
        ctx.t('rastar-already-linked'),
        '',
        `${ctx.t('rastar-email')}: ${existingToken.email}`,
        ctx.t('rastar-token-expires-in', { hours: expiresInHours, minutes: expiresInMinutes }),
        '',
        ctx.t('rastar-relink-instructions'),
        ctx.t('rastar-step1'),
        ctx.t('rastar-step2'),
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
    ctx.t('rastar-link-title'),
    '',
  ];
  
  if (isLocalhost) {
    // For localhost, just show the copyable link
    messageLines.push(
      '📋 ' + ctx.t('rastar-link-copy'),
      `<code>${linkUrl}</code>`,
      '',
      '💡 ' + ctx.t('rastar-link-localhost-note'),
    );
  } else {
    // For production, show clickable link and copyable version
    messageLines.push(
      ctx.t('rastar-link-step1'),
      `<a href="${linkUrl}">${ctx.t('rastar-link-portal')}</a>`,
      '',
      ctx.t('rastar-link-copy'),
      `<code>${linkUrl}</code>`,
    );
  }
  
  messageLines.push(
    '',
    ctx.t('rastar-link-step2'),
    ctx.t('rastar-link-step3'),
    '',
    ctx.t('rastar-link-expires'),
    '',
    ctx.t('rastar-after-linking'),
    ctx.t('rastar-feature-menu'),
    ctx.t('rastar-feature-select'),
    ctx.t('rastar-feature-manage'),
  );
  
  await ctx.reply(
    messageLines.join('\n'),
    { parse_mode: 'HTML', reply_markup: keyboard },
  );
}

/**
 * Show Rastar status (single source of truth)
 * Used by both /rastar_status command and menu buttons
 */
export async function showRastarStatus(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(ctx.t('errors-user-not-identified'));
    return;
  }

  const language = await getUserLanguage(telegramUserId);
  const token = await getRastarToken(telegramUserId);
  
  if (!token) {
    // Not connected - directly start link conversation
    return handleLinkRastarCommand(ctx);
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
        `⚠️ <b>${ctx.t('rastar-token-expired')}</b>`,
        '',
        `👤 ${ctx.t('rastar-email')}: ${token.email}`,
        `🆔 ${ctx.t('rastar-user-id-label')}: ${token.userId}`,
        '',
        `❌ ${ctx.t('rastar-token-expired-message')}`,
        '',
        `🔄 <b>${ctx.t('rastar-reconnect-instructions')}</b>`,
        `1. ${ctx.t('rastar-reconnect-step1')}`,
        `2. ${ctx.t('rastar-reconnect-step2')}`,
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
    return;
  }

  const keyboard = getRastarConnectedKeyboard(language);

  await ctx.reply(
    [
      ctx.t('rastar-connected'),
      '',
      `👤 ${ctx.t('rastar-email')}: ${token.email}`,
      ctx.t('rastar-user-id', { userId: token.userId }),
      ctx.t('rastar-token-expires-in', { hours: expiresInHours, minutes: expiresInMinutes }),
      '',
      ctx.t('rastar-available-features'),
      ctx.t('rastar-feature-menu'),
      ctx.t('rastar-feature-select'),
      ctx.t('rastar-feature-manage'),
      '',
      ctx.t('rastar-chat-instruction'),
      ctx.t('rastar-example'),
    ].join('\n'),
    { parse_mode: 'HTML', reply_markup: keyboard },
  );
}

/**
 * Handle /rastar_status command
 */
export async function handleRastarStatusCommand(ctx: BotContext) {
  console.log('[telegram-bot] /rastar_status');
  return showRastarStatus(ctx);
}

/**
 * Handle /rastar_unlink command
 */
export async function handleRastarUnlinkCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(ctx.t('errors-user-not-identified'));
    return;
  }

  console.log('[telegram-bot] /rastar_unlink', { telegramUserId });

  const language = await getUserLanguage(telegramUserId);
  const token = await getRastarToken(telegramUserId);
  
  const keyboard = getRastarNotConnectedKeyboard(language);
  if (!token) {
    await ctx.reply(
      [
        ctx.t('rastar-not-connected'),
        '',
        ctx.t('rastar-not-connected-message'),
        '',
        ctx.t('rastar-connect-instruction'),
        ctx.t('rastar-connect-command'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
    return;
  }

  const deleted = await deleteRastarToken(telegramUserId);
  if (deleted) {
    // Update session to reflect disconnection
    ctx.session.rastarLinked = false;
    
    await ctx.reply(
      [
        ctx.t('rastar-disconnected'),
        '',
        ctx.t('rastar-disconnected-message', { email: token.email }),
        '',
        ctx.t('rastar-reconnect-later'),
        ctx.t('rastar-connect-command'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
    
    // Resend main menu with updated keyboard
    const { getMainMenuKeyboard } = await import('../keyboards.js');
    const mainKeyboard = getMainMenuKeyboard(language, {
      plankaLinked: ctx.session.plankaLinked,
      rastarLinked: false,
    });
    await ctx.reply(ctx.t('start-welcome') || 'Main Menu', {
      reply_markup: mainKeyboard,
    });
  } else {
    await ctx.reply(
      [
        ctx.t('rastar-error'),
        '',
        ctx.t('rastar-error-message'),
        '',
        ctx.t('rastar-try-again'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
  }
}
