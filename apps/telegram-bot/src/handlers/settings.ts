import type { BotContext } from '../bot.js';
import { getUserLanguage, setUserLanguage } from '@rad/shared';
import { getSettingsKeyboard, getLanguageKeyboard, getMainMenuKeyboard } from './keyboards.js';

/**
 * Handle /settings command
 */
export async function handleSettingsCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(ctx.t('callback-errors-user-not-identified'));
    return;
  }

  const language = await getUserLanguage(telegramUserId);
  const keyboard = getSettingsKeyboard(language);

  const languageName = language === 'fa' ? 'فارسی' : 'English';

  await ctx.reply(
    [
      ctx.t('settings-title'),
      '',
      `${ctx.t('settings-language')}: ${languageName}`,
      '',
      ctx.t('settings-connections'),
    ].join('\n'),
    { reply_markup: keyboard },
  );
}

/**
 * Handle language selection callback
 */
export async function handleLanguageSelectionCallback(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.answerCallbackQuery(ctx.t('callback-errors-user-not-identified-short'));
    return;
  }

  const language = await getUserLanguage(telegramUserId);
  const keyboard = getLanguageKeyboard();

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    ctx.t('settings-select-language'),
    { reply_markup: keyboard },
  );
}

/**
 * Handle language change callback
 */
export async function handleLanguageChangeCallback(ctx: BotContext, newLanguage: 'fa' | 'en') {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.answerCallbackQuery(ctx.t('callback-errors-user-not-identified-short'));
    return;
  }

  await setUserLanguage(telegramUserId, newLanguage);
  
  // Re-create i18n context with new language
  await ctx.i18n.renegotiateLocale();
  
  const languageName = newLanguage === 'fa' ? 'فارسی' : 'English';

  await ctx.answerCallbackQuery(ctx.t('settings-language-changed', { language: languageName }));
  
  // Show settings again with new language (inline keyboard)
  const keyboard = getSettingsKeyboard(newLanguage);
  await ctx.editMessageText(
    [
      ctx.t('settings-title'),
      '',
      `${ctx.t('settings-language')}: ${languageName}`,
      '',
      ctx.t('settings-connections'),
    ].join('\n'),
    { reply_markup: keyboard },
  );
  
  // Send a new message to update the reply keyboard
  const mainKeyboard = getMainMenuKeyboard(newLanguage);
  await ctx.reply(
    ctx.t('settings-keyboard-updated'),
    { reply_markup: mainKeyboard },
  );
}

/**
 * Handle settings back button
 */
export async function handleSettingsBackCallback(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage();
}
