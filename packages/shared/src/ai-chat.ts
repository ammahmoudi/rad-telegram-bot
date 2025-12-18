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
    for (const msg of messages) {
      if (msg.role === 'tool') {
        openaiMessages.push({
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.toolCallId || '',
        });
      } else if (msg.role === 'assistant' && msg.toolName) {
        // Assistant made a tool call
        openaiMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: msg.toolCallId || '',
              type: 'function',
              function: {
                name: msg.toolName,
                arguments: msg.toolArgs || '{}',
              },
            },
          ],
        });
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

  for (const msg of messages) {
    // Track assistant tool calls
    if (msg.role === 'assistant' && msg.toolName && msg.toolCallId) {
      toolCallIds.add(msg.toolCallId);
      cleaned.push(msg);
    }
    // Only include tool messages if we have the corresponding tool call
    else if (msg.role === 'tool') {
      if (msg.toolCallId && toolCallIds.has(msg.toolCallId)) {
        cleaned.push(msg);
        // Remove from set once used
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
 * Keeps system prompt, recent messages, and ensures tool call/response pairs stay together
 */
export function trimConversationHistory(
  messages: ChatMessage[],
  maxMessages: number = 20,
): ChatMessage[] {
  if (messages.length <= maxMessages) {
    return messages;
  }

  // Always keep the most recent messages
  const trimmed = messages.slice(-maxMessages);

  // Ensure tool call/response pairs are complete
  const result: ChatMessage[] = [];
  for (let i = 0; i < trimmed.length; i++) {
    const msg = trimmed[i];
    result.push(msg);

    // If this is a tool call, make sure we include the response
    if (msg.toolName && i + 1 < trimmed.length && trimmed[i + 1].role === 'tool') {
      result.push(trimmed[i + 1]);
      i++; // Skip next iteration
    }
  }

  return result;
}
