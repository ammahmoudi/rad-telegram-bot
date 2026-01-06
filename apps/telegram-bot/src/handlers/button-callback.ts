import type { BotContext } from '../bot.js';
import { parseButtonCallback } from '../utils/ai-buttons.js';
import { handleAiButtonCallback } from './ai-button-callback.js';

/**
 * Handle inline keyboard button callbacks
 * Routes to appropriate handler based on callback data format
 */
export async function handleButtonCallback(ctx: BotContext) {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !('data' in callbackQuery)) {
    return;
  }

  const callbackData = callbackQuery.data;
  if (!callbackData) {
    return;
  }

  console.log('[button-callback] Button clicked:', callbackData);

  // Ignore menu callbacks - they're handled by the menu middleware
  if (callbackData.includes('menu/') || callbackData.includes('language-') || callbackData.includes('settings-')) {
    console.log('[button-callback] Ignoring menu callback');
    return;
  }

  // Handle thread action callbacks (from inline quick action buttons in threads)
  if (callbackData.startsWith('thread_action:')) {
    const { handleThreadActionCallback } = await import('./callback-handlers.js');
    await handleThreadActionCallback(ctx);
    return;
  }

  // Handle menu action buttons (link/unlink) - check before JSON parsing
  if (callbackData === 'link_planka' || callbackData === 'planka_link') {
    await ctx.answerCallbackQuery();
    const { handleLinkPlankaCommand } = await import('./commands/index.js');
    await handleLinkPlankaCommand(ctx);
    return;
  }

  if (callbackData === 'planka_unlink') {
    await ctx.answerCallbackQuery();
    const { handlePlankaUnlinkCommand } = await import('./commands/index.js');
    await handlePlankaUnlinkCommand(ctx);
    return;
  }
  
  if (callbackData === 'planka_status_inline') {
    await ctx.answerCallbackQuery();
    const { showPlankaStatus } = await import('./commands/planka.js');
    await showPlankaStatus(ctx);
    return;
  }

  if (callbackData === 'planka_list_boards') {
    await ctx.answerCallbackQuery();
    await ctx.reply('📋 Listing your Planka boards...');
    // TODO: Implement board listing
    return;
  }

  if (callbackData === 'planka_delayed_tasks') {
    await ctx.answerCallbackQuery();
    await ctx.reply('🔴 Fetching delayed tasks...');
    // TODO: Implement delayed tasks
    return;
  }

  if (callbackData === 'planka_create_card') {
    await ctx.answerCallbackQuery();
    await ctx.reply('➕ Starting card creation...');
    // TODO: Implement card creation flow
    return;
  }

  if (callbackData === 'link_rastar' || callbackData === 'rastar_link') {
    await ctx.answerCallbackQuery();
    const { handleLinkRastarCommand } = await import('./commands/index.js');
    await handleLinkRastarCommand(ctx);
    return;
  }

  if (callbackData === 'rastar_unlink') {
    await ctx.answerCallbackQuery();
    const { handleRastarUnlinkCommand } = await import('./commands/index.js');
    await handleRastarUnlinkCommand(ctx);
    return;
  }
  
  if (callbackData === 'rastar_status_inline') {
    await ctx.answerCallbackQuery();
    const { showRastarStatus } = await import('./commands/rastar.js');
    await showRastarStatus(ctx);
    return;
  }

  if (callbackData === 'rastar_today_menu') {
    await ctx.answerCallbackQuery();
    await ctx.reply('📋 Fetching today\'s menu...');
    // TODO: Implement today's menu
    return;
  }

  if (callbackData === 'rastar_unselected_days') {
    await ctx.answerCallbackQuery();
    await ctx.reply('⚠️ Checking unselected days...');
    // TODO: Implement unselected days check
    return;
  }

  if (callbackData === 'rastar_week_menu') {
    await ctx.answerCallbackQuery();
    await ctx.reply('📅 Fetching this week\'s menu...');
    // TODO: Implement week menu
    return;
  }

  try {
    // Try to parse as AI-suggested button
    const parsed = parseButtonCallback(callbackData);
    
    if (parsed) {
      // Handle AI-suggested button
      await handleAiButtonCallback(ctx);
    } else {
      // Unknown button format
      const telegramUserId = String(ctx.from?.id ?? '');
      if (!telegramUserId) {
        console.error('[button-callback] No user ID in callback query');
        return;
      }
      await ctx.answerCallbackQuery({ text: ctx.t('button-callback-invalid-button-data') });
    }

  } catch (error) {
    console.error('[button-callback] Error handling button:', error);
    await ctx.reply(ctx.t('button-callback-failed-to-process'));
  }
}
