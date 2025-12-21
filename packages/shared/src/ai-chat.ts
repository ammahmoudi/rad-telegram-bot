import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolArgs?: string;
  reasoningDetails?: unknown; // For Gemini reasoning preservation
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class OpenRouterClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'anthropic/claude-3.5-sonnet') {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    this.model = model;
  }

  /**
   * Generate a chat completion with conversation history
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {},
    tools?: ChatCompletionTool[],
  ): Promise<{
    content: string;
    toolCalls?: { id: string; name: string; arguments: string }[];
    finishReason: string;
    reasoningDetails?: unknown; // For Gemini reasoning preservation
  }> {
    const model = options.model || this.model;
    const systemPrompt = options.systemPrompt || 'You are a helpful AI assistant.';

    // Build messages array with system prompt
    const openaiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      if (msg.role === 'tool') {
        openaiMessages.push({
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.toolCallId || '',
        });
      } else if (msg.role === 'assistant' && msg.toolName) {
        // Assistant made tool call(s) - collect all tool calls in this turn
        const toolCalls: any[] = [];
        let j = i;
        
        while (j < messages.length && 
               messages[j].role === 'assistant' && 
               messages[j].toolName) {
          toolCalls.push({
            id: messages[j].toolCallId || '',
            type: 'function',
            function: {
              name: messages[j].toolName,
              arguments: messages[j].toolArgs || '{}',
            },
          });
          j++;
        }
        
        // Add single assistant message with all tool calls
        const assistantMsg: any = {
          role: 'assistant',
          content: null,
          tool_calls: toolCalls,
        };
        
        // Preserve reasoning_details for Gemini models if present
        // Only add reasoning_details if it exists and is not undefined
        if (msg.reasoningDetails !== undefined && msg.reasoningDetails !== null) {
          assistantMsg.reasoning_details = msg.reasoningDetails;
          console.log('[ai-chat] Attaching reasoning_details to assistant message:', {
            isArray: Array.isArray(msg.reasoningDetails),
            length: Array.isArray(msg.reasoningDetails) ? msg.reasoningDetails.length : 'N/A'
          });
        }
        
        openaiMessages.push(assistantMsg);
        
        // Skip ahead past the tool calls we've processed
        i = j - 1;
      } else {
        const regularMsg: any = {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        };
        
        // Don't preserve reasoning_details for regular assistant messages
        // (only for tool call messages as per OpenRouter docs)
        
        openaiMessages.push(regularMsg);
      }
    }

    try {
      const isGemini = model.includes('gemini') || model.includes('google');
      
      const requestBody: any = {
        model,
        messages: openaiMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        tools: tools && tools.length > 0 ? tools : undefined,
      };
      
      // Enable reasoning for Gemini models
      if (isGemini) {
        requestBody.reasoning = { enabled: true };
        
        // Debug: Log request details for Gemini
        console.log('[ai-chat] Sending Gemini request:', {
          model,
          messageCount: openaiMessages.length,
          messagesWithReasoning: openaiMessages.filter((m: any) => m.reasoning_details).length,
          toolsCount: requestBody.tools?.length || 0
        });
        
        // Log last few messages to see structure
        const lastMessages = openaiMessages.slice(-3);
        console.log('[ai-chat] Last 3 messages:', JSON.stringify(lastMessages, null, 2));
      }

      const completion = await this.client.chat.completions.create(requestBody);

      const choice = completion.choices[0];
      const message = choice.message;
      
      // Extract reasoning_details for Gemini models (OpenRouter extension)
      const messageWithReasoning = message as any;
      const reasoningDetails = messageWithReasoning.reasoning_details;
      
      // Debug: Log reasoning_details capture
      if (reasoningDetails) {
        console.log('[ai-chat] Captured reasoning_details from API:', {
          isArray: Array.isArray(reasoningDetails),
          length: Array.isArray(reasoningDetails) ? reasoningDetails.length : 'N/A',
          types: Array.isArray(reasoningDetails) ? reasoningDetails.map((r: any) => r.type) : 'N/A'
        });
      }

      // Handle tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        return {
          content: message.content || '',
          toolCalls: message.tool_calls.map((tc) => {
            // Handle both function and custom tool calls
            const func = 'function' in tc ? tc.function : undefined;
            return {
              id: tc.id,
              name: func?.name || '',
              arguments: func?.arguments || '{}',
            };
          }),
          finishReason: choice.finish_reason || 'stop',
          reasoningDetails, // Include reasoning for preservation in next turn
        };
      }

      return {
        content: message.content || '',
        finishReason: choice.finish_reason || 'stop',
        reasoningDetails, // Include reasoning for preservation in next turn
      };
    } catch (error) {
      console.error('[OpenRouterClient] Error:', error);
      throw new Error(`AI chat error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream a chat completion (for future implementation)
   */
  async *streamChat(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): AsyncGenerator<string, void, unknown> {
    // TODO: Implement streaming for better UX
    const result = await this.chat(messages, options);
    yield result.content;
  }
}

