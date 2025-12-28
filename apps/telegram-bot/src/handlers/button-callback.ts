import type { Context } from 'grammy';
import { parseButtonCallback } from '../utils/ai-buttons.js';
import { handleAiButtonCallback } from './ai-button-callback.js';
import { getUserI18n } from '../i18n.js';
import { getUserLanguage } from '@rad/shared';

/**
 * Handle inline keyboard button callbacks
 * Routes to appropriate handler based on callback data format
 */
export async function handleButtonCallback(ctx: Context) {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !('data' in callbackQuery)) {
    return;
  }

  const callbackData = callbackQuery.data;

  console.log('[button-callback] Button clicked:', callbackData);

  try {
    // Try to parse as AI-suggested button
    const parsed = parseButtonCallback(callbackData);
    
    if (parsed) {
      // Handle AI-suggested button
      await handleAiButtonCallback(ctx as any);
    } else {
      // Unknown button format
      const telegramUserId = String(ctx.from?.id ?? '');
      if (!telegramUserId) {
        console.error('[button-callback] No user ID in callback query');
        return;
      }
      const language = await getUserLanguage(telegramUserId);
      const t = getUserI18n(language);
      await ctx.answerCallbackQuery({ text: t('button_callback.invalid_button_data') });
    }

  } catch (error) {
    console.error('[button-callback] Error handling button:', error);
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('button_callback.failed_to_process'));
  }
}
