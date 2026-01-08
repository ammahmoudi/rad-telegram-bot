import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolArgs?: string;
  reasoningDetails?: unknown; // For Gemini reasoning preservation (array of all reasoning)
  toolCallReasoningDetails?: unknown; // Reasoning specific to this tool call
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useMiddleOutTransform?: boolean; // Enable OpenRouter's middle-out compression for large contexts
}

export class OpenRouterClient {
  private client: OpenAI;
  public model: string; // Public so bot can check model type

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
        let allReasoningDetails: any[] = [];
        
        while (j < messages.length && 
               messages[j].role === 'assistant' && 
               messages[j].toolName) {
          const toolCall: any = {
            id: messages[j].toolCallId || '',
            type: 'function',
            function: {
              name: messages[j].toolName,
              arguments: messages[j].toolArgs || '{}',
            },
          };
          
          // Don't attach reasoning to individual tool calls - it goes at message level
          toolCalls.push(toolCall);
          
          // Collect all reasoning details (they reference tool calls by ID)
          if (messages[j].reasoningDetails && Array.isArray(messages[j].reasoningDetails)) {
            allReasoningDetails.push(...(messages[j].reasoningDetails as any[]));
          }
          
          j++;
        }
        
        // Add single assistant message with all tool calls
        const assistantMsg: any = {
          role: 'assistant',
          content: null,
          tool_calls: toolCalls,
        };
        
