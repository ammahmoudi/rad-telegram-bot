import type { BotContext } from '../../bot.js';
import {
  getPlankaToken,
  deletePlankaToken,
  getUserLanguage,
  validatePlankaToken,
  createLinkState,
} from '@rad/shared';
import { withThreadContext } from '../../utils/thread-helper.js';
import { stripTrailingSlash } from '../../utils/formatting.js';
import {
  getPlankaConnectedKeyboard,
  getPlankaNotConnectedKeyboard,
  getPlankaExpiredKeyboard,
} from '../keyboards.js';

const LINK_PORTAL_BASE_URL = process.env.LINK_PORTAL_URL || 'http://localhost:3002';

/**
 * Handle /link_planka command
 */
export async function handleLinkPlankaCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(ctx.t('errors-user-not-identified'));
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
      await withThreadContext(ctx, { reply_markup: keyboard }),
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
 * Show Planka status (single source of truth)
 * Used by both /planka_status command and menu buttons
 */
export async function showPlankaStatus(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(ctx.t('errors-user-not-identified'));
    return;
  }

  const language = await getUserLanguage(telegramUserId);
  const token = await getPlankaToken(telegramUserId);
  
  if (!token) {
    // Not connected - directly start link conversation
    return handleLinkPlankaCommand(ctx);
  }

  // Validate that the token actually works
  const isValid = await validatePlankaToken(telegramUserId);
  
  if (!isValid) {
    const keyboard = getPlankaExpiredKeyboard(language);
    
    await ctx.reply(
      [
        '⚠️ <b>' + ctx.t('planka-token-invalid') + '</b>',
        '',
        `🌐 ${ctx.t('planka-base-url', { url: token.plankaBaseUrl })}`,
        '',
        '❌ ' + ctx.t('planka-token-invalid-message'),
        '',
        '🔄 <b>' + ctx.t('planka-reconnect-steps') + '</b>',
        '1. ' + ctx.t('planka-unlink-first'),
        '2. ' + ctx.t('planka-link-again'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );
    return;
  }

  const keyboard = getPlankaConnectedKeyboard(language);

  await ctx.reply(
    [
      ctx.t('planka-connected'),
      '',
      `🌐 ${ctx.t('planka-base-url', { url: token.plankaBaseUrl })}`,
      '',
      ctx.t('planka-can-use'),
      '',
      ctx.t('planka-disconnect-command'),
    ].join('\n'),
    { parse_mode: 'HTML', reply_markup: keyboard },
  );
}

/**
 * Handle /planka_status command
 */
export async function handlePlankaStatusCommand(ctx: BotContext) {
  console.log('[telegram-bot] /planka_status');
  return showPlankaStatus(ctx);
}

/**
 * Handle /planka_unlink command
 */
export async function handlePlankaUnlinkCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(ctx.t('errors-user-not-identified'));
    return;
  }

  console.log('[telegram-bot] /planka_unlink', { telegramUserId });

  const language = await getUserLanguage(telegramUserId);
  const removed = await deletePlankaToken(telegramUserId);
  
  const keyboard = getPlankaNotConnectedKeyboard(language);
  if (removed) {
    // Update session to reflect disconnection
    ctx.session.plankaLinked = false;
    
    await ctx.reply(
      [
        ctx.t('planka-unlinked'),
        '',
        ctx.t('planka-unlinked-message'),
        '',
        ctx.t('planka-connect-instruction'),
      ].join('\n'),
      { parse_mode: 'HTML', reply_markup: keyboard },
    );    
    // Resend main menu with updated keyboard
    const { getMainMenuKeyboard } = await import('../keyboards.js');
    const mainKeyboard = getMainMenuKeyboard(language, {
      plankaLinked: false,
      rastarLinked: ctx.session.rastarLinked,
    });
    await ctx.reply(ctx.t('start-welcome') || 'Main Menu', {
      reply_markup: mainKeyboard,
    });  } else {
    await ctx.reply(
      [
        ctx.t('planka-no-account'),
        '',
        ctx.t('planka-no-account-message'),
        '',
        ctx.t('planka-connect-command'),
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  }
}
