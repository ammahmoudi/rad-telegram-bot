/**
 * Complete Grammy Bot Configuration with Full Plugin Ecosystem
 * Telegram Bot API 9.3+ support with streaming, i18n, rate limiting
 */

import { Bot, Context, session, SessionFlavor } from 'grammy';
import { hydrate, HydrateFlavor } from '@grammyjs/hydrate';
import { conversations, ConversationFlavor } from '@grammyjs/conversations';
import { parseMode, ParseModeFlavor } from '@grammyjs/parse-mode';
import { autoRetry } from '@grammyjs/auto-retry';
import { limit } from '@grammyjs/ratelimiter';
import { I18n, I18nFlavor } from '@grammyjs/i18n';
import { getUserLanguage } from '@rad/shared';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Session data structure with topic support
 */
export interface SessionData {
  // User preferences
  language?: 'en' | 'fa';
  messageCount: number;
  lastInteraction?: number;
  
  // Topic support (Telegram API 8.0+)
  topicContext?: {
    threadId?: number;
    isTopicMessage?: boolean;
  };
  
  // AI conversation state
  conversationId?: string;
  maxToolCalls?: number;
  
  // Feature states
  plankaLinked?: boolean;
  rastarLinked?: boolean;
  notificationsEnabled?: boolean;
  
  // Temporary data for multi-step flows
  tempData?: Record<string, any>;
}

/**
 * Extended context with all Grammy plugin flavors
 */
export type BotContext = 
  & Context
  & SessionFlavor<SessionData>
  & ConversationFlavor
  & HydrateFlavor<Context>
  & ParseModeFlavor<Context>
  & I18nFlavor;

/**
 * Initialize i18n with Fluent format translations
 */
export function createI18n(): I18n<BotContext> {
  // In dev mode (tsx), locales are in src/locales
  // In production, locales are copied to dist/locales
  const localesDir = path.join(__dirname, 'locales');
  
  const i18n = new I18n<BotContext>({
    defaultLocale: 'fa', // Default language is Persian
    directory: localesDir,
    useSession: true,
    
    // Fluent template engine settings
    fluentBundleOptions: {
      useIsolating: false, // No isolation marks for cleaner output
    },
    
    // Smart language detection
    localeNegotiator: async (ctx) => {
      // 1. Check session first (fastest)
      if (ctx.session?.language) {
        return ctx.session.language;
      }
      
      // 2. Check database
      if (ctx.from?.id) {
        try {
          const lang = await getUserLanguage(String(ctx.from.id));
          if (lang === 'fa' || lang === 'en') {
            if (ctx.session) {
              ctx.session.language = lang;
            }
            return lang;
          }
        } catch (error) {
          console.warn('[i18n] Failed to fetch user language from DB:', error);
        }
      }
      
      // 3. Detect from Telegram language_code
      if (ctx.from?.language_code?.startsWith('fa')) {
        return 'fa';
      }
      
      // 4. Default to Persian (fa)
      return 'fa';
    },
  });
  
  console.log('[grammy] ✓ i18n plugin created (en, fa)');
  return i18n;
}

/**
 * Create and configure the bot with complete plugin ecosystem
 */
