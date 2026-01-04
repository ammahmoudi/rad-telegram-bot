import type { BotContext } from '../../bot.js';
import { getUserLanguage } from '@rad/shared';
import { getAiClient } from '../../services/ai-client.js';
import { getMainMenuKeyboard } from '../keyboards.js';

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
  
  // Check connection status from database
  const { getPlankaToken, getRastarToken } = await import('@rad/shared');
  const plankaToken = await getPlankaToken(telegramUserId);
  const rastarToken = await getRastarToken(telegramUserId);
  
  // Update session with connection status and language
  ctx.session.plankaLinked = !!plankaToken;
  ctx.session.rastarLinked = !!rastarToken;
  ctx.session.language = language as 'en' | 'fa';
  
  // Build reply keyboard with user's language and connection status
  console.log('[start] About to create keyboard for language:', language);
  console.log('[start] Connection status:', { planka: ctx.session.plankaLinked, rastar: ctx.session.rastarLinked });
  const keyboard = getMainMenuKeyboard(language, {
    plankaLinked: ctx.session.plankaLinked,
    rastarLinked: ctx.session.rastarLinked,
  });
  console.log('[start] Keyboard created, type:', typeof keyboard);
  
  // Get welcome message from user's pack or default pack
  const { getWelcomeMessage } = await import('../../config/welcome-messages.js');
  const welcomeMessage = await getWelcomeMessage(language as 'fa' | 'en', telegramUserId, name);
  
  console.log('[start] Sending reply with keyboard');
  await ctx.reply(welcomeMessage, { parse_mode: 'HTML', reply_markup: keyboard });
  console.log('[start] Reply sent successfully');
  
  // Show Grammy inline menu under the welcome message
  const { showMainMenu } = await import('../../menus/index.js');
  await showMainMenu(ctx);
}

/**
 * Handle /menu command - Show keyboard menu
 */
export async function handleMenuCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  const language = await getUserLanguage(telegramUserId);
  const keyboard = getMainMenuKeyboard(language, {
    plankaLinked: ctx.session.plankaLinked,
    rastarLinked: ctx.session.rastarLinked,
  });
  
  await ctx.reply(
    [
      '⌨️ <b>' + ctx.t('menu-title') + '</b>',
      '',
      ctx.t('menu-use-buttons'),
      '',
      '📊 <b>' + ctx.t('menu-planka-status') + '</b> - ' + ctx.t('menu-planka-status-desc'),
      '🍽️ <b>' + ctx.t('menu-rastar-status') + '</b> - ' + ctx.t('menu-rastar-status-desc'),
      '📋 <b>' + ctx.t('menu-today-menu') + '</b> - ' + ctx.t('menu-today-menu-desc'),
      '⚠️ <b>' + ctx.t('menu-unselected-days') + '</b> - ' + ctx.t('menu-unselected-days-desc'),
      '🔴 <b>' + ctx.t('menu-delayed-tasks') + '</b> - ' + ctx.t('menu-delayed-tasks-desc'),
      '📂 <b>' + ctx.t('menu-my-boards') + '</b> - ' + ctx.t('menu-my-boards-desc'),
      '💬 <b>' + ctx.t('menu-new-chat') + '</b> - ' + ctx.t('menu-new-chat-desc'),
      '📚 <b>' + ctx.t('menu-history') + '</b> - ' + ctx.t('menu-history-desc'),
      '',
      ctx.t('menu-or-type'),
    ].join('\n'),
    { parse_mode: 'HTML', reply_markup: keyboard },
  );
  
  // Also show Grammy inline menu
  const { showMainMenu } = await import('../../menus/index.js');
  await showMainMenu(ctx);
}
