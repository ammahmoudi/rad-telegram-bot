import { Keyboard, InlineKeyboard } from 'grammy';
import { getUserI18n } from '../i18n.js';

/**
 * Main menu keyboard shown in /start and /menu
 */
export function getMainMenuKeyboard(language: string = 'fa') {
  const t = getUserI18n(language);
  
  return new Keyboard()
    .text(t('buttons.today_menu')).text(t('buttons.unselected_days'))
    .row()
    .text(t('buttons.delayed_tasks')).text(t('buttons.my_boards'))
    .row()
    .text(t('buttons.week_menu')).text(t('buttons.select_lunch'))
    .row()
    .text(t('buttons.missing_daily_reports'))
    .row()
    .text(t('buttons.list_no_report_names'))
    .row()
    .text(t('buttons.my_assigned_tasks'))
    .row()
    .text(t('buttons.humanity_qc_cards'))
    .row()
    .text(t('buttons.my_cards')).text(t('buttons.create_task'))
    .row()
    .text(t('buttons.planka_status')).text(t('buttons.rastar_status'))
    .row()
    .text(t('buttons.settings'))
    .resized();
}

/**
 * Planka status inline keyboard (when connected)
 */
export function getPlankaConnectedKeyboard(language: string = 'fa') {
  const t = getUserI18n(language);
  
  return new InlineKeyboard()
    .text(t('inline_buttons.list_boards'), 'planka_list_boards')
    .text(t('inline_buttons.delayed_tasks'), 'planka_delayed_tasks')
    .row()
    .text(t('inline_buttons.create_card'), 'planka_create_card')
    .row()
    .text(t('inline_buttons.unlink_planka'), 'planka_unlink');
}

/**
 * Planka status inline keyboard (when not connected)
 * Button opens the portal link URL
 * Note: Telegram rejects localhost URLs in inline buttons, so we don't add a button for local development
 */
export function getPlankaNotConnectedKeyboard(language: string = 'fa', linkUrl?: string) {
  const t = getUserI18n(language);
  
  // Don't add button if URL is localhost (Telegram rejects it)
  if (!linkUrl || linkUrl.includes('localhost') || linkUrl.startsWith('http://127.0.0.1')) {
    return undefined;
  }
  
  return new InlineKeyboard()
    .url(t('inline_buttons.link_planka'), linkUrl);
}

/**
 * Planka status inline keyboard (when expired)
 */
export function getPlankaExpiredKeyboard(language: string = 'fa') {
  const t = getUserI18n(language);
  
  return new InlineKeyboard()
    .text(t('inline_buttons.unlink_planka'), 'planka_unlink')
    .text(t('inline_buttons.relink_planka'), 'link_planka');
}

/**
 * Rastar status inline keyboard (when connected)
 */
export function getRastarConnectedKeyboard(language: string = 'fa') {
  const t = getUserI18n(language);
  
  return new InlineKeyboard()
    .text(t('inline_buttons.today_menu'), 'rastar_today_menu')
    .text(t('inline_buttons.unselected_days'), 'rastar_unselected_days')
    .row()
    .text(t('inline_buttons.week_menu'), 'rastar_week_menu')
    .row()
    .text(t('inline_buttons.unlink_rastar'), 'rastar_unlink');
}

/**
 * Rastar status inline keyboard (when not connected)
 * Button opens the portal link URL
 * Note: Telegram rejects localhost URLs in inline buttons, so we don't add a button for local development
 */
export function getRastarNotConnectedKeyboard(language: string = 'fa', linkUrl?: string) {
  const t = getUserI18n(language);
  
  // Don't add button if URL is localhost (Telegram rejects it)
  if (!linkUrl || linkUrl.includes('localhost') || linkUrl.startsWith('http://127.0.0.1')) {
    return undefined;
  }
  
  return new InlineKeyboard()
    .url(t('inline_buttons.link_rastar'), linkUrl);
}

/**
 * Rastar status inline keyboard (when expired)
 */
export function getRastarExpiredKeyboard(language: string = 'fa') {
  const t = getUserI18n(language);
  
  return new InlineKeyboard()
    .text(t('inline_buttons.unlink_rastar'), 'rastar_unlink')
    .text(t('inline_buttons.relink_rastar'), 'link_rastar');
}

/**
 * Settings menu keyboard
 */
export function getSettingsKeyboard(language: string = 'fa') {
  const t = getUserI18n(language);
  
  return new InlineKeyboard()
    .text(t('settings.change_language'), 'settings_language')
    .row()
    .text(`${t('settings.planka_connection')} - ${t('commands.planka_status')}`, 'planka_status_inline')
    .row()
    .text(`${t('settings.rastar_connection')} - ${t('commands.rastar_status')}`, 'rastar_status_inline')
    .row()
    .text(t('settings.back'), 'settings_back');
}

/**
 * Language selection keyboard
 */
export function getLanguageKeyboard() {
  return new InlineKeyboard()
    .text('🇮🇷 فارسی', 'lang_fa')
    .text('🇬🇧 English', 'lang_en');
}
