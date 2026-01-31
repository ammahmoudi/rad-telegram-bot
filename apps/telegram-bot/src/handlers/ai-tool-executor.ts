/**
 * AI tool execution logic
 * Handles tool calls from AI models and routes them to appropriate MCP servers
 */

import type { BotContext } from '../bot.js';
import type { ChatMessage } from '@rad/shared';
import { addMessage, getUserLanguage, getSystemConfig } from '@rad/shared';
import { executeMcpTool } from '../planka-tools.js';
import { executeRastarTool } from '../rastar-tools.js';
import { executeTimeTool } from '../time-tools.js';
import { markdownToTelegramHtml, formatToolName, formatToolArgs } from '../utils/formatting.js';
import { splitHtmlSafely } from '../utils/html-splitter.js';
import { LOADING_FRAMES } from '../types/streaming.js';

export interface ToolExecutionResult {
  trimmedHistory: ChatMessage[];
  toolCallsDisplay: string[];
  allToolCallsMade: Array<{ name: string; args: any }>;
  allReasoningTexts: string[];
}

/**
 * Execute AI tool calls and update message with progress
 */
export async function executeAiTools(
  ctx: BotContext,
  client: any,
  trimmedHistory: ChatMessage[],
  systemPrompt: string,
  tools: any[],
  sessionId: string,
  sentMessage: { chat: { id: number }, message_id: number },
  maxToolCalls: number
): Promise<ToolExecutionResult> {
  const toolCallsDisplay: string[] = [];
  const activeTools = new Set<string>();
  const allToolCallsMade: Array<{ name: string; args: any }> = [];
  const allReasoningTexts: string[] = [];
  let loadingFrameIndex = 0;
  
  // Get user's language for translated messages
  const telegramUserId = ctx.from?.id?.toString();
  const telegramLanguage = ctx.from?.language_code;
  const language = telegramUserId ? await getUserLanguage(telegramUserId, telegramLanguage) : 'fa';
  const toolsLabel = language === 'en' ? 'Tools' : 'ابزارها';
  const executingLabel = language === 'en' ? 'Executing' : 'در حال اجرا';
  const reasoningLabel = language === 'en' ? 'Reasoning...' : 'در حال تحلیل...';
  
  console.log('[ai-tools] Starting tool execution...');
  
  // Check if middle-out transform is enabled (default: true)
  const enableMiddleOut = (await getSystemConfig('ENABLE_MIDDLE_OUT_TRANSFORM')) !== 'false';
  
  // Get full response with tool calls
  // Enable middle-out transform to automatically compress large contexts
  let response = await client.chat(
    trimmedHistory, 
    { 
      systemPrompt, 
      useMiddleOutTransform: enableMiddleOut 
    }, 
    tools,
    {
      telegramUserId: ctx.from?.id?.toString() || 'unknown',
      sessionId,
      messageId: String(sentMessage.message_id),
    }
  );
  
  // Handle tool calls iteratively
  while (response.toolCalls && response.toolCalls.length > 0 && maxToolCalls > 0) {
    maxToolCalls--;

    // Add tool calls to history and database, mapping toolCallId to messageId
    const toolCallIdToMessageId = new Map<string, string>();
    for (const toolCall of response.toolCalls) {
      const savedMessage = await addMessage(
        sessionId,
        'assistant',
        '',
        toolCall.id,
        toolCall.name,
        toolCall.arguments,
      );
      toolCallIdToMessageId.set(toolCall.id, savedMessage.id);
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
    
    const assistantMessages: ChatMessage[] = response.toolCalls.map((tc: any) => ({
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
      const mcpToolName = toolCall.name;
      
      // Track tool for display
      if (!activeTools.has(toolCall.name)) {
        activeTools.add(toolCall.name);
        
        // Parse arguments safely
        let parsedArgs: any;
        try {
          parsedArgs = JSON.parse(toolCall.arguments);
        } catch (parseError) {
          console.error('[ai-tools] Failed to parse tool arguments:', {
            tool: toolCall.name,
            arguments: toolCall.arguments,
            error: parseError instanceof Error ? parseError.message : String(parseError)
          });
          // Skip this tool call
          continue;
        }
        
        allToolCallsMade.push({ name: toolCall.name, args: parsedArgs });
        
        // Add to display list
        const toolDisplayName = formatToolName(toolCall.name);
        const formattedArgsForList = formatToolArgs(toolCall.arguments, 50);
        const toolDisplayWithArgs = `${toolDisplayName}${formattedArgsForList}`;
        
        if (!toolCallsDisplay.includes(toolDisplayWithArgs)) {
          toolCallsDisplay.push(toolDisplayWithArgs);
          
          // Update message to show new tool
          loadingFrameIndex = (loadingFrameIndex + 1) % LOADING_FRAMES.length;
          const loadingEmoji = LOADING_FRAMES[loadingFrameIndex];
          
          let tempReasoningDisplay = '';
          if (response.reasoningDetails && Array.isArray(response.reasoningDetails)) {
            const textDetails = response.reasoningDetails
              .filter((detail: any) => detail.type === 'reasoning.text')
              .map((detail: any) => detail.text)
              .join('\n\n');
            if (textDetails) {
              allReasoningTexts.push(textDetails);
              tempReasoningDisplay = `🧠 <b>${reasoningLabel}</b>\n\n<blockquote>` + 
                markdownToTelegramHtml(textDetails).substring(0, 500) + 
                (textDetails.length > 500 ? '...' : '') + 
                '</blockquote>\n\n';
            }
          }
          
          let tempToolsDisplay = `<b>🛠️ ${toolsLabel} ${loadingEmoji}</b>\n`;
          tempToolsDisplay += toolCallsDisplay.map(t => `  ${t}`).join('\n') + '\n';
          tempToolsDisplay += `\n💭 <i>${executingLabel} ${toolDisplayName.replace('🔧 ', '')}...</i> ${loadingEmoji}`;
          
          // Ensure total content doesn't exceed Telegram's limit
          let tempContent = tempReasoningDisplay + tempToolsDisplay;
          if (tempContent.length > 4000) {
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
          } catch (editError) {
            // Ignore edit errors
          }
        }
      }
      
      // Route tool calls based on prefix
      const assistantMessageId = toolCallIdToMessageId.get(toolCall.id);
      const userLanguage = ctx.session.language || 'en';
      
      let toolResult;
      
      // Parse arguments with error handling
      let toolArgs: any;
      try {
        toolArgs = JSON.parse(toolCall.arguments);
      } catch (parseError) {
        console.error('[ai-tools] Failed to parse arguments for tool execution:', {
          tool: mcpToolName,
          arguments: toolCall.arguments,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        // Create error result
        toolResult = `Error: Invalid tool arguments - ${parseError instanceof Error ? parseError.message : 'Failed to parse JSON'}`;
        
        // Add error result to history
        const userMessages: ChatMessage[] = [{
          role: 'tool',
          content: toolResult,
          toolCallId: toolCall.id,
          toolName: toolCall.name,
        }];
        await addMessage(sessionId, 'user', toolResult, undefined, toolCall.name, undefined, toolCall.id);
        trimmedHistory.push(...userMessages);
        continue;
      }
      
      if (mcpToolName.startsWith('rastar.') || mcpToolName.startsWith('rastar_')) {
        toolResult = await executeRastarTool(
          String(ctx.from?.id ?? ''),
          mcpToolName,
          toolArgs,
          sessionId,
          assistantMessageId,
          userLanguage,
        );
      } else if (mcpToolName.startsWith('planka_')) {
        toolResult = await executeMcpTool(
          String(ctx.from?.id ?? ''),
          mcpToolName,
          toolArgs,
          sessionId,
          assistantMessageId,
          userLanguage,
        );
      } else {
        // Time tools or other MCP servers
        toolResult = await executeTimeTool(
          mcpToolName,
          toolArgs,
          String(ctx.from?.id ?? ''),
          sessionId,
          assistantMessageId,
        );
      }
      
      // Add tool result to history (for AI context only - not saved to Message table)
      // Tool results are already logged in McpToolLog table for debugging
      trimmedHistory.push({
        role: 'tool',
        content: toolResult.success ? toolResult.content : `Error: ${toolResult.error}`,
        toolCallId: toolCall.id,
      });
    }
    
    // Get next response from AI
    response = await client.chat(
      trimmedHistory, 
      { 
        systemPrompt,
        useMiddleOutTransform: enableMiddleOut 
      }, 
      tools,
      {
        telegramUserId: ctx.from?.id?.toString() || 'unknown',
        sessionId,
        messageId: String(sentMessage.message_id),
      }
    );
  }
  
  return {
    trimmedHistory,
    toolCallsDisplay,
    allToolCallsMade,
    allReasoningTexts
  };
}