/**
 * Validate and clean message history to ensure tool messages always follow assistant tool_calls
 * This prevents OpenAI API errors about orphaned tool messages
 */
export function validateMessageHistory(messages: ChatMessage[]): ChatMessage[] {
  const cleaned: ChatMessage[] = [];
  const toolCallIds = new Set<string>();

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // Group consecutive assistant tool call messages together
    if (msg.role === 'assistant' && msg.toolName && msg.toolCallId) {
      const toolCalls: ChatMessage[] = [msg];
      if (msg.toolCallId) {
        toolCallIds.add(msg.toolCallId);
      }
      
      // Look ahead for more tool calls in the same turn
      while (i + 1 < messages.length && 
             messages[i + 1].role === 'assistant' && 
             messages[i + 1].toolName && 
             messages[i + 1].toolCallId) {
        i++;
        const nextMsg = messages[i];
        toolCalls.push(nextMsg);
        if (nextMsg.toolCallId) {
          toolCallIds.add(nextMsg.toolCallId);
        }
      }
      
      // Add all tool calls
      cleaned.push(...toolCalls);
      
      // Now collect the corresponding tool responses
      const toolResponses: ChatMessage[] = [];
      while (i + 1 < messages.length && messages[i + 1].role === 'tool') {
        i++;
        const toolMsg = messages[i];
        if (toolMsg.toolCallId && toolCallIds.has(toolMsg.toolCallId)) {
          toolResponses.push(toolMsg);
          toolCallIds.delete(toolMsg.toolCallId);
        }
      }
      
      cleaned.push(...toolResponses);
    }
    // Only include tool messages if we have the corresponding tool call
    else if (msg.role === 'tool') {
      if (msg.toolCallId && toolCallIds.has(msg.toolCallId)) {
        cleaned.push(msg);
        toolCallIds.delete(msg.toolCallId);
      }
      // Skip orphaned tool messages
    }
    // Include all other messages
    else {
      cleaned.push(msg);
    }
  }

  return cleaned;
}



/**
 * Trim conversation history to fit within context window
 * Keeps recent messages and ensures tool call/response pairs stay together
 */
export function trimConversationHistory(
  messages: ChatMessage[],
  maxMessages: number = 20,
): ChatMessage[] {
  if (messages.length <= maxMessages) {
    return removeOrphanedToolMessages(messages);
  }

  // Take last N messages, but ensure we don't break in the middle of tool calls
  let trimmed = messages.slice(-maxMessages);
  
  // If first message is a tool response, we need to include its assistant call
  if (trimmed.length > 0 && trimmed[0].role === 'tool') {
    // Find the assistant call for this tool response
    const toolCallId = trimmed[0].toolCallId;
    let startIdx = messages.length - maxMessages - 1;
    while (startIdx >= 0) {
      const msg = messages[startIdx];
      if (msg.role === 'assistant' && msg.toolCallId === toolCallId) {
        // Include this assistant message and all messages after it
        trimmed = messages.slice(startIdx);
        break;
      }
      startIdx--;
    }
  }
  
  return removeOrphanedToolMessages(trimmed);
}

/**
 * Remove orphaned tool calls and tool responses
 * - Remove tool responses without their assistant call
 * - Remove assistant tool calls without their responses
 * - Remove duplicate consecutive user messages
 */
function removeOrphanedToolMessages(messages: ChatMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];
  const validToolCallIds = new Set<string>();
  const toolResponseIds = new Set<string>();
  
  // First pass: collect tool call IDs and response IDs
  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.toolName && msg.toolCallId) {
      if (msg.toolCallId) {
        validToolCallIds.add(msg.toolCallId);
      }
    }
    if (msg.role === 'tool' && msg.toolCallId) {
      if (msg.toolCallId) {
        toolResponseIds.add(msg.toolCallId);
      }
    }
  }
  
  // Second pass: only include complete tool call/response pairs
  for (const msg of messages) {
    if (msg.role === 'tool') {
      // Only include tool response if we have its assistant call
      if (msg.toolCallId && validToolCallIds.has(msg.toolCallId)) {
        result.push(msg);
      }
    } else if (msg.role === 'assistant' && msg.toolName && msg.toolCallId) {
      // Only include assistant tool call if we have its response
      if (toolResponseIds.has(msg.toolCallId)) {
        result.push(msg);
      }
    } else {
      // Include all other messages (user, regular assistant)
      result.push(msg);
    }
  }
  
  // Third pass: remove duplicate consecutive user messages
  const deduplicated: ChatMessage[] = [];
  for (let i = 0; i < result.length; i++) {
    const msg = result[i];
    const prevMsg = deduplicated[deduplicated.length - 1];
    
    // Skip if this is a user message and previous is also a user message with same content
    if (msg.role === 'user' && prevMsg && prevMsg.role === 'user' && prevMsg.content === msg.content) {
      continue;
    }
    
    deduplicated.push(msg);
  }
  
  return deduplicated;
}