export function createBot(token: string): Bot<BotContext> {
  console.log('[grammy] Creating bot with full plugin ecosystem...');
  
  const bot = new Bot<BotContext>(token);
  
  // ============================================================================
  // API Config #1: Auto-Retry (resilient API calls)
  // ============================================================================
  bot.api.config.use(
    autoRetry({
      maxRetryAttempts: 3,
      maxDelaySeconds: 5,
      rethrowInternalServerErrors: false,
    })
  );
  console.log('[grammy] ✓ Auto-retry plugin loaded');
  
  // ============================================================================
  // Plugin #1: Hydrate (editable/deletable messages)
  // ============================================================================
  bot.use(hydrate());
  console.log('[grammy] ✓ Hydrate plugin loaded');
  
  // ============================================================================
  // API Config #2: Parse Mode (auto HTML)
  // ============================================================================
  bot.api.config.use(parseMode('HTML'));
  console.log('[grammy] ✓ Parse mode (HTML) loaded');
  
  // ============================================================================
  // Plugin #2: Rate Limiter (anti-spam protection)
  // ============================================================================
  bot.use(
    limit({
      timeFrame: 2000, // 2 seconds
      limit: 3, // 3 messages per timeframe
      keyGenerator: (ctx) => ctx.from?.id?.toString() || 'anonymous',
      onLimitExceeded: async (ctx) => {
        await ctx.reply(
          '⏱️ Slow down! Please wait a moment before sending more messages.'
        );
      },
    })
  );
  console.log('[grammy] ✓ Rate limiter loaded');
  
  // ============================================================================
  // Plugin #3: Session (user state)
  // ============================================================================
  bot.use(
    session({
      initial(): SessionData {
        return {
          messageCount: 0,
          language: 'fa', // Default to Persian
          lastInteraction: Date.now(),
          plankaLinked: false,
          rastarLinked: false,
          notificationsEnabled: true,
        };
      },
    })
  );
  console.log('[grammy] ✓ Session plugin loaded');
  
  // ============================================================================
  // Plugin #4: i18n (internationalization)
  // ============================================================================
  const i18n = createI18n();
  bot.use(i18n);
  console.log('[grammy] ✓ i18n plugin loaded');
  
  // ============================================================================
  // Plugin #5: Conversations (multi-step flows)
  // ============================================================================
  bot.use(conversations());
  console.log('[grammy] ✓ Conversations plugin loaded');
  
  // ============================================================================
  // Custom Middleware #1: Logging
  // ============================================================================
  bot.use(async (ctx, next) => {
    const start = Date.now();
    const userId = ctx.from?.id;
    const text = ctx.message?.text || ctx.callbackQuery?.data || 'N/A';
    
    console.log(`[bot] ← User ${userId}: ${text.substring(0, 50)}`);
    
    try {
      await next();
      console.log(`[bot] → Processed in ${Date.now() - start}ms`);
    } catch (error) {
      console.error(`[bot] ✗ Error after ${Date.now() - start}ms:`, error);
      throw error;
    }
  });
  
  // ============================================================================
  // Custom Middleware #2: Session Analytics & Connection Status Refresh
  // ============================================================================
  bot.use(async (ctx, next) => {
    if (ctx.session) {
      ctx.session.messageCount++;
      ctx.session.lastInteraction = Date.now();
      
      // Refresh connection status from database
      const telegramUserId = String(ctx.from?.id ?? '');
      if (telegramUserId) {
        const { getPlankaToken, getRastarToken } = await import('@rad/shared');
        const plankaToken = await getPlankaToken(telegramUserId);
        const rastarToken = await getRastarToken(telegramUserId);
        ctx.session.plankaLinked = !!plankaToken;
        ctx.session.rastarLinked = !!rastarToken;
      }
    }
    await next();
  });
  
  // ============================================================================
  // Custom Middleware #3: Topic Detection (API 8.0+)
  // ============================================================================
  bot.use(async (ctx, next) => {
    const message = ctx.message || ctx.callbackQuery?.message;
    
    if (message && 'message_thread_id' in message) {
      const threadId = (message as any).message_thread_id;
      const isTopicMessage = (message as any).is_topic_message;
      
      if (ctx.session && threadId) {
        ctx.session.topicContext = {
          threadId,
          isTopicMessage,
        };
      }
    }
    
    await next();
  });
  console.log('[grammy] ✓ All middleware loaded');
  
  return bot;
}

/**
 * Enhanced reply with topic support (API 8.0+)
 */
export async function replyWithTopic(
  ctx: BotContext,
  text: string,
  other?: Record<string, any>
) {
  const options = { ...other };
  
  // Add message_thread_id if in a topic
  const topicId = ctx.session?.topicContext?.threadId;
  if (topicId) {
    options.message_thread_id = topicId;
  }
  
  return ctx.reply(text, options);
}

