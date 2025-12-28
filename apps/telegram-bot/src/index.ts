console.log('[telegram-bot] Starting bot initialization...');

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bot } from 'grammy';

// Load .env files only in development (Dokploy injects env vars directly in production)
if (process.env.NODE_ENV !== 'production') {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  dotenv.config({ path: path.join(repoRoot, '.env.local') });
  dotenv.config({ path: path.join(repoRoot, '.env') });
}

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
import { handleButtonCallback } from './handlers/button-callback.js';

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

// Dynamic AI button callbacks (for AI-suggested actions)
bot.on('callback_query:data', handleButtonCallback);

// AI Chat Handler (for regular messages)
bot.on('message:text', handleAiMessage);

// Error handler
bot.catch((err) => {
  console.error('[telegram-bot] error', err);
});

// ============================================================================
// Startup
// ============================================================================

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    operationName = 'operation',
  } = options;

  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      
      if (attempt === maxRetries) {
        console.error(`[telegram-bot] ${operationName} failed after ${maxRetries + 1} attempts:`, err);
        throw err;
      }
      
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      console.warn(
        `[telegram-bot] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
        err instanceof Error ? err.message : err
      );
      
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Delete webhook with retry logic
await retryWithBackoff(
  async () => {
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    console.log('[telegram-bot] Webhook deleted successfully');
  },
  {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    operationName: 'deleteWebhook',
  }
);

// Initialize MCP servers before starting the bot
try {
  console.log('[telegram-bot] Initializing MCP servers...');
  await initializeMcpServers();
  console.log('[telegram-bot] MCP servers initialized successfully');
} catch (err) {
  console.error('[telegram-bot] Failed to initialize MCP servers:', err);
  console.log('[telegram-bot] Bot will start without MCP tools');
}

// Start bot with retry logic
await retryWithBackoff(
  async () => {
    await bot.start({
      onStart: (info) => {
        console.log(`[telegram-bot] started as @${info.username} (polling)`);
      },
    });
  },
  {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    operationName: 'bot.start',
  }
);

// Keep process alive and handle errors
process.on('unhandledRejection', (err) => {
  console.error('[telegram-bot] Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[telegram-bot] Uncaught exception:', err);
});
