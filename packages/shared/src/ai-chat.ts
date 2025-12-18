import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { getPlankaToken } from './db.js';

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

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant integrated with a Telegram bot. You can help users manage their Planka tasks and boards.

When users ask about Planka, you can use the available tools to:
- List boards, lists, and cards
- Create new cards
- Update card details
- Move cards between lists
- Search for cards

Always be concise and friendly. Use Telegram-friendly formatting (HTML tags like <b>, <i>, <code>).`;

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
    const systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;

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
 * Get Planka MCP tools for the AI assistant
 */
export async function getPlankaMcpTools(telegramUserId: string): Promise<ChatCompletionTool[]> {
  const token = await getPlankaToken(telegramUserId);
  if (!token) {
    return [];
  }

  // Define available Planka tools
  return [
    {
      type: 'function',
      function: {
        name: 'planka_list_boards',
        description: 'List all accessible Planka boards',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'planka_list_cards',
        description: 'List cards in a specific board or list',
        parameters: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'The ID of the board',
            },
            listId: {
              type: 'string',
              description: 'Optional: The ID of the list to filter cards',
            },
          },
          required: ['boardId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'planka_create_card',
        description: 'Create a new card in a Planka list',
        parameters: {
          type: 'object',
          properties: {
            listId: {
              type: 'string',
              description: 'The ID of the list where the card should be created',
            },
            name: {
              type: 'string',
              description: 'The title/name of the card',
            },
            description: {
              type: 'string',
              description: 'Optional: The description of the card',
            },
          },
          required: ['listId', 'name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'planka_update_card',
        description: 'Update an existing Planka card',
        parameters: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card to update',
            },
            name: {
              type: 'string',
              description: 'Optional: New name for the card',
            },
            description: {
              type: 'string',
              description: 'Optional: New description for the card',
            },
          },
          required: ['cardId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'planka_search_cards',
        description: 'Search for cards by keyword across all boards',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find cards',
            },
          },
          required: ['query'],
        },
      },
    },
  ];
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
