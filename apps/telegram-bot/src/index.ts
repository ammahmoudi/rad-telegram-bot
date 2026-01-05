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

// Load environment FIRST - before any imports that use Prisma
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.NODE_ENV !== 'production') {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  // Load .env first (defaults), then .env.local (overrides)
  dotenv.config({ path: path.join(repoRoot, '.env') });
  dotenv.config({ path: path.join(repoRoot, '.env.local'), override: true });
}

console.log('[telegram-bot] Starting modern Grammy bot with runner...');
console.log('[telegram-bot] DATABASE_URL:', process.env.DATABASE_URL);

import express from 'express';
import { run, sequentialize } from '@grammyjs/runner';

import { createBot, setupErrorHandling, replyWithTopic } from './bot.js';
import { mainMenu, showMainMenu } from './menus/index.js';
import { linkPlankaConversation, linkRastarConversation, newChatConversation } from './conversations/index.js';
import { createConversation } from '@grammyjs/conversations';
import { initializeMcpServers } from './mcp-client.js';

// Import Grammy commands plugin
import { commands, commandNotFound } from '@grammyjs/commands';

// Import command groups
import { userCommands, chatCommands, integrationCommands } from './commands/index.js';
import './commands/user.js';
import './commands/chat.js';
import './commands/integrations.js';

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
// Register Commands Plugin
// ============================================================================

// Enable commands context shortcut (ctx.setMyCommands)
bot.use(commands());

// Register all command groups
bot.use(userCommands);
bot.use(chatCommands);
bot.use(integrationCommands);

console.log('[grammy] ✓ Command groups registered');

// ============================================================================
// Command Menu Sync Middleware
// ============================================================================

// Import command menu sync middleware
import { syncCommandMenu } from './middleware/sync-commands.js';

// Sync command menu based on user's bot language preference
bot.use(syncCommandMenu);

console.log('[grammy] ✓ Command menu sync middleware registered');

// ============================================================================
// Command Not Found Handler (Did you mean...?)
// ============================================================================

bot
  .filter(commandNotFound([userCommands, chatCommands, integrationCommands], {
    ignoreCase: true,
    similarityThreshold: 0.4,
  }))
  .use(async (ctx) => {
    if (ctx.commandSuggestion) {
      await ctx.reply(
        `🤔 Hmm... I don't know that command.\n\n` +
        `Did you mean <code>${ctx.commandSuggestion}</code>?`,
        { parse_mode: 'HTML' }
      );
    } else {
      await ctx.reply(
        `❌ Unknown command.\n\n` +
        `Use /help to see all available commands.`,
        { parse_mode: 'HTML' }
      );
    }
  });

// ============================================================================
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

// ============================================================================
// Sync Command Menu with Telegram
// ============================================================================

try {
  console.log('[telegram-bot] Syncing command menu...');
  
  // Combine all commands into one array for Telegram's command menu
  // Order: User commands (including clear_chat) → Integration commands
  // Note: chatCommands group is now empty (clear_chat moved to userCommands)
  const allCommands = [
    ...userCommands.commands.map(cmd => ({
      command: cmd.name,
      description: cmd.description
    })),
    ...integrationCommands.commands.map(cmd => ({
      command: cmd.name,
      description: cmd.description
    }))
  ];
  
  // Set all commands at once to Telegram
  await bot.api.setMyCommands(allCommands);
  
  console.log(`[telegram-bot] ✓ Synced ${allCommands.length} commands to Telegram UI:`);
  console.log(`[telegram-bot]   • User commands (including clear_chat): ${userCommands.commands.length}`);
  console.log(`[telegram-bot]   • Integration commands: ${integrationCommands.commands.length}`);
} catch (err) {
  console.error('[telegram-bot] Failed to sync command menu:', err);
  console.log('[telegram-bot] Bot will start without menu sync');
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
console.log('[telegram-bot]   • @grammyjs/commands - Advanced command handling');
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

