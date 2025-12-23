console.log('[telegram-bot] Starting bot initialization...');

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bot } from 'grammy';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

console.log('[telegram-bot] Environment loaded');

import { initializeMcpServers } from './mcp-client.js';
import {
  handleStartCommand,
  handleLinkPlankaCommand,
  handlePlankaStatusCommand,
  handlePlankaUnlinkCommand,
  handleNewChatCommand,
  handleHistoryCommand,
  handleClearChatCommand,
  handleLinkRastarCommand,
  handleRastarStatusCommand,
  handleRastarUnlinkCommand,
  handleMenuCommand,
} from './handlers/commands.js';
import {
  handleSettingsCommand,
  handleLanguageSelectionCallback,
  handleLanguageChangeCallback,
  handleSettingsBackCallback,
} from './handlers/settings.js';
import {
  handleLinkPlankaCallback,
  handlePlankaUnlinkCallback,
  handlePlankaListBoardsCallback,
  handlePlankaDelayedTasksCallback,
  handlePlankaCreateCardCallback,
  handleLinkRastarCallback,
  handleRastarUnlinkCallback,
  handleRastarTodayMenuCallback,
  handleRastarUnselectedDaysCallback,
  handleRastarWeekMenuCallback,
} from './handlers/callback-handlers.js';
import { registerDynamicKeyboardHandlers } from './handlers/dynamic-keyboard.js';
import { handleAiMessage } from './handlers/ai-message.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

// ============================================================================
// Initialize Bot
// ============================================================================

const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Command handlers
bot.command('start', handleStartCommand);
bot.command('menu', handleMenuCommand);
bot.command('settings', handleSettingsCommand);

// Planka commands
bot.command('link_planka', handleLinkPlankaCommand);
bot.command('planka_status', handlePlankaStatusCommand);
bot.command('planka_unlink', handlePlankaUnlinkCommand);

// Rastar commands
bot.command('link_rastar', handleLinkRastarCommand);
bot.command('rastar_status', handleRastarStatusCommand);
bot.command('rastar_unlink', handleRastarUnlinkCommand);

// Chat commands
bot.command('new_chat', handleNewChatCommand);
bot.command('history', handleHistoryCommand);
bot.command('clear_chat', handleClearChatCommand);

// Callback query handlers for inline buttons
bot.callbackQuery('link_planka', handleLinkPlankaCallback);
bot.callbackQuery('planka_unlink', handlePlankaUnlinkCallback);
bot.callbackQuery('planka_list_boards', handlePlankaListBoardsCallback);
bot.callbackQuery('planka_delayed_tasks', handlePlankaDelayedTasksCallback);
bot.callbackQuery('planka_create_card', handlePlankaCreateCardCallback);

bot.callbackQuery('link_rastar', handleLinkRastarCallback);
bot.callbackQuery('rastar_unlink', handleRastarUnlinkCallback);
bot.callbackQuery('rastar_today_menu', handleRastarTodayMenuCallback);
bot.callbackQuery('rastar_unselected_days', handleRastarUnselectedDaysCallback);
bot.callbackQuery('rastar_week_menu', handleRastarWeekMenuCallback);

// Settings callbacks
bot.callbackQuery('settings_language', handleLanguageSelectionCallback);
bot.callbackQuery('lang_fa', async (ctx) => await handleLanguageChangeCallback(ctx, 'fa'));
bot.callbackQuery('lang_en', async (ctx) => await handleLanguageChangeCallback(ctx, 'en'));
bot.callbackQuery('settings_back', handleSettingsBackCallback);
bot.callbackQuery('planka_status_inline', handlePlankaStatusCommand);
bot.callbackQuery('rastar_status_inline', handleRastarStatusCommand);

// Register all keyboard button handlers dynamically from translation files
registerDynamicKeyboardHandlers(bot);

// AI Chat Handler (for regular messages)
bot.on('message:text', handleAiMessage);

// Error handler
bot.catch((err) => {
  console.error('[telegram-bot] error', err);
});

// ============================================================================
// Startup
// ============================================================================

try {
  // If this bot token was previously used in a webhook-based deployment,
  // polling will fail with a 409 conflict until the webhook is removed.
  await bot.api.deleteWebhook({ drop_pending_updates: true });
} catch (err) {
  console.warn('[telegram-bot] failed to deleteWebhook (continuing)', err);
}

// Initialize MCP servers before starting the bot
try {
  console.log('[telegram-bot] Initializing MCP servers...');
  await initializeMcpServers();
  console.log('[telegram-bot] MCP servers initialized successfully');
} catch (err) {
  console.error('[telegram-bot] Failed to initialize MCP servers:', err);
  console.log('[telegram-bot] Bot will start without MCP tools');
}

bot.start({
  onStart: (info) => {
    console.log(`[telegram-bot] started as @${info.username} (polling)`);
  },
});

// Keep process alive and handle errors
process.on('unhandledRejection', (err) => {
  console.error('[telegram-bot] Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[telegram-bot] Uncaught exception:', err);
});
