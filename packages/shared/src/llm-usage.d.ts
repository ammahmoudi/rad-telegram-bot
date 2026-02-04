import type { LlmUsageData, UsageTrackingContext } from './ai-chat.js';
/**
 * Save LLM usage data to database
 */
export declare function saveLlmUsage(usage: LlmUsageData, context: UsageTrackingContext, model: string, finishReason: string, hasToolCalls: boolean, toolCallCount: number, requestDurationMs: number): Promise<void>;
/**
 * Get total usage stats for a user
 */
export declare function getUserUsageStats(telegramUserId: string): Promise<{
    totalCalls: any;
    totalTokens: any;
    promptTokens: any;
    completionTokens: any;
    totalCost: any;
}>;
/**
 * Get total usage stats for a session
 */
export declare function getSessionUsageStats(sessionId: string): Promise<{
    totalCalls: any;
    totalTokens: any;
    promptTokens: any;
    completionTokens: any;
    totalCost: any;
}>;
/**
 * Get recent LLM calls with pagination
 */
export declare function getRecentLlmCalls(options: {
    telegramUserId?: string;
    sessionId?: string;
    limit?: number;
    offset?: number;
}): Promise<any>;
