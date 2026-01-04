/**
 * Main AI chat message handler
 * Coordinates AI interactions, streaming, tool execution, and response formatting
 */

import type { BotContext } from '../bot.js';
import {
  type ChatMessage,
  trimConversationHistory,
  validateMessageHistory,
  getOrCreateChatSession,
  getSessionMessages,
  addMessage,
  getSystemConfig,
  getUserLanguage,
  getPrisma,
} from '@rad/shared';
import { getAiClient } from '../services/ai-client.js';
import { getAiTools } from '../services/tools-manager.js';
import { getSystemPrompt } from '../config/system-prompt.js';
import { handleStreamingResponse } from './message-streaming.js';
import { buildFinalResponse } from '../services/response-builder.js';
import { executeAiTools } from './ai-tool-executor.js';
import { handleAiError, handleStreamingError } from './ai-error-handler.js';
import { sendFinalResponse } from './ai-response-formatter.js';

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

    // Get or create chat session
    const session = await getOrCreateChatSession(telegramUserId);
    
    // Get conversation history
    const history = await getSessionMessages(session.id);
    
    // Convert MessageRecord[] to ChatMessage[] for trimConversationHistory
    const chatMessages: ChatMessage[] = history.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
      content: msg.content,
      toolCallId: msg.toolCallId || undefined,
      toolName: msg.toolName || undefined,
      toolArgs: msg.toolArgs || undefined,
    }));
    
    // Trim history to stay within context limits
    let trimmedHistory = trimConversationHistory(
      chatMessages,
      128000
    );
    
    // Add user message to database
    await addMessage(session.id, 'user', text);
    
    // Add user message to history
    trimmedHistory.push({
      role: 'user',
      content: text,
    });
    
    // Get available AI tools
    const tools = await getAiTools(telegramUserId);
    console.log('[ai-message] Available tools:', tools.length);
    
    // Send initial "Thinking..." message
    const sentMessage = await ctx.reply('💭 Thinking...');
    
    // Handle streaming response
    let streamResult;
    try {
      streamResult = await handleStreamingResponse(
        ctx,
        client,
        trimmedHistory,
        systemPrompt,
        tools,
        sentMessage
      );
    } catch (streamError) {
      await handleStreamingError(ctx, streamError, client, sentMessage);
      return;
    }
    
    // Destructure streaming results
    const { 
      finalResponse, 
      totalToolCallsMade,
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
      
      // Get final response after tool execution
      const finalResponseAfterTools = await client.chat(trimmedHistory, { systemPrompt });
      const finalContent = buildFinalResponse(
        finalResponseAfterTools.content,
        [],
        toolResult.allToolCallsMade,
        false
      );
      
      // Add final assistant message to database
      await addMessage(session.id, 'assistant', finalContent);
      
      // Send final response
      await sendFinalResponse(ctx, sentMessage, finalContent, telegramUserId);
    } else {
      // No tools called, just send the response
      console.log('[ai-message] No tools called');
      
      const finalContent = buildFinalResponse(
        finalResponse,
        [],
        [],
        false
      );
      
      // Add final assistant message to database
      await addMessage(session.id, 'assistant', finalContent);
      
      // Send final response
      await sendFinalResponse(ctx, sentMessage, finalContent, telegramUserId);
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
