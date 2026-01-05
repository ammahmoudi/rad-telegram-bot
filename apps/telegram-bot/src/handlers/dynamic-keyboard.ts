import { Bot } from 'grammy';
import type { BotContext } from '../bot.js';
import { FluentBundle, FluentResource } from '@fluent/bundle';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  handlePlankaStatusButton,
  handleRastarStatusButton,
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

// Load Fluent translation files
const faContent = readFileSync(path.join(__dirname, '../locales/fa.ftl'), 'utf-8');
const enContent = readFileSync(path.join(__dirname, '../locales/en.ftl'), 'utf-8');

const faBundle = new FluentBundle('fa');
const enBundle = new FluentBundle('en');

faBundle.addResource(new FluentResource(faContent));
enBundle.addResource(new FluentResource(enContent));

/**
 * Get translated button text from Fluent bundle
 */
function getButtonText(bundle: FluentBundle, key: string): string | null {
  const message = bundle.getMessage(key);
  if (!message?.value) return null;
  return typeof message.value === 'string' ? message.value : String(message.value);
}

/**
 * Button key to handler mapping
 */
const buttonHandlers: Record<string, (ctx: BotContext) => Promise<void>> = {
  'buttons-planka-status': handlePlankaStatusButton,
  'buttons-rastar-status': handleRastarStatusButton,
  'buttons-clear-chat': async (ctx) => {
    const { handleClearChatCommand } = await import('./commands/chat-management.js');
    await handleClearChatCommand(ctx);
  },
  'buttons-history': handleHistoryButton,
  'buttons-settings': handleSettingsCommand,
  'buttons-today-menu': handleTodayMenuButton,
  'buttons-unselected-days': handleUnselectedDaysButton,
  'buttons-delayed-tasks': handleDelayedTasksButton,
  'buttons-my-boards': handleMyBoardsButton,
  'buttons-week-menu': handleWeekMenuButton,
  'buttons-create-task': handleCreateTaskButton,
  'buttons-my-cards': handleMyBoardsButton, // alias to my_boards
  'buttons-select-lunch': handleTodayMenuButton, // alias to today_menu
  'buttons-missing-daily-reports': handleMissingDailyReportsButton,
  'buttons-list-no-report-names': handleListNoReportNamesButton,
  'buttons-my-assigned-tasks': handleMyAssignedTasksButton,
  'buttons-humanity-qc-cards': handleHumanityQcCardsButton,
  'buttons-connect-planka': async (ctx) => {
    const { handleLinkPlankaCommand } = await import('./commands/index.js');
    await handleLinkPlankaCommand(ctx);
  },
  'buttons-connect-rastar': async (ctx) => {
    const { handleLinkRastarCommand } = await import('./commands/index.js');
    await handleLinkRastarCommand(ctx);
  },
};

/**
 * Register all keyboard button handlers dynamically from Fluent translation files
 */
export function registerDynamicKeyboardHandlers(bot: Bot<BotContext>) {
  const languages = [
    { code: 'fa', bundle: faBundle },
    { code: 'en', bundle: enBundle },
  ];

  for (const { code, bundle } of languages) {
    for (const [key, handler] of Object.entries(buttonHandlers)) {
      const buttonText = getButtonText(bundle, key);
      if (buttonText) {
        console.log(`[dynamic-keyboard] Registering (${code}): "${buttonText}"`);
        bot.hears(buttonText, handler);
      }
    }
  }
  
  console.log('[dynamic-keyboard] All keyboard handlers registered successfully');
}
