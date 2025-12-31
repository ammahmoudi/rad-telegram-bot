import type { Context } from 'grammy';
import {
  trimConversationHistory,
  validateMessageHistory,
  getOrCreateChatSession,
  getSessionMessages,
  addMessage,
  getSystemConfig,
  getUserLanguage,
  type ChatMessage,
  getPrisma,
} from '@rad/shared';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { executeMcpTool } from '../planka-tools.js';
import { executeRastarTool } from '../rastar-tools.js';
import { executeTimeTool } from '../time-tools.js';
import { getAiClient } from '../services/ai-client.js';
import { getAiTools } from '../services/tools-manager.js';
import { getSystemPrompt } from '../config/system-prompt.js';
import { markdownToTelegramHtml, formatToolName, formatToolArgs } from '../utils/formatting.js';
import { splitHtmlSafely } from '../utils/html-splitter.js';
import { LOADING_FRAMES, type ReasoningStep } from '../types/streaming.js';
import { handleStreamingResponse } from './message-streaming.js';
import { buildFinalResponse, buildEmptySearchNotification } from '../services/response-builder.js';
import { getUserI18n } from '../i18n.js';
import { parseAiButtons, createButtonKeyboard } from '../utils/ai-buttons.js';

/**
 * Handle AI chat messages from users
 * This is the main AI interaction handler for the Telegram bot
 */
