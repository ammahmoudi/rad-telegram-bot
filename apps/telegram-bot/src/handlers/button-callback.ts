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

  // Planka quick action buttons - simulate user message to AI
  if (callbackData === 'planka_list_boards') {
    await ctx.answerCallbackQuery();
    const { handleAiMessage } = await import('./ai-message.js');
    // Create a message context as if user typed this
    const simulatedCtx = { ...ctx, message: { ...ctx.message, text: 'Show me my Planka boards' } };
    await handleAiMessage(simulatedCtx as BotContext);
    return;
  }

  if (callbackData === 'planka_delayed_tasks') {
    await ctx.answerCallbackQuery();
    const { handleAiMessage } = await import('./ai-message.js');
    const simulatedCtx = { ...ctx, message: { ...ctx.message, text: 'Show me my delayed Planka tasks' } };
    await handleAiMessage(simulatedCtx as BotContext);
    return;
  }

  if (callbackData === 'planka_create_card') {
    await ctx.answerCallbackQuery();
    const { handleAiMessage } = await import('./ai-message.js');
    const simulatedCtx = { ...ctx, message: { ...ctx.message, text: 'Create a new Planka card' } };
    await handleAiMessage(simulatedCtx as BotContext);
    return;
  }

  // Settings callbacks
  if (callbackData === 'settings_language') {
    await ctx.answerCallbackQuery();
    const { getLanguageKeyboard } = await import('./keyboards.js');
    const { t } = await import('../utils/i18n-helper.js');
    const language = ctx.from?.language_code === 'fa' ? 'fa' : 'en';
    await ctx.editMessageText(
      t(language, 'settings-select-language'),
      { reply_markup: getLanguageKeyboard() }
    );
    return;
  }

  if (callbackData === 'settings_back') {
    await ctx.answerCallbackQuery();
    const { handleSettingsCommand } = await import('./settings.js');
    await handleSettingsCommand(ctx);
    return;
  }

  // Language selection callbacks
  if (callbackData === 'lang_fa' || callbackData === 'lang_en') {
    await ctx.answerCallbackQuery();
    const newLang = callbackData === 'lang_fa' ? 'fa' : 'en';
    const languageName = newLang === 'fa' ? 'فارسی' : 'English';
    const { setUserLanguage } = await import('@rad/shared');
    const { t } = await import('../utils/i18n-helper.js');
    const { clearCommandCache } = await import('../middleware/sync-commands.js');
    
    const telegramUserId = ctx.from?.id;
    if (telegramUserId) {
      console.log(`[button-callback] Setting language to ${newLang} for user ${telegramUserId}`);
      await setUserLanguage(String(telegramUserId), newLang);
      console.log(`[button-callback] Language saved to database`);
      clearCommandCache(telegramUserId);
      console.log(`[button-callback] Command cache cleared`);
      
      // Update session language
      ctx.session.language = newLang;
      
      await ctx.editMessageText(
        t(newLang, 'settings-language-changed', { language: languageName }),
        { reply_markup: undefined }
      );
    }
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

  // Rastar quick action buttons - simulate user message to AI
  if (callbackData === 'rastar_today_menu') {
    await ctx.answerCallbackQuery();
    const { handleAiMessage } = await import('./ai-message.js');
    const simulatedCtx = { ...ctx, message: { ...ctx.message, text: "What's today's menu?" } };
    await handleAiMessage(simulatedCtx as BotContext);
    return;
  }

  if (callbackData === 'rastar_unselected_days') {
    await ctx.answerCallbackQuery();
    const { handleAiMessage } = await import('./ai-message.js');
    const simulatedCtx = { ...ctx, message: { ...ctx.message, text: 'Show me unselected days' } };
    await handleAiMessage(simulatedCtx as BotContext);
    return;
  }

  if (callbackData === 'rastar_week_menu') {
    await ctx.answerCallbackQuery();
    const { handleAiMessage } = await import('./ai-message.js');
    const simulatedCtx = { ...ctx, message: { ...ctx.message, text: "What's this week's menu?" } };
    await handleAiMessage(simulatedCtx as BotContext);
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
