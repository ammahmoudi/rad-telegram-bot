/**
 * Main AI chat message handler
 * Coordinates AI interactions, streaming, tool execution, and response formatting
 */

import type { BotContext } from '../bot.js';
import {
  type ChatMessage,
  trimConversationHistory,
  trimConversationHistoryByTokens,
  validateMessageHistory,
  getOrCreateChatSession,
  getSessionMessages,
  addMessage,
  getSystemConfig,
  getUserLanguage,
  getPrisma,
  restoreToolResultsFromLogs,
} from '@rad/shared';
import { getAiClient } from '../services/ai-client.js';
import { getAiTools } from '../services/tools-manager.js';
import { getSystemPrompt } from '../config/system-prompt.js';
import { handleStreamingResponse } from './message-streaming.js';
import { buildFinalResponse } from '../services/response-builder.js';
import { executeAiTools } from './ai-tool-executor.js';
import { handleAiError, handleStreamingError } from './ai-error-handler.js';
import { sendFinalResponse } from './ai-response-formatter.js';
import { BUTTON_REGISTRY, getAllButtonTranslationKeys, getAllSystemEmojis } from '../config/button-registry.js';
import { t } from '../utils/i18n-helper.js';

/**
 * Get all keyboard button texts that should not be sent to AI
 * Generated from BUTTON_REGISTRY - single source of truth
 * This ensures buttons are detected regardless of translation changes
 */
function getKeyboardButtonCommands(): Set<string> {
  const buttons = new Set<string>();
  const languages = ['en', 'fa'];
  
  // Generate button texts for all languages from the registry
  for (const lang of languages) {
    for (const buttonDef of BUTTON_REGISTRY) {
      const text = t(lang, buttonDef.translationKey);
      if (text && typeof text === 'string') {
        buttons.add(text.trim());
      }
    }
  }
  
  return buttons;
}

// Cache the button commands - lazy loaded on first use
let cachedKeyboardButtonCommands: Set<string> | null = null;

/**
 * Check if message text is a keyboard button command that should not be sent to AI
 * Uses BUTTON_REGISTRY as single source of truth
 * 
 * Detection method:
 * 1. Check against all translated button texts from BUTTON_REGISTRY
 * 2. Fallback: Emoji + length heuristic (if translation cache is empty)
 */
function isKeyboardButtonCommand(text: string): boolean {
  const trimmed = text.trim();
  
  // Load cached buttons on first use
  if (!cachedKeyboardButtonCommands) {
    cachedKeyboardButtonCommands = getKeyboardButtonCommands();
  }
  
  // Check against translated button texts - primary method
  if (cachedKeyboardButtonCommands.size > 0 && cachedKeyboardButtonCommands.has(trimmed)) {
    return true;
  }
  
  // Fallback: Check for emoji + text patterns
  // If cache is empty (e.g., during startup), use emoji detection
  const systemEmojis = getAllSystemEmojis();
  const startsWithSystemEmoji = systemEmojis.some(emoji => trimmed.startsWith(emoji));
  
  // Button text is typically under 30 characters and single line
  if (startsWithSystemEmoji && trimmed.length < 30 && !trimmed.includes('\n')) {
    return true;
  }
  
  return false;
}

/**
 * Handle AI chat messages from users
 * Main entry point for AI interactions
 */
