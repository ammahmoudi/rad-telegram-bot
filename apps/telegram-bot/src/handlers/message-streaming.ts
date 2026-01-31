import type { Context } from 'grammy';
import type { BotContext } from '../bot.js';
import type { Message } from 'grammy/types';
import type { OpenRouterClient, ChatMessage } from '@rad/shared';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import type { ReasoningStep } from '../types/streaming.js';
import { markdownToTelegramHtml, formatToolName } from '../utils/formatting.js';
import { splitHtmlSafely } from '../utils/html-splitter.js';
import { LOADING_FRAMES } from '../types/streaming.js';

/**
 * Handle streaming AI response with live updates to Telegram message
 * Uses native Telegram sendMessageDraft API for smooth streaming (Bot API 8.1+)
 * Supports topics in private chats via message_thread_id parameter
 */
export async function handleStreamingResponse(
  ctx: BotContext,
  client: OpenRouterClient,
  trimmedHistory: ChatMessage[],
  systemPrompt: string,
  tools: ChatCompletionTool[],
  sentMessage: Message.TextMessage,
  sessionId: string
): Promise<{
  finalResponse: string;
  totalToolCallsMade: number;
  reasoningSteps: ReasoningStep[];
  allToolCallsMade: Array<{ name: string; args?: any }>;
  allReasoningTexts: string[];
  reasoningDetails?: unknown;
}> {
  let lastUpdateTime = Date.now();
  let lastTypingTime = Date.now();
  let reasoningActive = false;
  let reasoningText = '';
  let allReasoningTexts: string[] = [];
  let allToolCallsMade: Array<{ name: string; args?: any }> = [];
  let reasoningSteps: ReasoningStep[] = [];
  let currentStepTools: Array<{ name: string; args: any }> = [];
  let totalToolCallsMade = 0;
  let finalResponse = '';
  let reasoningDetails: unknown = undefined;
  let loadingFrameIndex = 0;
  
  let toolCallsDisplay: string[] = [];
  let activeTools = new Set<string>();
  
  // Generate unique draft_id for this streaming session (use update_id per Grammy API)
  const draftId = ctx.update.update_id;
  let useNativeStreaming = true;

  // Extract topic information if available (Grammy Bot API 9.3+ support)
  const messageThreadId = ctx.session?.currentChatTopicId || ctx.message?.message_thread_id || ctx.msg?.message_thread_id;
  
  console.log('[message-streaming] Topic info:', {
    messageThreadId,
    draftId,
    useNativeStreaming,
  });
  
  // Send typing action periodically (for compatibility)
  const sendTypingAction = async () => {
    const now = Date.now();
    if (now - lastTypingTime > 4000) { // Telegram typing indicator lasts ~5 seconds
      try {
        await ctx.api.sendChatAction(ctx.chat!.id, 'typing', {
          message_thread_id: messageThreadId,
        });
        lastTypingTime = now;
      } catch (error) {
        // Ignore errors from typing action
      }
    }
  };

  // Helper to update message (with rate limiting)
  const updateMessage = async (force: boolean = false) => {
    const now = Date.now();
    if (!force && now - lastUpdateTime < 500) return; // Rate limit: 2 updates per second
    
    lastUpdateTime = now;
    
    // Send typing indicator for fallback
    await sendTypingAction();
    
    // Check if reasoning should be shown to users
    const { getSystemConfig } = await import('@rad/shared');
    const showReasoning = (await getSystemConfig('SHOW_REASONING_TO_USERS')) !== 'false';
    
    let content = '';
    
    // Show reasoning indicator if active
    if (reasoningActive) {
      if (showReasoning && reasoningText) {
        content += '🧠 <b>Reasoning...</b>\n\n';
        const formattedReasoning = markdownToTelegramHtml(reasoningText);
        content += '<blockquote>' + formattedReasoning.substring(0, 500) + '</blockquote>\n\n';
      } else {
        // Show simple thinking indicator when reasoning is hidden
        content += '🤔 <i>Thinking...</i>\n\n';
      }
    }
    
    // Show active tools only if reasoning is enabled
    if (showReasoning && toolCallsDisplay.length > 0) {
      content += '<b>🛠️ Tools in use:</b>\n';
      content += toolCallsDisplay.map(t => `  ${t}`).join('\n');
      content += '\n\n';
    }
    
    // Show accumulated response content
    if (finalResponse) {
      content += markdownToTelegramHtml(finalResponse);
    } else if (!reasoningActive && toolCallsDisplay.length === 0) {
      content += '💭 <i>Generating response...</i>';
    }
    
    // Check if content exceeds Telegram's limit (4096 chars)
    // Use a safety margin to prevent truncation during streaming
    if (content.length > 4000) {
      // Check if reasoning should be shown to users (recheck for consistency)
      const showReasoning = (await getSystemConfig('SHOW_REASONING_TO_USERS')) !== 'false';
      
      // Truncate the final response part to fit within limit
      const overflowBy = content.length - 4000;
      const maxFinalResponseLength = Math.max(0, markdownToTelegramHtml(finalResponse).length - overflowBy - 100);
      
      // Rebuild content with truncated response
      content = '';
      if (reasoningActive) {
        if (showReasoning && reasoningText) {
          content += '🧠 <b>Reasoning...</b>\n\n';
          const formattedReasoning = markdownToTelegramHtml(reasoningText);
          content += '<blockquote>' + formattedReasoning.substring(0, 500) + '</blockquote>\n\n';
        } else {
          content += '🤔 <i>Thinking...</i>\n\n';
        }
      }
      
      if (showReasoning && toolCallsDisplay.length > 0) {
        content += '<b>🛠️ Tools in use:</b>\n';
        content += toolCallsDisplay.map(t => `  ${t}`).join('\n');
        content += '\n\n';
      }
      
      if (finalResponse) {
        const formattedResponse = markdownToTelegramHtml(finalResponse);
        // Use splitHtmlSafely and take only the first chunk
        const chunks = splitHtmlSafely(formattedResponse, maxFinalResponseLength);
        content += chunks[0];
        if (chunks.length > 1) {
          content += '\n\n<i>... (message continues)</i>';
        }
      } else if (!reasoningActive && toolCallsDisplay.length === 0) {
        content += '💭 <i>Generating response...</i>';
      }
    }
    
    try {
      // Try native streaming first (sendMessageDraft) - Bot API 8.1+ (Grammy 1.39.2+)
      if (useNativeStreaming && ctx.chat?.id) {
        try {
          await ctx.api.sendMessageDraft(
            ctx.chat.id,
            draftId,
            content,
            {
              parse_mode: 'HTML',
              ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
            }
          );
        } catch (error: any) {
          // Fallback to editMessageText if sendMessageDraft not supported
          if (error?.error_code === 400 || error?.description?.includes('supported only for bots with forum topic mode')) {
            useNativeStreaming = false;
            console.log('[message-streaming] Native streaming not available, using fallback');
          } else {
            throw error;
          }
        }
      }
      
      // Fallback: use traditional editMessageText
      if (!useNativeStreaming) {
        const editOptions: Record<string, any> = { parse_mode: 'HTML' };
        if (messageThreadId) {
          editOptions.message_thread_id = messageThreadId;
        }
        
        await ctx.api.editMessageText(sentMessage.chat.id, sentMessage.message_id, content, editOptions);
      }
    } catch (error) {
      // Ignore errors from too frequent updates or identical content
    }
  };

  // Stream AI response
  const stream = client.streamChat(
    trimmedHistory,
    { systemPrompt },
    tools,
    {
      telegramUserId: ctx.from?.id?.toString() || 'unknown',
      sessionId: sessionId,
      messageId: String(sentMessage.message_id),
    }
  );
  
  for await (const chunk of stream) {
    if (chunk.type === 'reasoning') {
      reasoningActive = true;
      if (chunk.content) {
        reasoningText = chunk.content;
        allReasoningTexts.push(chunk.content);
      }
      console.log('[telegram-bot] 🧠 Reasoning chunk received');
      await updateMessage();
    } else if (chunk.type === 'tool_call' && chunk.toolCall) {
      reasoningActive = false;
      const toolName = chunk.toolCall.name;
      
      if (!activeTools.has(toolName)) {
        activeTools.add(toolName);
        toolCallsDisplay.push(formatToolName(toolName));
        allToolCallsMade.push({ name: toolName, args: chunk.toolCall.arguments });
        currentStepTools.push({ name: toolName, args: chunk.toolCall.arguments });
        totalToolCallsMade++;
        console.log('[telegram-bot] 🔧 Tool call:', toolName);
        await updateMessage();
      }
    } else if (chunk.type === 'content' && chunk.content) {
      reasoningActive = false;
      finalResponse += chunk.content;
      console.log('[telegram-bot] 💬 Content chunk:', chunk.content.substring(0, 50));
      await updateMessage();
    } else if (chunk.type === 'done') {
      // Save final reasoning step with its tools
      if (reasoningText && currentStepTools.length > 0) {
        reasoningSteps.push({
          reasoning: reasoningText,
          tools: [...currentStepTools]
        });
        currentStepTools = [];
      }
      
      reasoningDetails = chunk.reasoningDetails;
      reasoningActive = false;
      reasoningText = '';
      console.log('[telegram-bot] ✅ Streaming complete');
      console.log('[telegram-bot] Done event:', {
        finishReason: chunk.finishReason,
        contentLength: chunk.content?.length || 0
      });
      
      // If the done event has content we haven't seen yet, add it
      if (chunk.content && !finalResponse) {
        finalResponse = chunk.content;
        console.log('[telegram-bot] Using content from done event');
      }
    }
  }
  
  console.log('[telegram-bot] Stream finished, total response length:', finalResponse.length);
  
  // Force final update only if we have content to show
  if (finalResponse || toolCallsDisplay.length > 0) {
    await updateMessage(true);
  }

  return {
    finalResponse,
    totalToolCallsMade,
    reasoningSteps,
    allToolCallsMade,
    allReasoningTexts,
    reasoningDetails
  };
}
