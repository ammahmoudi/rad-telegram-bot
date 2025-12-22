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
} from './handlers/commands.js';
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
