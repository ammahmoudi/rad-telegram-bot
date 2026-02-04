import type { ChatCompletionTool } from 'openai/resources/chat/completions';
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    toolCallId?: string;
    toolName?: string;
    toolArgs?: string;
    reasoningDetails?: unknown;
    toolCallReasoningDetails?: unknown;
}
export interface ChatOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    useMiddleOutTransform?: boolean;
}
export interface LlmUsageData {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokens: number;
    cacheWriteTokens: number;
    reasoningTokens: number;
    audioTokens: number;
    cost: number;
    upstreamCost?: number;
}
export interface UsageTrackingContext {
    telegramUserId: string;
    sessionId?: string;
    messageId?: string;
}
export declare class OpenRouterClient {
    private client;
    model: string;
    private usageCallback?;
    constructor(apiKey: string, model?: string);
    /**
     * Set callback for usage tracking
     */
    setUsageCallback(callback: (usage: LlmUsageData, context: UsageTrackingContext, model: string, finishReason: string, hasToolCalls: boolean, toolCallCount: number, durationMs: number) => Promise<void>): void;
    /**
     * Generate a chat completion with conversation history
     */
    chat(messages: ChatMessage[], options?: ChatOptions, tools?: ChatCompletionTool[], trackingContext?: UsageTrackingContext): Promise<{
        content: string;
        toolCalls?: {
            id: string;
            name: string;
            arguments: string;
        }[];
        finishReason: string;
        reasoningDetails?: unknown;
    }>;
    /**
     * Stream a chat completion with live updates
     */
    streamChat(messages: ChatMessage[], options?: ChatOptions, tools?: ChatCompletionTool[], trackingContext?: UsageTrackingContext): AsyncGenerator<{
        type: 'reasoning' | 'content' | 'tool_call' | 'done';
        content?: string;
        toolCall?: {
            id: string;
            name: string;
            arguments: string;
        };
        finishReason?: string;
        reasoningDetails?: unknown;
    }, void, unknown>;
}
/**
 * Validate and clean message history to ensure tool messages always follow assistant tool_calls
 * This prevents OpenAI API errors about orphaned tool messages
 */
export declare function validateMessageHistory(messages: ChatMessage[]): ChatMessage[];
/**
 * Trim conversation history by token count
 * Keeps recent messages up to maxTokens limit
 */
export declare function trimConversationHistoryByTokens(messages: ChatMessage[], maxTokens?: number): ChatMessage[];
/**
 * Trim conversation history to fit within context window
 * Keeps recent messages and ensures tool call/response pairs stay together
 */
export declare function trimConversationHistory(messages: ChatMessage[], maxMessages?: number): ChatMessage[];
