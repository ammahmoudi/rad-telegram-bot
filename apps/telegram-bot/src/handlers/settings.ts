import type { Context } from 'grammy';
import { getUserLanguage, setUserLanguage } from '@rad/shared';
import { getUserI18n } from '../i18n.js';
import { getSettingsKeyboard, getLanguageKeyboard, getMainMenuKeyboard } from './keyboards.js';

/**
 * Handle /settings command
 */
export async function handleSettingsCommand(ctx: Context) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  const keyboard = getSettingsKeyboard(language);

  const languageName = language === 'fa' ? 'فارسی' : 'English';

  await ctx.reply(
    [
      t('settings.title'),
      '',
      `${t('settings.language')}: ${languageName}`,
      '',
      t('settings.connections'),
    ].join('\n'),
    { reply_markup: keyboard },
  );
}

/**
 * Handle language selection callback
 */
export async function handleLanguageSelectionCallback(ctx: Context) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.answerCallbackQuery('Could not identify user');
    return;
  }

  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  const keyboard = getLanguageKeyboard();

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    t('settings.select_language'),
    { reply_markup: keyboard },
  );
}

/**
 * Handle language change callback
 */
export async function handleLanguageChangeCallback(ctx: Context, newLanguage: 'fa' | 'en') {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.answerCallbackQuery('Could not identify user');
    return;
  }

  await setUserLanguage(telegramUserId, newLanguage);
  const t = getUserI18n(newLanguage);
  const languageName = newLanguage === 'fa' ? 'فارسی' : 'English';

  await ctx.answerCallbackQuery(t('settings.language_changed', { language: languageName }));
  
  // Show settings again with new language (inline keyboard)
  const keyboard = getSettingsKeyboard(newLanguage);
  await ctx.editMessageText(
    [
      t('settings.title'),
      '',
      `${t('settings.language')}: ${languageName}`,
      '',
      t('settings.connections'),
    ].join('\n'),
    { reply_markup: keyboard },
  );
  
  // Send a new message to update the reply keyboard
  const mainKeyboard = getMainMenuKeyboard(newLanguage);
  await ctx.reply(
    t('settings.keyboard_updated'),
    { reply_markup: mainKeyboard },
  );
}

/**
 * Handle settings back button
 */
export async function handleSettingsBackCallback(ctx: Context) {
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage();
}