export async function handleAiMessage(ctx: BotContext): Promise<void> {
  console.log('[ai-message] Handler called');
  
  const client = await getAiClient();
  if (!client) {
    console.log('[ai-message] No AI client configured');
    return;
  }

  const text = ctx.message?.text;
  if (!text) {
    console.log('[ai-message] No text in message');
    return;
  }
  
  // Ignore commands (handled by command handlers)
  if (text.startsWith('/')) {
    console.log('[ai-message] Ignoring command');
    return;
  }
  
  // Ignore keyboard button commands (status, link, settings buttons)
  if (isKeyboardButtonCommand(text)) {
    console.log('[ai-message] Ignoring keyboard button command:', text);
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    console.log('[ai-message] No telegram user ID');
    return;
  }

  console.log('[ai-message] Processing:', { telegramUserId, text: text.slice(0, 50) });

  try {
    // Get user language for system prompt
    const userLanguage = await getUserLanguage(telegramUserId);
    const systemPrompt = await getSystemPrompt(userLanguage as 'fa' | 'en', telegramUserId);

    // Update user info in database
    await updateUserInfo(ctx, telegramUserId);

    // Show typing indicator
    try {
      await ctx.replyWithChatAction('typing');
    } catch (typingError) {
      console.log('[ai-message] Could not send typing indicator');
    }

    // Get thread ID based on chat mode
    // In simple mode: always undefined
    // In thread mode: from session/message/callback
    const { getSystemConfig } = await import('@rad/shared');
    const chatMode = await getSystemConfig('CHAT_MODE') || process.env.CHAT_MODE || 'thread';
    const isSimpleMode = chatMode.toLowerCase() === 'simple';
    
    let threadId = isSimpleMode 
      ? undefined 
      : (ctx.session?.currentChatTopicId 
        || ctx.message?.message_thread_id 
        || ctx.callbackQuery?.message?.message_thread_id);
    
    console.log('[ai-message] Thread detection:', {
      chatMode,
      isSimpleMode,
      sessionThreadId: ctx.session?.currentChatTopicId,
      messageThreadId: ctx.message?.message_thread_id,
      callbackThreadId: ctx.callbackQuery?.message?.message_thread_id,
      finalThreadId: threadId,
      chatType: ctx.chat?.type,
      hasThread: !!threadId
    });
    
    // Get or create THREAD-SPECIFIC chat session
    const session = await getOrCreateThreadSession(telegramUserId, threadId);
    
    // Extract reply context if user is replying to a message
    const replyContext = await extractReplyContext(ctx);
    
    // Get conversation history for THIS THREAD
    let history = await getSessionMessages(session.id);
    
    // Optionally restore tool results from McpToolLog (can be enabled via config)
    const restoreToolResults = await getSystemConfig('CHAT_RESTORE_TOOL_RESULTS');
    if (restoreToolResults === 'true') {
      history = await restoreToolResultsFromLogs(session.id, history);
    }
    
    // Convert MessageRecord[] to ChatMessage[] for trimConversationHistory
    const chatMessages: ChatMessage[] = history.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
      content: msg.content,
      toolCallId: msg.toolCallId || undefined,
      toolName: msg.toolName || undefined,
      toolArgs: msg.toolArgs || undefined,
    }));
    
    // Get history limit and mode from system config
    const historyMode = await getSystemConfig('CHAT_HISTORY_MODE') || 'message_count';
    const historyLimitConfig = await getSystemConfig('CHAT_HISTORY_LIMIT');
    
    let trimmedHistory: ChatMessage[];
    if (historyMode === 'token_size') {
      // Token-based trimming (default: 4000 tokens ≈ 16000 characters)
      const tokenLimit = historyLimitConfig ? parseInt(historyLimitConfig) : 4000;
      trimmedHistory = trimConversationHistoryByTokens(chatMessages, tokenLimit);
    } else {
      // Message count trimming (default: 20 messages)
      const messageLimit = historyLimitConfig ? parseInt(historyLimitConfig) : 20;
      trimmedHistory = trimConversationHistory(chatMessages, messageLimit);
    }
    
    // Prepare user message with reply context if available
    const userMessage = replyContext 
      ? `[Replying to: "${replyContext}"]\n\n${text}`
      : text;

    // Persist last message for retry_action and other UX helpers
    if (ctx.session) {
      ctx.session.lastUserMessage = userMessage;
    }
    
    // Add user message to database with metadata
    await addMessage(
      session.id, 
      'user', 
      userMessage,
      undefined,
      undefined,
      undefined,
      {
        telegramMessageId: ctx.message?.message_id,
        replyToMessageId: ctx.message?.reply_to_message?.message_id,
        threadId: threadId,
      }
    );
    
    // Add user message to history
    trimmedHistory.push({
      role: 'user',
      content: text,
    });
    
    // Get available AI tools
    const tools = await getAiTools(telegramUserId);
    console.log('[ai-message] Available tools:', tools.length);
    
    // Use the same thread ID we detected earlier for all operations
    const messageThreadId = threadId;
    
    // Send initial "Thinking..." message
    // Send "thinking" message with proper thread handling
    // Include thread ID and reply for context in both general chat and threads
    const replyOptions: any = {};
    
    if (messageThreadId) {
      replyOptions.message_thread_id = messageThreadId;
    }
    if (ctx.message?.message_id) {
      replyOptions.reply_to_message_id = ctx.message.message_id;
    }
    
    const sentMessage = await ctx.reply(ctx.t('ai-thinking'), replyOptions);
    
    // Handle streaming response
    let streamResult;
    try {
      streamResult = await handleStreamingResponse(
        ctx,
        client,
        trimmedHistory,
        systemPrompt,
        tools,
        sentMessage,
        session.id
      );
    } catch (streamError) {
      await handleStreamingError(ctx, streamError, client, sentMessage);
      return;
    }
    
    // Destructure streaming results
    const { 
      finalResponse, 
      totalToolCallsMade,
      reasoningSteps,
    } = streamResult;
    
    // Execute tools if they were called
    if (totalToolCallsMade > 0) {
      console.log('[ai-message] Tools called, executing...');
      
      const maxToolCallsConfig = await getSystemConfig('maxToolCalls');
      const maxToolCalls = maxToolCallsConfig ? parseInt(maxToolCallsConfig) : 30;
      
      const toolResult = await executeAiTools(
        ctx,
        client,
        trimmedHistory,
        systemPrompt,
        tools,
        session.id,
        sentMessage,
        maxToolCalls
      );
      
      trimmedHistory = toolResult.trimmedHistory;
      
      // Check if middle-out transform is enabled (default: true)
      const enableMiddleOut = (await getSystemConfig('ENABLE_MIDDLE_OUT_TRANSFORM')) !== 'false';
      
      // Get final response after tool execution
      const finalResponseAfterTools = await client.chat(
        trimmedHistory, 
        { 
          systemPrompt,
          useMiddleOutTransform: enableMiddleOut 
        },
        undefined,
        {
          telegramUserId: ctx.from?.id?.toString() || 'unknown',
          sessionId: session.id,
          messageId: String(sentMessage.message_id),
        }
      );
      const showReasoning = (await getSystemConfig('SHOW_REASONING_TO_USERS')) !== 'false';
      const finalContent = buildFinalResponse(
        finalResponseAfterTools.content,
        showReasoning ? reasoningSteps : [],
        toolResult.allToolCallsMade,
        false
      );
      
      console.log('[ai-message] Saving assistant message (with tools), content length:', finalContent.length);
      
      // Send final response and get the message ID
      const finalMessageId = await sendFinalResponse(ctx, sentMessage, finalContent, telegramUserId, messageThreadId);
      
      // Add final assistant message to database with metadata
      await addMessage(
        session.id, 
        'assistant', 
        finalContent,
        undefined,
        undefined,
        undefined,
        {
          telegramMessageId: finalMessageId,
          replyToMessageId: ctx.message?.message_id, // Replying to user's message
          threadId: messageThreadId,
        }
      );
    } else {
      // No tools called, just send the response
      console.log('[ai-message] No tools called');
      
      const showReasoning = (await getSystemConfig('SHOW_REASONING_TO_USERS')) !== 'false';
      const finalContent = buildFinalResponse(
        finalResponse,
        showReasoning ? reasoningSteps : [],
        [],
        false
      );
      
      console.log('[ai-message] Saving assistant message (no tools), finalResponse length:', finalResponse.length, 'finalContent length:', finalContent.length);
      
      // Send final response and get the message ID
      const finalMessageId = await sendFinalResponse(ctx, sentMessage, finalContent, telegramUserId, messageThreadId);
      
      // Add final assistant message to database with metadata
      await addMessage(
        session.id, 
        'assistant', 
        finalContent,
        undefined,
        undefined,
        undefined,
        {
          telegramMessageId: finalMessageId,
          replyToMessageId: ctx.message?.message_id, // Replying to user's message
          threadId: messageThreadId,
        }
      );
    }
    
  } catch (error) {
    await handleAiError(ctx, error, client);
  }
}

