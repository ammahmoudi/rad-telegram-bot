/**
 * Modern Grammy Bot - Refactored with Grammy ecosystem + Runner
 * Using: @grammyjs/conversations, @grammyjs/menu, @grammyjs/hydrate, @grammyjs/parse-mode, @grammyjs/runner
 * 
 * Benefits:
 * - Less code, more features
 * - Better error handling
 * - Modern middleware patterns
 * - Type-safe context
 * - Built-in session management
 * - Menu system instead of manual keyboards
 * - Conversation flows for multi-step interactions
 * - Production-grade runner with graceful shutdown
 */

console.log('[telegram-bot] Starting modern Grammy bot with runner...');

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { run, sequentialize } from '@grammyjs/runner';

// Load environment
if (process.env.NODE_ENV !== 'production') {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  dotenv.config({ path: path.join(repoRoot, '.env.local') });
  dotenv.config({ path: path.join(repoRoot, '.env') });
}

import { createBot, setupErrorHandling, replyWithTopic } from './bot.js';
import { mainMenu, showMainMenu } from './menus/index.js';
import { linkPlankaConversation, linkRastarConversation, newChatConversation } from './conversations/index.js';
import { createConversation } from '@grammyjs/conversations';
import { initializeMcpServers } from './mcp-client.js';

// Import command handlers (some still needed for direct calls)
import {
  handleStartCommand,
  handleMenuCommand,
  handleNewChatCommand,
  handleHistoryCommand,
  handleClearChatCommand,
  handlePlankaStatusCommand,
  handleRastarStatusCommand,
  handlePlankaUnlinkCommand,
  handleRastarUnlinkCommand,
} from './handlers/commands/index.js';

import { handleAiMessage } from './handlers/ai-message.js';
import { handleButtonCallback } from './handlers/button-callback.js';

// ============================================================================
// Health Check Server
// ============================================================================

const PORT = Number(process.env.TELEGRAM_BOT_PORT || 3003);
const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'telegram-bot-modern' });
});

app.listen(PORT, () => {
  console.log(`[telegram-bot] Health check server listening on port ${PORT}`);
});

// ============================================================================
// Bot Initialization
// ============================================================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const bot = createBot(TELEGRAM_BOT_TOKEN);

// ============================================================================
// Register Conversations
// ============================================================================

bot.use(createConversation(linkPlankaConversation));
bot.use(createConversation(linkRastarConversation));
bot.use(createConversation(newChatConversation));

console.log('[grammy] ✓ Conversations registered');

// ============================================================================
// Register Menu System
// ============================================================================

bot.use(mainMenu);
console.log('[grammy] ✓ Menu system registered');

// ============================================================================
// Command Handlers
// ============================================================================

// Start command - Show welcome and menu
bot.command('start', handleStartCommand);

// Menu command - Show main menu
bot.command('menu', handleMenuCommand);

// Settings command - Navigate to settings in menu
bot.command('settings', async (ctx) => {
  await ctx.reply('⚙️ <b>Settings</b>', { reply_markup: mainMenu });
});

// Link commands - Start conversations
bot.command('link_planka', async (ctx) => {
  await ctx.conversation.enter('linkPlankaConversation');
});

bot.command('link_rastar', async (ctx) => {
  await ctx.conversation.enter('linkRastarConversation');
});

// Status commands - Direct handlers
bot.command('planka_status', handlePlankaStatusCommand);
bot.command('rastar_status', handleRastarStatusCommand);

// Unlink commands - Direct handlers
bot.command('planka_unlink', handlePlankaUnlinkCommand);
bot.command('rastar_unlink', handleRastarUnlinkCommand);

// Chat management commands
bot.command('new_chat', async (ctx) => {
  await ctx.conversation.enter('newChatConversation');
});