/**
 * Enhanced edit with topic support (API 8.0+)
 */
export async function editWithTopic(
  ctx: BotContext,
  text: string,
  other?: Record<string, any>
) {
  const options = { ...other };
  
  // Add message_thread_id if in a topic
  const topicId = ctx.session?.topicContext?.threadId;
  if (topicId) {
    options.message_thread_id = topicId;
  }
  
  return ctx.editMessageText(text, options);
}

/**
 * Send typing action with topic support
 */
export async function sendTypingAction(ctx: BotContext) {
  try {
    const chatActionOptions: any = {};
    
    // Add thread ID if in a topic
    const topicId = ctx.session?.topicContext?.threadId;
    if (topicId) {
      chatActionOptions.message_thread_id = topicId;
    }
    
    await ctx.api.sendChatAction(ctx.chat!.id, 'typing', chatActionOptions);
  } catch (error) {
    console.warn('[bot] Failed to send typing action:', error);
  }
}

/**
 * Stream a message with live updates (Telegram API 9.3+)
 * Shows typing indicators and updates message as content streams in
 */
export async function streamMessage(
  ctx: BotContext,
  generateContent: () => AsyncGenerator<string, void, unknown>
) {
  let fullText = '';
  let lastUpdateTime = 0;
  let lastTypingTime = 0;
  let sentMessage: any = null;
  
  // Send initial typing indicator
  await sendTypingAction(ctx);
  lastTypingTime = Date.now();
  
  // Stream content chunks
  for await (const chunk of generateContent()) {
    fullText += chunk;
    const now = Date.now();
    
    // Send typing indicator every 4 seconds
    if (now - lastTypingTime >= 4000) {
      await sendTypingAction(ctx);
      lastTypingTime = now;
    }
    
    // Update message every 500ms or every 50 chars (whichever comes first)
    const shouldUpdate = 
      now - lastUpdateTime >= 500 ||
      fullText.length - (sentMessage?.text?.length || 0) >= 50;
    
    if (shouldUpdate) {
      try {
        if (!sentMessage) {
          // Send initial message
          sentMessage = await replyWithTopic(ctx, fullText);
        } else {
          // Edit existing message
          await editWithTopic(ctx, fullText);
        }
        lastUpdateTime = now;
      } catch (error: any) {
        // Ignore "message not modified" errors
        if (!error.message?.includes('message is not modified')) {
          console.error('[streaming] Error updating message:', error.message);
        }
      }
    }
  }
  
  // Final update to ensure complete text is shown
  if (sentMessage && fullText !== sentMessage.text) {
    try {
      await editWithTopic(ctx, fullText);
    } catch (error: any) {
      if (!error.message?.includes('message is not modified')) {
        console.error('[streaming] Error in final update:', error.message);
      }
    }
  } else if (!sentMessage && fullText) {
    // Edge case: content was too fast, no message was sent yet
    sentMessage = await replyWithTopic(ctx, fullText);
  }
  
  return sentMessage;
}

/**
 * Setup comprehensive error handling
 */
export function setupErrorHandling(bot: Bot<BotContext>) {
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`[bot] Error handling update ${ctx.update.update_id}:`);
    const e = err.error;
    
    if (e instanceof Error) {
      console.error('[bot] Error:', e.name, '-', e.message);
      if (e.stack) {
        console.error('[bot] Stack:', e.stack);
      }
    } else {
      console.error('[bot] Unknown error:', e);
    }
    
    // Try to inform user gracefully
    const errorMessage = ctx.t
      ? ctx.t('errors-generic-title') + '\n\n' +
        ctx.t('errors-generic-description') + '\n' +
        ctx.t('errors-try-again')
      : '⚠️ Sorry, something went wrong. Please try again.';
    
    ctx.reply(errorMessage).catch((replyError) => {
      console.error('[bot] Failed to send error message to user:', replyError);
    });
  });
  
  console.log('[grammy] ✓ Error boundary configured');
}