        // Preserve all reasoning_details for Gemini models if present
        // reasoning_details is an array at message level, with each item having an id that matches a tool call
        if (allReasoningDetails.length > 0) {
          assistantMsg.reasoning_details = allReasoningDetails;
          console.log('[ai-chat] Attaching reasoning_details to assistant message:', {
            isArray: true,
            length: allReasoningDetails.length
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
      
      // Enable middle-out transform for automatic context compression (OpenRouter feature)
      // This helps handle large prompts by automatically compressing the middle of the conversation
      if (options.useMiddleOutTransform) {
        requestBody.transforms = ['middle-out'];
        console.log('[ai-chat] Enabled middle-out transform for context compression');
      }
      
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
   * Stream a chat completion with live updates
   */
  async *streamChat(
    messages: ChatMessage[],
    options: ChatOptions = {},
    tools?: ChatCompletionTool[],
  ): AsyncGenerator<{
    type: 'reasoning' | 'content' | 'tool_call' | 'done';
    content?: string;
    toolCall?: { id: string; name: string; arguments: string };
    finishReason?: string;
    reasoningDetails?: unknown;
  }, void, unknown> {
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
        if (msg.reasoningDetails !== undefined && msg.reasoningDetails !== null) {
          assistantMsg.reasoning_details = msg.reasoningDetails;
        }
        
        openaiMessages.push(assistantMsg);
        
        // Skip ahead past the tool calls we've processed
        i = j - 1;
      } else {
        const regularMsg: any = {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        };
        
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
        stream: true,
      };
      
      // Enable reasoning for Gemini models
      if (isGemini) {
        requestBody.reasoning = { enabled: true };
      }

      // Create stream - OpenAI SDK returns a Stream when stream:true is set
      const response = await this.client.chat.completions.create(requestBody);
      const stream = response as any; // The response IS the stream when stream:true

      let accumulatedContent = '';
      let toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();
      let reasoningDetailsAccumulated: any[] = [];
      let finishReason = 'stop';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const message = chunk.choices[0]?.message;
        const chunkWithError = chunk as any;
        
        // Check for mid-stream errors (OpenRouter specific)
        if (chunkWithError.error) {
          console.error('[ai-chat] Mid-stream error:', chunkWithError.error);
          throw new Error(`Stream error: ${chunkWithError.error.message || 'Unknown error'}`);
        }
        
        // Check for error finish reason
        if (chunk.choices[0]?.finish_reason === 'error') {
          console.error('[ai-chat] Stream terminated with error finish_reason');
          throw new Error('Stream terminated due to error');
        }
        
        if (!delta && !message) continue;

        // Handle reasoning content (Gemini-specific)
        const chunkWithReasoning = chunk as any;
        if (chunkWithReasoning.reasoning_details) {
          reasoningDetailsAccumulated.push(...chunkWithReasoning.reasoning_details);
          
          // Extract reasoning text if available
          const reasoningText = chunkWithReasoning.reasoning_details
            .filter((detail: any) => detail.type === 'reasoning.text')
            .map((detail: any) => detail.text)
            .join('\n');
          
          yield {
            type: 'reasoning',
            reasoningDetails: chunkWithReasoning.reasoning_details,
            content: reasoningText || undefined,
          };
        }

        // Handle content streaming from delta
        if (delta?.content) {
          accumulatedContent += delta.content;
          yield {
            type: 'content',
            content: delta.content,
          };
        }
        
        // Handle content from message (final chunk for reasoning models)
        if (message?.content && !accumulatedContent) {
          accumulatedContent = message.content;
          yield {
            type: 'content',
            content: message.content,
          };
        }

        // Handle tool calls
        if (delta?.tool_calls) {
          for (const toolCallDelta of delta.tool_calls) {
            const index = toolCallDelta.index;
            
            if (!toolCalls.has(index)) {
              toolCalls.set(index, {
                id: toolCallDelta.id || '',
                name: toolCallDelta.function?.name || '',
                arguments: '',
              });
            }
            
            const toolCall = toolCalls.get(index)!;
            
            if (toolCallDelta.id) {
              toolCall.id = toolCallDelta.id;
            }
            if (toolCallDelta.function?.name) {
              toolCall.name = toolCallDelta.function.name;
              // Yield tool call as soon as we know its name
              yield {
                type: 'tool_call',
                toolCall: { ...toolCall },
              };
            }
            if (toolCallDelta.function?.arguments) {
              toolCall.arguments += toolCallDelta.function.arguments;
            }
          }
        }

        // Check for finish reason
        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason;
        }
      }

      // Yield final done event
      yield {
        type: 'done',
        finishReason,
        content: accumulatedContent,
        reasoningDetails: reasoningDetailsAccumulated.length > 0 ? reasoningDetailsAccumulated : undefined,
      };

    } catch (error) {
      console.error('[OpenRouterClient] Stream error:', error);
      throw new Error(`AI stream error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
 * Estimate token count for a message (rough approximation)
 * 1 token ≈ 4 characters for English text
 */
function estimateTokens(message: ChatMessage): number {
  const contentTokens = Math.ceil(message.content.length / 4);
  const toolArgsTokens = message.toolArgs ? Math.ceil(message.toolArgs.length / 4) : 0;
  return contentTokens + toolArgsTokens + 10; // +10 for role/metadata overhead
}

/**
 * Trim conversation history by token count
 * Keeps recent messages up to maxTokens limit
 */
export function trimConversationHistoryByTokens(
  messages: ChatMessage[],
  maxTokens: number = 4000,
): ChatMessage[] {
  let totalTokens = 0;
  let startIndex = messages.length;
  
  // Count backwards to keep most recent messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(messages[i]);
    if (totalTokens + msgTokens > maxTokens && startIndex < messages.length) {
      // Exceeded limit, stop here
      break;
    }
    totalTokens += msgTokens;
    startIndex = i;
  }
  
  let trimmed = messages.slice(startIndex);
  
  // If first message is a tool response, include its assistant call
  if (trimmed.length > 0 && trimmed[0].role === 'tool') {
    const toolCallId = trimmed[0].toolCallId;
    let searchIdx = startIndex - 1;
    while (searchIdx >= 0) {
      const msg = messages[searchIdx];
      if (msg.role === 'assistant' && msg.toolCallId === toolCallId) {
        trimmed = messages.slice(searchIdx);
        break;
      }
      searchIdx--;
    }
  }
  
  return removeOrphanedToolMessages(trimmed);
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