bot.command('history', handleHistoryCommand);
bot.command('clear_chat', handleClearChatCommand);

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    `<b>📚 Available Commands</b>\n\n` +
    `<b>General:</b>\n` +
    `/start - Start the bot\n` +
    `/menu - Show main menu\n` +
    `/settings - Bot settings\n` +
    `/help - This help message\n\n` +
    `<b>Chat:</b>\n` +
    `/new_chat - Start new conversation\n` +
    `/history - View chat history\n` +
    `/clear_chat - Clear history\n\n` +
    `<b>Planka:</b>\n` +
    `/link_planka - Link your Planka account\n` +
    `/planka_status - Check connection\n` +
    `/planka_unlink - Unlink account\n\n` +
    `<b>Rastar:</b>\n` +
    `/link_rastar - Link your Rastar account\n` +
    `/rastar_status - Check connection\n` +
    `/rastar_unlink - Unlink account\n\n` +
    `💬 <i>Just send me a message to chat!</i>`
  );
});

console.log('[grammy] ✓ Commands registered');

// ============================================================================
// Keyboard Button Handlers (reply keyboard text buttons)
// ============================================================================

import { registerDynamicKeyboardHandlers } from './handlers/dynamic-keyboard.js';
registerDynamicKeyboardHandlers(bot);

console.log('[grammy] ✓ Keyboard handlers registered');

// ============================================================================
// Callback Query Handlers (AI buttons)
// ============================================================================

bot.on('callback_query:data', handleButtonCallback);

console.log('[grammy] ✓ Callback handlers registered');

// ============================================================================
// Message Handler (AI Chat)
// ============================================================================

bot.on('message:text', handleAiMessage);

console.log('[grammy] ✓ Message handlers registered');

// ============================================================================
// Error Handling
// ============================================================================

setupErrorHandling(bot);

// ============================================================================
// Utility Function: Retry with Backoff
// ============================================================================

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
        `[telegram-bot] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`
      );
      
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// ============================================================================
// Startup
// ============================================================================

// Delete webhook with retry
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

// Initialize MCP servers
try {
  console.log('[telegram-bot] Initializing MCP servers...');
  await initializeMcpServers();
  console.log('[telegram-bot] MCP servers initialized successfully');
} catch (err) {
  console.error('[telegram-bot] Failed to initialize MCP servers:', err);
  console.log('[telegram-bot] Bot will start without MCP tools');
}

// Add concurrency control for session management
bot.use(sequentialize((ctx) => {
  // Group updates by chat to avoid race conditions
  return ctx.chat?.id.toString();
}));

// Start bot with runner (production-grade)
console.log('[telegram-bot] Starting bot with Grammy runner...');
const runner = run(bot, {
  runner: {
    fetch: {
      allowed_updates: ['message', 'edited_message', 'callback_query', 'inline_query'],
    },
  },
});

// Log when runner is active
const info = await bot.api.getMe();
console.log(`[telegram-bot] 🚀 Modern Grammy bot started as @${info.username}`);
console.log('[telegram-bot] ✓ Using Grammy v1.35.0 with full plugin ecosystem:');
console.log('[telegram-bot]   • @grammyjs/i18n - Internationalization (en, fa)');
console.log('[telegram-bot]   • @grammyjs/ratelimiter - Anti-spam protection');
console.log('[telegram-bot]   • @grammyjs/auto-retry - API resilience');
console.log('[telegram-bot]   • @grammyjs/conversations - Multi-step flows');
console.log('[telegram-bot]   • @grammyjs/menu - Dynamic menus');
console.log('[telegram-bot]   • @grammyjs/hydrate - Editable messages');
console.log('[telegram-bot]   • @grammyjs/parse-mode - Auto HTML parsing');
console.log('[telegram-bot]   • @grammyjs/runner - Production runner');
console.log('[telegram-bot] ✓ Ready to accept messages!');

// Graceful shutdown handlers
const stopRunner = () => {
  console.log('[telegram-bot] Received shutdown signal, stopping runner...');
  runner.isRunning() && runner.stop();
};

process.once('SIGINT', stopRunner);  // Ctrl+C
process.once('SIGTERM', stopRunner); // Docker/K8s termination

// Wait for runner to stop
await runner.task();
console.log('[telegram-bot] Runner stopped gracefully');

// Keep process alive and handle errors
process.on('unhandledRejection', (err) => {
  console.error('[telegram-bot] Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[telegram-bot] Uncaught exception:', err);
  process.exit(1);
});
