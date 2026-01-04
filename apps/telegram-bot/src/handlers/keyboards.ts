import { Keyboard, InlineKeyboard } from 'grammy';
import { buildMainMenuKeyboard, type KeyboardTranslations } from '@rad/shared';
import { t } from '../utils/i18n-helper.js';

/**
 * Main menu keyboard shown in /start and /menu
 * Shows only status/link buttons and settings
 */
export function getMainMenuKeyboard(language: string = 'fa', options?: { plankaLinked?: boolean; rastarLinked?: boolean }) {
  console.log('[keyboards] Creating main menu keyboard for language:', language);
  console.log('[keyboards] Connection status:', { planka: options?.plankaLinked, rastar: options?.rastarLinked });
  
  // Build translations object
  const translations: Partial<KeyboardTranslations> = {
    'keyboards.my-cards': t(language, 'buttons-my-cards'),
    'keyboards.delayed-tasks': t(language, 'buttons-delayed-tasks'),
    'keyboards.my-boards': t(language, 'buttons-my-boards'),
    'keyboards.create-task': t(language, 'buttons-create-task'),
    'keyboards.planka-status': t(language, 'buttons-planka-status'),
    'keyboards.todays-menu': t(language, 'buttons-today-menu'),
    'keyboards.unselected-days': t(language, 'buttons-unselected-days'),
    'keyboards.week-menu': t(language, 'buttons-week-menu'),
    'keyboards.select-lunch': t(language, 'buttons-select-lunch'),
    'keyboards.rastar-status': t(language, 'buttons-rastar-status'),
    'keyboards.settings': t(language, 'buttons-settings'),
  };
  
  // Use shared keyboard builder
  const keyboardData = buildMainMenuKeyboard(
    options?.plankaLinked ?? false,
    options?.rastarLinked ?? false,
    translations
  );
  
  // Convert to Grammy Keyboard
  const keyboard = new Keyboard();
  for (const row of keyboardData.keyboard) {
    for (let i = 0; i < row.length; i++) {
      keyboard.text(row[i]);
    }
    keyboard.row();
  }
  
  keyboard.resized().persistent();
  
  return keyboard;
}

/**
 * Planka status inline keyboard (when connected)
 */
export function getPlankaConnectedKeyboard(language: string = 'fa') {
  return new InlineKeyboard()
    .text(t(language, 'inline-buttons-list-boards'), 'planka_list_boards')
    .text(t(language, 'inline-buttons-delayed-tasks'), 'planka_delayed_tasks')
    .row()
    .text(t(language, 'inline-buttons-create-card'), 'planka_create_card')
    .row()
    .text(t(language, 'inline-buttons-unlink-planka'), 'planka_unlink');
}

/**
 * Planka status inline keyboard (when not connected)
 * Button opens the portal link URL
 * Note: Telegram rejects localhost URLs in inline buttons, so we don't add a button for local development
 */
export function getPlankaNotConnectedKeyboard(language: string = 'fa', linkUrl?: string) {
  // Don't add button if URL is localhost (Telegram rejects it)
  if (!linkUrl || linkUrl.includes('localhost') || linkUrl.startsWith('http://127.0.0.1')) {
    return undefined;
  }
  
  return new InlineKeyboard()
    .url(t(language, 'inline-buttons-link-planka'), linkUrl);
}

/**
 * Planka status inline keyboard (when expired)
 */
export function getPlankaExpiredKeyboard(language: string = 'fa') {
  return new InlineKeyboard()
    .text(t(language, 'inline-buttons-unlink-planka'), 'planka_unlink')
    .text(t(language, 'inline-buttons-relink-planka'), 'link_planka');
}

/**
 * Rastar status inline keyboard (when connected)
 */
export function getRastarConnectedKeyboard(language: string = 'fa') {
  return new InlineKeyboard()
    .text(t(language, 'inline-buttons-today-menu'), 'rastar_today_menu')
    .text(t(language, 'inline-buttons-unselected-days'), 'rastar_unselected_days')
    .row()
    .text(t(language, 'inline-buttons-week-menu'), 'rastar_week_menu')
    .row()
    .text(t(language, 'inline-buttons-unlink-rastar'), 'rastar_unlink');
}

/**
 * Rastar status inline keyboard (when not connected)
 * Button opens the portal link URL
 * Note: Telegram rejects localhost URLs in inline buttons, so we don't add a button for local development
 */
export function getRastarNotConnectedKeyboard(language: string = 'fa', linkUrl?: string) {
  // Don't add button if URL is localhost (Telegram rejects it)
  if (!linkUrl || linkUrl.includes('localhost') || linkUrl.startsWith('http://127.0.0.1')) {
    return undefined;
  }
  
  return new InlineKeyboard()
    .url(t(language, 'inline-buttons-link-rastar'), linkUrl);
}

/**
 * Rastar status inline keyboard (when expired)
 */
export function getRastarExpiredKeyboard(language: string = 'fa') {
  return new InlineKeyboard()
    .text(t(language, 'inline-buttons-unlink-rastar'), 'rastar_unlink')
    .text(t(language, 'inline-buttons-relink-rastar'), 'link_rastar');
}

/**
 * Settings menu keyboard
 */
export function getSettingsKeyboard(language: string = 'fa') {
  return new InlineKeyboard()
    .text(t(language, 'settings-change-language'), 'settings_language')
    .row()
    .text(`${t(language, 'settings-planka-connection')} - ${t(language, 'commands-planka-status')}`, 'planka_status_inline')
    .row()
    .text(`${t(language, 'settings-rastar-connection')} - ${t(language, 'commands-rastar-status')}`, 'rastar_status_inline')
    .row()
    .text(t(language, 'settings-back'), 'settings_back');
}

/**
 * Language selection keyboard
 */
export function getLanguageKeyboard() {
  return new InlineKeyboard()
    .text('🇮🇷 فارسی', 'lang_fa')
    .text('🇬🇧 English', 'lang_en');
}
