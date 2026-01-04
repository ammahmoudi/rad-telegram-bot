import type { Bot } from 'grammy';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  handlePlankaStatusButton,
  handleRastarStatusButton,
  handleNewChatButton,
  handleHistoryButton,
  handleTodayMenuButton,
  handleUnselectedDaysButton,
  handleDelayedTasksButton,
  handleMyBoardsButton,
  handleWeekMenuButton,
  handleCreateTaskButton,
  handleMissingDailyReportsButton,
  handleListNoReportNamesButton,
  handleMyAssignedTasksButton,
  handleHumanityQcCardsButton,
} from './keyboard-text-handlers.js';
import { handleSettingsCommand } from './settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load translation files
const faTranslations = JSON.parse(
  readFileSync(path.join(__dirname, '../locales/fa.json'), 'utf-8')
);
const enTranslations = JSON.parse(
  readFileSync(path.join(__dirname, '../locales/en.json'), 'utf-8')
);

/**
 * Button text to handler mapping
 */
const buttonHandlers = {
  planka_status: handlePlankaStatusButton,
  rastar_status: handleRastarStatusButton,
  new_chat: handleNewChatButton,
  history: handleHistoryButton,
  settings: handleSettingsCommand,
  today_menu: handleTodayMenuButton,
  unselected_days: handleUnselectedDaysButton,
  delayed_tasks: handleDelayedTasksButton,
  my_boards: handleMyBoardsButton,
  week_menu: handleWeekMenuButton,
  create_task: handleCreateTaskButton,
  my_cards: handleMyBoardsButton, // alias to my_boards
  select_lunch: handleTodayMenuButton, // alias to today_menu
  missing_daily_reports: handleMissingDailyReportsButton,
  list_no_report_names: handleListNoReportNamesButton,
  my_assigned_tasks: handleMyAssignedTasksButton,
  humanity_qc_cards: handleHumanityQcCardsButton,
};

/**
 * Register all keyboard button handlers dynamically from translation files
 */
export function registerDynamicKeyboardHandlers(bot: Bot) {
  const languages = [
    { code: 'fa', translations: faTranslations },
    { code: 'en', translations: enTranslations },
  ];

  for (const { code, translations } of languages) {
    const buttons = translations.buttons;
    
    for (const [key, handler] of Object.entries(buttonHandlers)) {
      const buttonText = buttons[key as keyof typeof buttons];
      if (buttonText) {
        console.log(`[dynamic-keyboard] Registering (${code}): "${buttonText}"`);
        bot.hears(buttonText, handler);
      }
    }
  }
  
  console.log('[dynamic-keyboard] All keyboard handlers registered successfully');
}