/**
 * Update user info in database
 */
async function updateUserInfo(ctx: BotContext, telegramUserId: string): Promise<void> {
  try {
    const prisma = getPrisma();
    const now = Date.now();
    await prisma.telegramUser.upsert({
      where: { id: telegramUserId },
      update: {
        firstName: ctx.from?.first_name || null,
        lastName: ctx.from?.last_name || null,
        username: ctx.from?.username || null,
        lastSeenAt: now,
        updatedAt: now,
      },
      create: {
        id: telegramUserId,
        firstName: ctx.from?.first_name || null,
        lastName: ctx.from?.last_name || null,
        username: ctx.from?.username || null,
        role: 'user',
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (dbError) {
    console.log('[ai-message] Could not update user info:', dbError);
  }
}

/**
 * Get or create thread-specific chat session
 * Each thread has its own conversation history
 */
async function getOrCreateThreadSession(telegramUserId: string, threadId?: number) {
  const prisma = getPrisma();
  
  // Try to find the MOST RECENT session for this thread
  // This ensures we use the new session created by /clear_chat
  let session = await prisma.chatSession.findFirst({
    where: {
      telegramUserId,
      threadId: threadId || null,
    },
    orderBy: { updatedAt: 'desc' },
  });
  
  // Create new session if not found
  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        telegramUserId,
        threadId: threadId || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
    console.log('[ai-message] Created new thread session:', { sessionId: session.id, threadId });
  }
  
  return session;
}

/**
 * Extract reply context from message
 * If user is replying to a bot or their own message, extract that context
 */
async function extractReplyContext(ctx: BotContext): Promise<string | null> {
  const replyToMessage = ctx.message?.reply_to_message;
  
  if (!replyToMessage) {
    return null;
  }
  
  // Extract text from the message being replied to
  if ('text' in replyToMessage && replyToMessage.text) {
    const replyText = replyToMessage.text;
    // Truncate to first 200 chars to avoid context bloat
    return replyText.length > 200 ? replyText.substring(0, 200) + '...' : replyText;
  }
  
  return null;
}