export async function handleAiMessage(ctx: Context) {
  console.log('[ai-message] handleAiMessage called');
  
  const client = await getAiClient();
  if (!client) {
    console.log('[ai-message] No AI client, returning');
    return; // AI not configured, ignore messages
  }

  const text = ctx.message?.text;
  if (!text) {
    console.log('[ai-message] No text in message, returning');
    return;
  }
  
  // Ignore commands (already handled by command handlers)
  if (text.startsWith('/')) {
    console.log('[ai-message] Text starts with /, returning');
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    console.log('[ai-message] No telegramUserId, returning');
    return;
  }

  console.log('[telegram-bot] AI chat message', { telegramUserId, text: text.slice(0, 50) });

  try {
    // Get user language for system prompt
    const userLanguage = await getUserLanguage(telegramUserId);
    const systemPrompt = await getSystemPrompt(userLanguage as 'fa' | 'en', telegramUserId);

    // Update user info in database
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
      console.log('[telegram-bot] Could not update user info:', dbError);
    }

    // Show typing indicator (ignore network errors)
    try {
      await ctx.replyWithChatAction('typing');
    } catch (typingError) {
      console.log('[telegram-bot] Could not send typing indicator (network issue)');
    }

    // Get or create session
    const session = await getOrCreateChatSession(telegramUserId);

    // Get conversation history
    const messages = await getSessionMessages(session.id, 50);
    const chatHistory: ChatMessage[] = messages.map((m: any) => ({
      role: m.role as any,
      content: m.content,
      toolCallId: m.toolCallId || undefined,
      toolName: m.toolName || undefined,
      toolArgs: m.toolArgs || undefined,
    }));

    // For Gemini models, strip out tool call history since we don't store reasoning_details
    const isGemini = client.model.includes('gemini') || client.model.includes('google');
    const cleanedHistory = isGemini 
      ? chatHistory.filter(msg => 
          msg.role === 'user' || 
          (msg.role === 'assistant' && !msg.toolName && msg.content)
        )
      : chatHistory;

    // Validate and clean message history
    const validatedHistory = validateMessageHistory(cleanedHistory);

    // Add user message
    await addMessage(session.id, 'user', text);
    validatedHistory.push({ role: 'user', content: text });

    // Trim to fit context window
    const trimmedHistory = trimConversationHistory(validatedHistory, 20);

    // Get Planka tools if user has linked account
    let tools: ChatCompletionTool[] = [];
    let plankaAuthFailed = false;
    try {
      tools = await getAiTools(telegramUserId);
      console.log('[telegram-bot] Tools available:', tools.length);
      if (tools.length > 0) {
        console.log('[telegram-bot] Tool names:', tools.map(t => (t as any).function?.name).filter(Boolean));
      }
    } catch (error) {
      plankaAuthFailed = true;
      console.log('[telegram-bot] Failed to get Planka tools:', error instanceof Error ? error.message : error);
      
      const hasInvalidToken = error instanceof Error && error.message.includes('authenticate');
      
      if (hasInvalidToken) {
        await ctx.reply(
          '⚠️ <b>Planka Authentication Error</b>\n\n' +
          'Your Planka credentials have expired or are invalid.\n\n' +
          '🔄 <b>To fix this:</b>\n' +
          '1. Run /planka_unlink to disconnect\n' +
          '2. Run /link_planka to reconnect with fresh credentials\n\n' +
          '<i>Your previous tasks and data are safe - you just need to re-authenticate.</i>',
          { parse_mode: 'HTML' }
        );
      }
    }
    
    // If user asked for Planka-specific task and auth failed, stop here
    if (plankaAuthFailed && (text.toLowerCase().includes('task') || text.toLowerCase().includes('تسک') || text.toLowerCase().includes('planka'))) {
      return;
    }

    console.log('[telegram-bot] Conversation history length:', trimmedHistory.length);
    console.log('[telegram-bot] Last 3 messages:', JSON.stringify(trimmedHistory.slice(-3).map((m: any) => ({ role: m.role, content: m.content?.substring(0, 100) || '(tool call)', toolName: m.toolName })), null, 2));
    console.log('[telegram-bot] Calling AI with streaming and', tools.length, 'tools');
    
    // Send initial message, retry once if network fails
    let sentMessage;
    try {
      sentMessage = await ctx.reply('💭 <i>Thinking...</i>', { parse_mode: 'HTML' });
    } catch (replyError) {
      console.error('[telegram-bot] Failed to send initial message, retrying...', replyError);
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        sentMessage = await ctx.reply('💭 <i>Thinking...</i>', { parse_mode: 'HTML' });
      } catch (retryError) {
        console.error('[telegram-bot] Failed to send message after retry', retryError);
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
    }
    
    // Initialize tracking variables
    const maxToolCallsConfig = await getSystemConfig('maxToolCalls');
    let maxToolCalls = maxToolCallsConfig ? parseInt(maxToolCallsConfig) : 30;
    
    let toolCallsDisplay: string[] = [];
    let activeTools = new Set<string>();
    let loadingFrameIndex = 0;
    
    // Handle streaming response with live updates
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
      console.error('[telegram-bot] Streaming error:', streamError);
      
      // Try to clean up the "Thinking..." message
      try {
        await ctx.api.deleteMessage(sentMessage.chat.id, sentMessage.message_id);
      } catch (delError) {
        // Ignore if delete fails
      }
      
      // Check if it's a network/connection error
      if (streamError instanceof Error) {
        const errMsg = streamError.message.toLowerCase();
        if (errMsg.includes('terminated') || errMsg.includes('socket') || errMsg.includes('closed') || errMsg.includes('econnreset')) {
          const isGemini = client.model.includes('gemini') || client.model.includes('google');
          
          let message = '⚠️ <b>Connection Issue</b>\n\n' +
            'The AI service connection was interrupted.\n\n';
          
          if (isGemini) {
            message += '💡 <b>Note:</b> Gemini reasoning models occasionally have connection issues when generating responses.\n\n' +
              '<b>What you can do:</b>\n' +
              '• Send your message again - it usually works on retry\n' +
              '• Ask an admin to switch to Claude (more stable)\n';
          } else {
            message += '💡 <b>Try:</b>\n' +
              '• Send your message again\n' +
              '• Simplify your query\n';
          }
          
          await ctx.reply(message, { parse_mode: 'HTML' });
          return;
        }
      }
      
      throw streamError;
    }
    
    // Destructure streaming results
    let { 
      finalResponse, 
      totalToolCallsMade, 
      reasoningSteps, 
      allToolCallsMade, 
      allReasoningTexts,
      reasoningDetails 
    } = streamResult;
    
    // Reinitialize variables needed for tool execution phase
    toolCallsDisplay = [];
    activeTools = new Set<string>();
    let currentStepTools: Array<{ name: string; args: any }> = [];
    let reasoningText = '';
      
    // Now handle tool execution if tools were called
    if (totalToolCallsMade > 0 && maxToolCalls > 0) {
      console.log('[telegram-bot] Tools were called, executing them...');
      
      // Get full response with tool calls
      let response = await client.chat(trimmedHistory, { systemPrompt }, tools);
      
      // Handle tool calls
      while (response.toolCalls && response.toolCalls.length > 0 && maxToolCalls > 0) {
        maxToolCalls--;

        // Add tool calls to history and database
        for (const toolCall of response.toolCalls) {
          await addMessage(
            session.id,
            'assistant',
            '',
            toolCall.id,
            toolCall.name,
            toolCall.arguments,
          );
        }
        
        // Map reasoning details to tool calls by ID
        const reasoningByToolCallId = new Map<string, any>();
        if (response.reasoningDetails && Array.isArray(response.reasoningDetails)) {
          for (const detail of response.reasoningDetails) {
            if (detail.id) {
              if (!reasoningByToolCallId.has(detail.id)) {
                reasoningByToolCallId.set(detail.id, []);
              }
              reasoningByToolCallId.get(detail.id)!.push(detail);
            }
          }
        }
        
        const assistantMessages: ChatMessage[] = response.toolCalls.map(tc => ({
          role: 'assistant',
          content: '',
          toolCallId: tc.id,
          toolName: tc.name,
          toolArgs: tc.arguments,
          reasoningDetails: response.reasoningDetails,
          toolCallReasoningDetails: reasoningByToolCallId.get(tc.id),
        }));
        
        trimmedHistory.push(...assistantMessages);

        // Execute tools
        for (const toolCall of response.toolCalls) {
          // Tool names are already in the correct format (planka_get_user_cards, rastar_menu_list, etc.)
          // No conversion needed since MCP tools now use underscore format
          const mcpToolName = toolCall.name;
          
          // Track tool for display (but don't add to allToolCallsMade - it's already tracked during streaming)
          if (!activeTools.has(toolCall.name)) {
            activeTools.add(toolCall.name);
            
            // Add to display list so user sees it with arguments
            const toolDisplayName = formatToolName(toolCall.name);
            const formattedArgsForList = formatToolArgs(toolCall.arguments, 50);
            const toolDisplayWithArgs = `${toolDisplayName}${formattedArgsForList}`;
            
            if (!toolCallsDisplay.includes(toolDisplayWithArgs)) {
              toolCallsDisplay.push(toolDisplayWithArgs);
              
              // Update message immediately to show new tool
              loadingFrameIndex = (loadingFrameIndex + 1) % LOADING_FRAMES.length;
              const loadingEmoji = LOADING_FRAMES[loadingFrameIndex];
              
              let tempReasoningDisplay = '';
              if (response.reasoningDetails && Array.isArray(response.reasoningDetails)) {
                const textDetails = response.reasoningDetails
                  .filter((detail: any) => detail.type === 'reasoning.text')
                  .map((detail: any) => detail.text)
                  .join('\n\n');
                if (textDetails) {
                  tempReasoningDisplay = '🧠 <b>Reasoning...</b>\n\n<blockquote>' + 
                    markdownToTelegramHtml(textDetails).substring(0, 500) + 
                    (textDetails.length > 500 ? '...' : '') + 
                    '</blockquote>\n\n';
                }
              }
              
              let tempToolsDisplay = `<b>🛠️ Tools ${loadingEmoji}</b>\n`;
              tempToolsDisplay += toolCallsDisplay.map(t => `  ${t}`).join('\n') + '\n';
              tempToolsDisplay += `\n💭 <i>Executing ${toolDisplayName.replace('🔧 ', '')}...</i> ${loadingEmoji}`;
              
              // Ensure total content doesn't exceed Telegram's limit
              let tempContent = tempReasoningDisplay + tempToolsDisplay;
              if (tempContent.length > 4000) {
                // Truncate using safe HTML splitting
                const chunks = splitHtmlSafely(tempContent, 4000);
                tempContent = chunks[0];
              }
              
              try {
                await ctx.api.editMessageText(
                  sentMessage.chat.id,
                  sentMessage.message_id,
                  tempContent,
                  { parse_mode: 'HTML' }
                );
              } catch (editError: any) {
                // Ignore errors
              }
            }
          }
          
          // Route tool calls based on prefix
          let toolResult;
          if (mcpToolName.startsWith('rastar.') || mcpToolName.startsWith('rastar_')) {
            toolResult = await executeRastarTool(
              telegramUserId,
              mcpToolName,
              JSON.parse(toolCall.arguments),
            );
          } else if (mcpToolName.startsWith('planka_')) {
            toolResult = await executeMcpTool(
              telegramUserId,
              mcpToolName,
              JSON.parse(toolCall.arguments),
            );
          } else {
            // Time tools (no prefix) or other MCP servers
            toolResult = await executeTimeTool(
              mcpToolName,
              JSON.parse(toolCall.arguments),
            );
          }

          const resultContent = toolResult.success
            ? toolResult.content
            : `Error: ${toolResult.error}`;

          await addMessage(session.id, 'tool', resultContent, toolCall.id);
          trimmedHistory.push({
            role: 'tool',
            content: resultContent,
            toolCallId: toolCall.id,
          });
        }

        // Update display to show we're processing results
        let reasoningDisplay = '';
        if (response.reasoningDetails && Array.isArray(response.reasoningDetails)) {
          const textDetails = response.reasoningDetails
            .filter((detail: any) => detail.type === 'reasoning.text')
            .map((detail: any) => detail.text)
            .join('\n\n');
          if (textDetails) {
            // Save previous reasoning step with tools before starting new one
            if (reasoningText && currentStepTools.length > 0) {
              reasoningSteps.push({
                reasoning: reasoningText,
                tools: [...currentStepTools]
              });
              currentStepTools = [];
            }
            
            allReasoningTexts.push(textDetails);
            reasoningText = textDetails;
            
            // Track tools from this execution phase
            for (const tc of response.toolCalls) {
              if (!currentStepTools.find(t => t.name === tc.name)) {
                currentStepTools.push({ name: tc.name, args: tc.arguments });
              }
            }
            const formattedReasoning = markdownToTelegramHtml(textDetails);
            reasoningDisplay = '🧠 <b>Reasoning...</b>\n\n<blockquote>' + 
              formattedReasoning.substring(0, 500) + 
              (textDetails.length > 500 ? '...' : '') + 
              '</blockquote>\n\n';
          }
        }
        
        // Build tools list with animation
        loadingFrameIndex = (loadingFrameIndex + 1) % LOADING_FRAMES.length;
        const loadingEmoji = LOADING_FRAMES[loadingFrameIndex];
        
        let toolsDisplay = `<b>🛠️ Tools ${loadingEmoji}</b>\n`;
        if (toolCallsDisplay.length > 0) {
          toolsDisplay += toolCallsDisplay.map(t => `  ${t}`).join('\n') + '\n';
        }
        
        const displayContent = reasoningDisplay + toolsDisplay + `\n💭 <i>Analyzing results...</i> ${loadingEmoji}`;
        
        // Ensure content doesn't exceed Telegram's limit
        let safeDisplayContent = displayContent;
        if (displayContent.length > 4000) {
          const chunks = splitHtmlSafely(displayContent, 4000);
          safeDisplayContent = chunks[0];
        }
        
        try {
          await ctx.api.editMessageText(sentMessage.chat.id, sentMessage.message_id, safeDisplayContent, { parse_mode: 'HTML' });
        } catch (error: any) {
          if (!error?.description?.includes('message is not modified')) {
            console.error('[telegram-bot] Failed to update message:', error.message);
          }
        }

        // Get next response
        response = await client.chat(trimConversationHistory(trimmedHistory, 20), { systemPrompt }, tools);
        
        if (response.content) {
          finalResponse = response.content;
        }
      }
    }

    // Save final response
    const hadContentBeforeSummarization = !!finalResponse;
    
    if (finalResponse) {
      await addMessage(session.id, 'assistant', finalResponse);
    } else {
      console.log('[telegram-bot] WARNING: No content in final response!');
      
      // Force summarization if needed
      if (totalToolCallsMade > 0) {
        console.log('[telegram-bot] Attempting forced summarization after', totalToolCallsMade, 'tool calls');
        
        // Check if searches were made and returned empty
        const emptySearchNotification = buildEmptySearchNotification(allToolCallsMade, trimmedHistory);
        
        let summaryPrompt: ChatMessage;
        
        if (emptySearchNotification) {
          // Use the empty search notification
          const searchDetails = allToolCallsMade.map(t => {
            const toolName = formatToolName(t.name).replace('🔧 ', '');
            const formattedArgs = formatToolArgs(t.args, 100);
            return `  • ${toolName}${formattedArgs}`;
          }).join('\n');
          
          summaryPrompt = {
            role: 'user',
            content: `I searched these places and found nothing:\n${searchDetails}\n\n` +
                     `Tell the user (in their language) exactly what you searched: which projects, boards, queries you tried. ` +
                     `List the specific search attempts. Then say nothing was found and the name might be spelled differently. ` +
                     `Be specific about what you looked for. Write 3-4 sentences. ` +
                     `DO NOT include any "Process Summary", "Reasoning Process", or "Tools used" sections. ` +
                     `Only provide the final user-facing message.`
          };
        } else {
          summaryPrompt = {
            role: 'user',
            content: `Tell the user (in their language) what you found after searching. ` +
                     `List the specific projects/boards/items you checked. ` +
                     `Be specific about where you looked. Write 3-4 sentences. ` +
                     `DO NOT include any "Process Summary", "Reasoning Process", or "Tools used" sections. ` +
                     `Only provide the final user-facing message.`
          };
        }
        
        // For forced summarization: Strip reasoning_details from assistant messages
        // but preserve tool calls and tool responses
        const historyForSummary = trimmedHistory.map(msg => {
          if (msg.role === 'assistant' && 'reasoning_details' in msg) {
            const { reasoning_details, ...cleanMsg } = msg as any;
            return cleanMsg;
          }
          return msg;
        });
        
        // Don't pass tools to forced summarization - we just want a text response
        const forcedResponse = await client.chat([...historyForSummary, summaryPrompt], { systemPrompt });
        
        if (forcedResponse.content) {
          finalResponse = forcedResponse.content;
          await addMessage(session.id, 'user', summaryPrompt.content);
          await addMessage(session.id, 'assistant', forcedResponse.content);
        } else {
          // Fallback if forced summarization also returns no content
          console.log('[telegram-bot] WARNING: Forced summarization returned no content!');
          if (emptySearchNotification) {
            finalResponse = '🔍 متأسفانه نتیجه‌ای پیدا نشد.\n\nممکن است املای نام متفاوت باشه یا این شخص در سیستم ثبت نشده باشد.';
          } else {
            finalResponse = 'ℹ️ اطلاعاتی که جستجو کردم در بخش خلاصه پایین قابل مشاهده است.';
          }
        }
      }
    }

    // Build final display using response builder
    // Use captured flag to determine if forced summarization was used
    const forcedSummarizationUsed = !hadContentBeforeSummarization && totalToolCallsMade > 0;
    let finalContent: string;
    
    if (!finalResponse) {
      if (totalToolCallsMade === 0) {
        finalContent = '🤔 I didn\'t know how to respond. Could you try rephrasing your question?';
      } else {
        // Check if searches were made - provide appropriate "no results" message
        const hasSearchTools = allToolCallsMade.some(t => 
          t.name.includes('search') || t.name.includes('list') || t.name.includes('get')
        );
        
        if (hasSearchTools && allToolCallsMade.length >= 3) {
          // Likely searched extensively but found nothing
          let detailedSummary = '🔍 <b>Search Complete</b>\n\n';
          detailedSummary += `I searched through ${totalToolCallsMade} different ${totalToolCallsMade === 1 ? 'source' : 'sources'}, but couldn't find the information you're looking for.\n\n`;
          
          // Show what was searched
          if (reasoningSteps.length > 0) {
            detailedSummary += '📋 <b>What I Checked:</b>\n\n';
            reasoningSteps.forEach((step, i) => {
              if (step.tools.length > 0) {
                step.tools.forEach(tool => {
                  const toolDisplayName = formatToolName(tool.name).replace('🔧 ', '');
                  const formattedArgs = formatToolArgs(tool.args, 60);
                  detailedSummary += `  • ${toolDisplayName}${formattedArgs}\n`;
                });
              }
            });
            detailedSummary += '\n';
          }
          
          detailedSummary += '💡 <b>This might mean:</b>\n';
          detailedSummary += '• The data doesn\'t exist yet\n';
          detailedSummary += '• It\'s in a different location\n';
          detailedSummary += '• The search terms need to be adjusted\n\n';
          detailedSummary += 'Try asking about something else or providing more details.';
          
          finalContent = detailedSummary;
        } else {
          // Build a detailed summary for other failure cases
          let detailedSummary = '⚠️ <b>Response Generation Issue</b>\n\n';
          detailedSummary += `I executed ${totalToolCallsMade} tool ${totalToolCallsMade === 1 ? 'call' : 'calls'}, but couldn't generate a final summary.\n\n`;
          
          // Show reasoning steps with their associated tools
          if (reasoningSteps.length > 0) {
            detailedSummary += '🧠 <b>What I Did:</b>\n\n';
            reasoningSteps.forEach((step, i) => {
              const cleanText = markdownToTelegramHtml(step.reasoning.substring(0, 250));
              detailedSummary += `<b>Step ${i + 1}:</b>\n${cleanText}${step.reasoning.length > 250 ? '...' : ''}\n\n`;
              
              if (step.tools.length > 0) {
                detailedSummary += '<i>↳ Tools used:</i>\n';
                step.tools.forEach(tool => {
                  const toolDisplayName = formatToolName(tool.name).replace('🔧 ', '');
                  const formattedArgs = formatToolArgs(tool.args, 60);
                  detailedSummary += `  • ${toolDisplayName}${formattedArgs}\n`;
                });
                detailedSummary += '\n';
              }
            });
          } else if (allToolCallsMade.length > 0) {
            // Fallback: show tools if no reasoning steps were captured
            detailedSummary += '🔧 <b>Tools Called:</b>\n';
            allToolCallsMade.forEach((tool, i) => {
              const toolDisplayName = formatToolName(tool.name).replace('🔧 ', '');
              detailedSummary += `${i + 1}. ${toolDisplayName}\n`;
            });
            detailedSummary += '\n';
          }
          
          detailedSummary += '💡 <b>What you can do:</b>\n';
          detailedSummary += '• Ask me to "summarize what you found"\n';
          detailedSummary += '• Try rephrasing your question\n';
          detailedSummary += '• Be more specific about what you need\n\n';
          detailedSummary += '<i>This is a known limitation with the AI model.</i>';
          
          finalContent = detailedSummary;
        }
      }
    } else {
      // Use response builder for final response with expandable summary
      finalContent = buildFinalResponse(
        finalResponse,
        reasoningSteps,
        allToolCallsMade,
        forcedSummarizationUsed
      );
    }
    
    console.log('[telegram-bot] Sending final response, length:', finalContent.length);
    console.log('[telegram-bot] Final response content:', finalContent.substring(0, 500));
    
    // Parse AI-suggested buttons from response
    const { messageText, buttons } = parseAiButtons(finalContent);
    const keyboard = buttons.length > 0 ? createButtonKeyboard(buttons, telegramUserId) : undefined;
    
    console.log('[telegram-bot] Parsed buttons:', buttons.length);
    
    // Use the cleaned message text (without button tags)
    const cleanContent = messageText;
    
    // Update with final content or send new messages for long content
    if (cleanContent.length > 4000) {
      // Delete the streaming message and send chunks with safe HTML splitting
      try {
        await ctx.api.deleteMessage(sentMessage.chat.id, sentMessage.message_id);
      } catch (delError) {
        console.log('[telegram-bot] Could not delete message, continuing...');
      }
      const chunks = splitHtmlSafely(cleanContent, 4000);
      for (let i = 0; i < chunks.length; i++) {
        // Only add buttons to the last chunk
        const isLastChunk = i === chunks.length - 1;
        const replyOptions: any = { parse_mode: 'HTML' };
        if (isLastChunk && keyboard) {
          replyOptions.reply_markup = keyboard;
        }
        await ctx.reply(chunks[i], replyOptions);
      }
    } else {
      try {
        const editOptions: any = { parse_mode: 'HTML' };
        if (keyboard) {
          editOptions.reply_markup = keyboard;
        }
        await ctx.api.editMessageText(sentMessage.chat.id, sentMessage.message_id, cleanContent, editOptions);
      } catch (editError: any) {
        // If edit fails, the streamed message is already visible - no need to send duplicate
        // Common reasons: message content identical, message too old, or already deleted
        const errorDesc = editError?.description || editError?.message || '';
        
        // Only log non-duplicate errors
        if (!errorDesc.includes('message is not modified')) {
          console.log('[telegram-bot] Could not edit message:', errorDesc);
        }
        
        console.log('[telegram-bot] Streamed message is already visible, skipping duplicate');
      }
    }
    
  } catch (error) {
    console.error('[telegram-bot] AI chat error', error);
    
    // Get user language for localized error messages
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    
    // Provide more specific error messages
    let errorMessage = t('errors.generic');
    
    if (error instanceof Error) {
      const errorStr = error.message.toLowerCase();
      const errorStack = error.stack?.toLowerCase() || '';
      
      // Check for rate limit errors (429)
      if (errorStr.includes('429') || errorStr.includes('rate limit') || errorStr.includes('temporarily rate-limited') || errorStr.includes('provider returned error')) {
        const modelName = client.model.includes('gemini') ? 'Gemini' : 
                         client.model.includes('claude') ? 'Claude' :
                         client.model.includes('gpt') ? 'GPT' : (language === 'fa' ? 'مدل هوش مصنوعی' : 'AI model');
        
        errorMessage = `<b>${t('errors.rate_limit.title')}</b>\n\n` +
          t('errors.rate_limit.description', { model: modelName }) + '\n\n' +
          `<b>${t('errors.rate_limit.what_to_do')}</b>\n` +
          t('errors.rate_limit.wait') + '\n' +
          t('errors.rate_limit.message_saved') + '\n\n' +
          `<i>${t('errors.rate_limit.note')}</i>`;
      } else if (errorStr.includes('network connection failed') || errorStr.includes('socket hang up') || errorStr.includes('econnreset')) {
        errorMessage = `<b>${t('errors.network.title')}</b>\n\n` +
          t('errors.network.description') + '\n\n' +
          `<b>${t('errors.network.try')}</b>\n` +
          t('errors.network.wait_retry') + '\n' +
          t('errors.network.check_connection') + '\n' +
          t('errors.network.server_issue');
      } else if (errorStr.includes('tool use') || errorStr.includes('endpoints found')) {
        errorMessage = `<b>${t('errors.model_compatibility.title')}</b>\n\n` +
          t('errors.model_compatibility.description') + '\n\n' +
          `<b>${t('errors.model_compatibility.compatible_models')}</b>\n` +
          '• anthropic/claude-3.5-sonnet\n' +
          '• openai/gpt-4-turbo\n' +
          '• google/gemini-pro-1.5\n\n' +
          `<i>${t('errors.model_compatibility.ask_admin')}</i>`;
      } else if (errorStr.includes('insufficient credits') || errorStr.includes('quota')) {
        errorMessage = `<b>${t('errors.credits.title')}</b>\n\n` +
          t('errors.credits.description') + '\n\n' +
          t('errors.credits.ask_admin');
      } else if (errorStr.includes('unauthorized') || errorStr.includes('401')) {
        errorMessage = `<b>${t('errors.auth.title')}</b>\n\n` +
          t('errors.auth.description') + '\n\n' +
          t('errors.auth.ask_admin');
      } else if (errorStr.includes('timeout') || errorStr.includes('timed out')) {
        errorMessage = `<b>${t('errors.timeout.title')}</b>\n\n` +
          t('errors.timeout.description') + '\n\n' +
          `<b>${t('errors.timeout.try')}</b>\n` +
          t('errors.timeout.simplify') + '\n' +
          t('errors.timeout.retry') + '\n' +
          t('errors.timeout.break_up');
      }
    }
    
    // Try to send error message, with retry logic
    try {
      await ctx.reply(errorMessage, { parse_mode: 'HTML' });
    } catch (replyError) {
      console.error('[telegram-bot] Failed to send error message, retrying without HTML...', replyError);
      try {
        await ctx.reply('❌ Sorry, I encountered an error. Please try again.');
      } catch (finalError) {
        console.error('[telegram-bot] Could not send any error message to user', finalError);
      }
    }
  }
}
