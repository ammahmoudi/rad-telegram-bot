import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolArgs?: string;
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
    toolCalls?: Array<{
      id: string;
      name: string;
      arguments: string;
    }>;
    finishReason: string;
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
        openaiMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: toolCalls,
        });
        
        // Skip ahead past the tool calls we've processed
        i = j - 1;
      } else {
        openaiMessages.push({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        });
      }
    }

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: openaiMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        tools: tools && tools.length > 0 ? tools : undefined,
      });

      const choice = completion.choices[0];
      const message = choice.message;

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
        };
      }

      return {
        content: message.content || '',
        finishReason: choice.finish_reason || 'stop',
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
      toolCallIds.add(msg.toolCallId);
      
      // Look ahead for more tool calls in the same turn
      while (i + 1 < messages.length && 
             messages[i + 1].role === 'assistant' && 
             messages[i + 1].toolName && 
             messages[i + 1].toolCallId) {
        i++;
        toolCalls.push(messages[i]);
        toolCallIds.add(messages[i].toolCallId);
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

  // Simple strategy: take last N messages and clean orphans
  const trimmed = messages.slice(-maxMessages);
  return removeOrphanedToolMessages(trimmed);
}

/**
 * Remove orphaned tool calls and tool responses
 * - Remove tool responses without their assistant call
 * - Remove assistant tool calls without their responses
 */
function removeOrphanedToolMessages(messages: ChatMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];
  const validToolCallIds = new Set<string>();
  const toolResponseIds = new Set<string>();
  
  // First pass: collect tool call IDs and response IDs
  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.toolName && msg.toolCallId) {
      validToolCallIds.add(msg.toolCallId);
    }
    if (msg.role === 'tool' && msg.toolCallId) {
      toolResponseIds.add(msg.toolCallId);
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
  
  return result;
}
