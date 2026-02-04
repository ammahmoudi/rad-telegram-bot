export type LinkStateRecord = {
    state: string;
    telegramUserId: string;
    expiresAt: number;
};
export type PlankaTokenRecord = {
    telegramUserId: string;
    plankaBaseUrl: string;
    accessToken: string;
    updatedAt: number;
};
export type RastarTokenRecord = {
    telegramUserId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    userId: string;
    email: string;
    updatedAt: number;
};
export declare function getDb(): never;
export declare function purgeExpiredLinkStates(now?: number): Promise<number>;
export declare function createLinkState(telegramUserId: string, ttlSeconds?: number): Promise<string>;
export declare function peekLinkState(state: string): Promise<LinkStateRecord | null>;
export declare function consumeLinkState(state: string): Promise<LinkStateRecord | null>;
export declare function upsertPlankaToken(telegramUserId: string, plankaBaseUrl: string, accessToken: string): Promise<void>;
export declare function getPlankaToken(telegramUserId: string): Promise<PlankaTokenRecord | null>;
export declare function deletePlankaToken(telegramUserId: string): Promise<boolean>;
export type PlankaTokenListItem = {
    telegramUserId: string;
    plankaBaseUrl: string;
    updatedAt: number;
};
export declare function listPlankaTokens(): Promise<PlankaTokenListItem[]>;
export declare function upsertRastarToken(telegramUserId: string, accessToken: string, refreshToken: string, expiresAt: number, userId: string, email: string): Promise<void>;
export declare function getRastarToken(telegramUserId: string): Promise<RastarTokenRecord | null>;
export declare function deleteRastarToken(telegramUserId: string): Promise<boolean>;
export type RastarTokenListItem = {
    telegramUserId: string;
    email: string;
    updatedAt: number;
};
export declare function listRastarTokens(): Promise<RastarTokenListItem[]>;
export declare function getSystemConfig(key: string): Promise<string | null>;
export declare function setSystemConfig(key: string, value: string): Promise<void>;
export type ChatSessionRecord = {
    id: string;
    telegramUserId: string;
    createdAt: number;
    updatedAt: number;
    messageCount?: number;
};
export type MessageRecord = {
    id: string;
    sessionId: string;
    role: string;
    content: string;
    toolCallId?: string | null;
    toolName?: string | null;
    toolArgs?: string | null;
    createdAt: number;
    replyToMessageId?: number | null;
    threadId?: number | null;
    telegramMessageId?: number | null;
};
/**
 * Get or create a chat session for a user
 * Sessions are created on-demand and reused
 * Note: This is for backwards compatibility. Use getOrCreateThreadSession for proper thread-aware sessions.
 */
export declare function getOrCreateChatSession(telegramUserId: string): Promise<ChatSessionRecord>;
/**
 * Create a new chat session (e.g., for /new_chat command)
 * @param telegramUserId - User's Telegram ID
 * @param threadId - Optional thread/topic ID for thread-specific sessions
 */
export declare function createNewChatSession(telegramUserId: string, threadId?: number | null): Promise<ChatSessionRecord>;
/**
 * Get messages for a session
 */
export declare function getSessionMessages(sessionId: string, limit?: number): Promise<MessageRecord[]>;
/**
 * Add a message to a session
 */
export declare function addMessage(sessionId: string, role: string, content: string, toolCallId?: string, toolName?: string, toolArgs?: string, metadata?: {
    telegramMessageId?: number;
    replyToMessageId?: number;
    threadId?: number;
}): Promise<MessageRecord>;
/**
 * List all sessions for a user
 */
export declare function listUserSessions(telegramUserId: string): Promise<ChatSessionRecord[]>;
/**
 * Delete a chat session and all its messages
 */
export declare function deleteChatSession(sessionId: string): Promise<boolean>;
/**
 * Delete old sessions to manage storage
 * Keeps the most recent N sessions per user
 */
export declare function pruneOldSessions(telegramUserId: string, keepMostRecent?: number): Promise<number>;
/**
 * Restore tool results from McpToolLog into conversation history
 * This enriches the history with tool outputs that aren't saved in Message table
 *
 * @param sessionId - The chat session ID
 * @param messages - The messages from the Message table
 * @returns Messages with tool results inserted from McpToolLog
 */
export declare function restoreToolResultsFromLogs(sessionId: string, messages: MessageRecord[]): Promise<MessageRecord[]>;
export type McpToolLogRecord = {
    id: string;
    telegramUserId: string;
    sessionId?: string | null;
    messageId?: string | null;
    mcpServer: string;
    toolName: string;
    inputArgs: string;
    outputContent: string;
    success: boolean;
    errorMessage?: string | null;
    executionTimeMs?: number | null;
    createdAt: number;
};
/**
 * Log an MCP tool call for debugging
 */
export declare function logMcpToolCall(params: {
    telegramUserId: string;
    sessionId?: string;
    messageId?: string;
    mcpServer: string;
    toolName: string;
    inputArgs: Record<string, any>;
    outputContent: string;
    success: boolean;
    errorMessage?: string;
    executionTimeMs?: number;
}): Promise<void>;
/**
 * Get recent MCP tool logs for a user
 */
export declare function getMcpToolLogs(telegramUserId: string, limit?: number): Promise<McpToolLogRecord[]>;
/**
 * Get all MCP tool logs (admin view) with optional filters
 */
export declare function getAllMcpToolLogs(options?: {
    limit?: number;
    telegramUserId?: string;
    sessionId?: string;
    mcpServer?: string;
    success?: boolean;
    startDate?: number;
    endDate?: number;
}): Promise<McpToolLogRecord[]>;
/**
 * Delete old MCP tool logs (cleanup)
 */
export declare function deleteOldMcpToolLogs(olderThanDays?: number): Promise<number>;
/**
 * Get messages for a session with their associated tool calls
 */
export declare function getSessionMessagesWithToolCalls(sessionId: string): Promise<{
    message: MessageRecord;
    toolCalls: McpToolLogRecord[];
    llmCalls: {
        id: string;
        model: string;
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        cachedTokens: number;
        cacheWriteTokens: number;
        reasoningTokens: number;
        cost: number;
        upstreamCost: number | null;
        finishReason: string | null;
        hasToolCalls: boolean;
        toolCallCount: number;
        requestDurationMs: number | null;
        createdAt: number;
    }[];
}[]>;
