import crypto from 'crypto';
import { decryptString, encryptString } from './crypto.js';
import { getPrisma } from './prisma.js';
export function getDb() {
    throw new Error('getDb() removed: use Prisma-based helpers (async).');
}
export async function purgeExpiredLinkStates(now = Date.now()) {
    const res = await getPrisma().linkState.deleteMany({ where: { expiresAt: { lte: BigInt(now) } } });
    return res.count;
}
export async function createLinkState(telegramUserId, ttlSeconds = 10 * 60) {
    await purgeExpiredLinkStates();
    const state = cryptoRandomBase64Url(32);
    const expiresAt = Date.now() + ttlSeconds * 1000;
    await getPrisma().linkState.create({
        data: {
            state,
            telegramUserId,
            expiresAt: BigInt(expiresAt),
        },
    });
    return state;
}
export async function peekLinkState(state) {
    await purgeExpiredLinkStates();
    const found = await getPrisma().linkState.findUnique({ where: { state } });
    if (!found)
        return null;
    const expiresAt = Number(found.expiresAt);
    if (expiresAt <= Date.now())
        return null;
    return {
        state: found.state,
        telegramUserId: found.telegramUserId,
        expiresAt,
    };
}
export async function consumeLinkState(state) {
    await purgeExpiredLinkStates();
    const prisma = getPrisma();
    const now = Date.now();
    const record = await prisma.$transaction(async (tx) => {
        const found = await tx.linkState.findUnique({ where: { state } });
        if (!found)
            return null;
        await tx.linkState.delete({ where: { state } });
        return found;
    });
    if (!record)
        return null;
    const expiresAt = Number(record.expiresAt);
    if (expiresAt <= now)
        return null;
    return {
        state: record.state,
        telegramUserId: record.telegramUserId,
        expiresAt,
    };
}
export async function upsertPlankaToken(telegramUserId, plankaBaseUrl, accessToken) {
    const updatedAt = Date.now();
    const enc = encryptString(accessToken);
    await getPrisma().plankaToken.upsert({
        where: { telegramUserId },
        create: {
            telegramUserId,
            plankaBaseUrl,
            accessTokenEnc: enc,
            updatedAt: BigInt(updatedAt),
        },
        update: {
            plankaBaseUrl,
            accessTokenEnc: enc,
            updatedAt: BigInt(updatedAt),
        },
    });
}
export async function getPlankaToken(telegramUserId) {
    const row = await getPrisma().plankaToken.findUnique({ where: { telegramUserId } });
    if (!row)
        return null;
    return {
        telegramUserId: row.telegramUserId,
        plankaBaseUrl: row.plankaBaseUrl,
        accessToken: decryptString(row.accessTokenEnc),
        updatedAt: Number(row.updatedAt),
    };
}
export async function deletePlankaToken(telegramUserId) {
    try {
        await getPrisma().plankaToken.delete({ where: { telegramUserId } });
        return true;
    }
    catch {
        return false;
    }
}
export async function listPlankaTokens() {
    const rows = await getPrisma().plankaToken.findMany({
        select: { telegramUserId: true, plankaBaseUrl: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => ({
        telegramUserId: r.telegramUserId,
        plankaBaseUrl: r.plankaBaseUrl,
        updatedAt: Number(r.updatedAt),
    }));
}
// ============================================================================
// Rastar Token Management
// ============================================================================
export async function upsertRastarToken(telegramUserId, accessToken, refreshToken, expiresAt, userId, email) {
    const updatedAt = Date.now();
    const accessTokenEnc = encryptString(accessToken);
    const refreshTokenEnc = encryptString(refreshToken);
    await getPrisma().rastarToken.upsert({
        where: { telegramUserId },
        create: {
            telegramUserId,
            accessTokenEnc,
            refreshTokenEnc,
            expiresAt: BigInt(expiresAt),
            userId,
            email,
            updatedAt: BigInt(updatedAt),
        },
        update: {
            accessTokenEnc,
            refreshTokenEnc,
            expiresAt: BigInt(expiresAt),
            userId,
            email,
            updatedAt: BigInt(updatedAt),
        },
    });
}
export async function getRastarToken(telegramUserId) {
    const row = await getPrisma().rastarToken.findUnique({ where: { telegramUserId } });
    if (!row)
        return null;
    return {
        telegramUserId: row.telegramUserId,
        accessToken: decryptString(row.accessTokenEnc),
        refreshToken: decryptString(row.refreshTokenEnc),
        expiresAt: Number(row.expiresAt),
        userId: row.userId,
        email: row.email,
        updatedAt: Number(row.updatedAt),
    };
}
export async function deleteRastarToken(telegramUserId) {
    try {
        await getPrisma().rastarToken.delete({ where: { telegramUserId } });
        return true;
    }
    catch {
        return false;
    }
}
export async function listRastarTokens() {
    const rows = await getPrisma().rastarToken.findMany({
        select: { telegramUserId: true, email: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => ({
        telegramUserId: r.telegramUserId,
        email: r.email,
        updatedAt: Number(r.updatedAt),
    }));
}
function cryptoRandomBase64Url(bytes) {
    const buf = crypto.randomBytes(bytes);
    return buf
        .toString('base64')
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');
}
export async function getSystemConfig(key) {
    const row = await getPrisma().systemConfig.findUnique({ where: { key } });
    return row?.value ?? null;
}
export async function setSystemConfig(key, value) {
    await getPrisma().systemConfig.upsert({
        where: { key },
        create: { key, value },
        update: { value },
    });
}
/**
 * Get or create a chat session for a user
 * Sessions are created on-demand and reused
 * Note: This is for backwards compatibility. Use getOrCreateThreadSession for proper thread-aware sessions.
 */
export async function getOrCreateChatSession(telegramUserId) {
    const prisma = getPrisma();
    // Try to get the most recent session (without thread)
    const existing = await prisma.chatSession.findFirst({
        where: {
            telegramUserId,
            threadId: null // Only get sessions without threadId
        },
        orderBy: { updatedAt: 'desc' },
    });
    if (existing) {
        return {
            id: existing.id,
            telegramUserId: existing.telegramUserId,
            createdAt: Number(existing.createdAt),
            updatedAt: Number(existing.updatedAt),
        };
    }
    // Create new session without threadId
    const now = Date.now();
    const session = await prisma.chatSession.create({
        data: {
            telegramUserId,
            threadId: null,
            createdAt: BigInt(now),
            updatedAt: BigInt(now),
        },
    });
    return {
        id: session.id,
        telegramUserId: session.telegramUserId,
        createdAt: Number(session.createdAt),
        updatedAt: Number(session.updatedAt),
    };
}
/**
 * Create a new chat session (e.g., for /new_chat command)
 * @param telegramUserId - User's Telegram ID
 * @param threadId - Optional thread/topic ID for thread-specific sessions
 */
export async function createNewChatSession(telegramUserId, threadId) {
    const now = Date.now();
    const session = await getPrisma().chatSession.create({
        data: {
            telegramUserId,
            threadId: threadId ? BigInt(threadId) : null,
            createdAt: BigInt(now),
            updatedAt: BigInt(now),
        },
    });
    return {
        id: session.id,
        telegramUserId: session.telegramUserId,
        createdAt: Number(session.createdAt),
        updatedAt: Number(session.updatedAt),
    };
}
/**
 * Get messages for a session
 */
export async function getSessionMessages(sessionId, limit = 50) {
    const messages = await getPrisma().message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: limit,
    });
    return messages.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        toolCallId: m.toolCallId,
        toolName: m.toolName,
        toolArgs: m.toolArgs,
        createdAt: Number(m.createdAt),
    }));
}
/**
 * Add a message to a session
 */
export async function addMessage(sessionId, role, content, toolCallId, toolName, toolArgs, metadata) {
    const now = Date.now();
    const prisma = getPrisma();
    const message = await prisma.message.create({
        data: {
            sessionId,
            role,
            content,
            toolCallId,
            toolName,
            toolArgs,
            telegramMessageId: metadata?.telegramMessageId ? BigInt(metadata.telegramMessageId) : null,
            replyToMessageId: metadata?.replyToMessageId ? BigInt(metadata.replyToMessageId) : null,
            threadId: metadata?.threadId ? BigInt(metadata.threadId) : null,
            createdAt: BigInt(now),
        },
    });
    // Update session updatedAt
    await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: BigInt(now) },
    });
    return {
        id: message.id,
        sessionId: message.sessionId,
        role: message.role,
        content: message.content,
        toolCallId: message.toolCallId,
        toolName: message.toolName,
        toolArgs: message.toolArgs,
        createdAt: Number(message.createdAt),
    };
}
/**
 * List all sessions for a user
 */
export async function listUserSessions(telegramUserId) {
    const sessions = await getPrisma().chatSession.findMany({
        where: { telegramUserId },
        orderBy: { updatedAt: 'desc' },
        include: {
            _count: {
                select: { messages: true },
            },
        },
    });
    return sessions.map((s) => ({
        id: s.id,
        telegramUserId: s.telegramUserId,
        createdAt: Number(s.createdAt),
        updatedAt: Number(s.updatedAt),
        messageCount: s._count.messages,
    }));
}
/**
 * Delete a chat session and all its messages
 */
export async function deleteChatSession(sessionId) {
    try {
        await getPrisma().chatSession.delete({ where: { id: sessionId } });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Delete old sessions to manage storage
 * Keeps the most recent N sessions per user
 */
export async function pruneOldSessions(telegramUserId, keepMostRecent = 5) {
    const prisma = getPrisma();
    const sessions = await prisma.chatSession.findMany({
        where: { telegramUserId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
    });
    if (sessions.length <= keepMostRecent) {
        return 0;
    }
    const toDelete = sessions.slice(keepMostRecent).map((s) => s.id);
    const result = await prisma.chatSession.deleteMany({
        where: { id: { in: toDelete } },
    });
    return result.count;
}
/**
 * Restore tool results from McpToolLog into conversation history
 * This enriches the history with tool outputs that aren't saved in Message table
 *
 * @param sessionId - The chat session ID
 * @param messages - The messages from the Message table
 * @returns Messages with tool results inserted from McpToolLog
 */
export async function restoreToolResultsFromLogs(sessionId, messages) {
    // Get all tool logs for this session
    const toolLogs = await getPrisma().mcpToolLog.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
    });
    if (toolLogs.length === 0) {
        return messages;
    }
    // Create a map of messageId -> tool log
    const toolLogsByMessageId = new Map();
    for (const log of toolLogs) {
        if (log.messageId) {
            toolLogsByMessageId.set(log.messageId, log);
        }
    }
    // Build enriched message list
    const enriched = [];
    for (const msg of messages) {
        enriched.push(msg);
        // If this is an assistant message with a tool call, check for tool result
        if (msg.role === 'assistant' && msg.toolCallId && msg.toolName) {
            const toolLog = toolLogsByMessageId.get(msg.id);
            if (toolLog && toolLog.output) {
                // Insert tool result after the assistant message
                enriched.push({
                    id: `tool-${toolLog.id}`,
                    sessionId,
                    role: 'tool',
                    content: toolLog.output,
                    toolCallId: msg.toolCallId,
                    toolName: undefined,
                    toolArgs: undefined,
                    createdAt: Number(toolLog.calledAt),
                });
            }
        }
    }
    return enriched;
}
/**
 * Log an MCP tool call for debugging
 */
export async function logMcpToolCall(params) {
    // Check if logging is explicitly disabled (default is enabled)
    const loggingDisabled = await getSystemConfig('MCP_TOOL_LOGGING_DISABLED');
    if (loggingDisabled === 'true') {
        return; // Skip logging if explicitly disabled
    }
    const prisma = getPrisma();
    await prisma.mcpToolLog.create({
        data: {
            telegramUserId: params.telegramUserId,
            sessionId: params.sessionId || null,
            messageId: params.messageId || null,
            mcpServer: params.mcpServer,
            toolName: params.toolName,
            inputArgs: JSON.stringify(params.inputArgs),
            outputContent: params.outputContent,
            success: params.success,
            errorMessage: params.errorMessage || null,
            executionTimeMs: params.executionTimeMs || null,
            createdAt: BigInt(Date.now()),
        },
    });
}
/**
 * Get recent MCP tool logs for a user
 */
export async function getMcpToolLogs(telegramUserId, limit = 50) {
    const prisma = getPrisma();
    const logs = await prisma.mcpToolLog.findMany({
        where: { telegramUserId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
    return logs.map((log) => ({
        id: log.id,
        telegramUserId: log.telegramUserId,
        sessionId: log.sessionId,
        messageId: log.messageId,
        mcpServer: log.mcpServer,
        toolName: log.toolName,
        inputArgs: log.inputArgs,
        outputContent: log.outputContent,
        success: log.success,
        errorMessage: log.errorMessage,
        executionTimeMs: log.executionTimeMs,
        createdAt: Number(log.createdAt),
    }));
}
/**
 * Get all MCP tool logs (admin view) with optional filters
 */
export async function getAllMcpToolLogs(options = {}) {
    const prisma = getPrisma();
    const { limit = 100, telegramUserId, sessionId, mcpServer, success, startDate, endDate, } = options;
    const where = {};
    if (telegramUserId)
        where.telegramUserId = telegramUserId;
    if (sessionId)
        where.sessionId = sessionId;
    if (mcpServer)
        where.mcpServer = mcpServer;
    if (success !== undefined)
        where.success = success;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate)
            where.createdAt.gte = BigInt(startDate);
        if (endDate)
            where.createdAt.lte = BigInt(endDate);
    }
    const logs = await prisma.mcpToolLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
    return logs.map((log) => ({
        id: log.id,
        telegramUserId: log.telegramUserId,
        sessionId: log.sessionId,
        messageId: log.messageId,
        mcpServer: log.mcpServer,
        toolName: log.toolName,
        inputArgs: log.inputArgs,
        outputContent: log.outputContent,
        success: log.success,
        errorMessage: log.errorMessage,
        executionTimeMs: log.executionTimeMs,
        createdAt: Number(log.createdAt),
    }));
}
/**
 * Delete old MCP tool logs (cleanup)
 */
export async function deleteOldMcpToolLogs(olderThanDays = 30) {
    const prisma = getPrisma();
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const result = await prisma.mcpToolLog.deleteMany({
        where: { createdAt: { lte: BigInt(cutoffTime) } },
    });
    return result.count;
}
/**
 * Get messages for a session with their associated tool calls
 */
export async function getSessionMessagesWithToolCalls(sessionId) {
    const prisma = getPrisma();
    const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
    });
    const result = await Promise.all(messages.map(async (msg) => {
        const toolCalls = await prisma.mcpToolLog.findMany({
            where: { messageId: msg.id },
            orderBy: { createdAt: 'asc' },
        });
        const llmCalls = await prisma.llmCall.findMany({
            where: { messageId: msg.id },
            orderBy: { createdAt: 'asc' },
        });
        return {
            message: {
                id: msg.id,
                sessionId: msg.sessionId,
                role: msg.role,
                content: msg.content,
                toolCallId: msg.toolCallId,
                toolName: msg.toolName,
                toolArgs: msg.toolArgs,
                createdAt: Number(msg.createdAt),
                replyToMessageId: msg.replyToMessageId ? Number(msg.replyToMessageId) : null,
                threadId: msg.threadId ? Number(msg.threadId) : null,
                telegramMessageId: msg.telegramMessageId ? Number(msg.telegramMessageId) : null,
            },
            toolCalls: toolCalls.map((log) => ({
                id: log.id,
                telegramUserId: log.telegramUserId,
                sessionId: log.sessionId,
                messageId: log.messageId,
                mcpServer: log.mcpServer,
                toolName: log.toolName,
                inputArgs: log.inputArgs,
                outputContent: log.outputContent,
                success: log.success,
                errorMessage: log.errorMessage,
                executionTimeMs: log.executionTimeMs,
                createdAt: Number(log.createdAt),
            })),
            llmCalls: llmCalls.map((call) => ({
                id: call.id,
                model: call.model,
                promptTokens: call.promptTokens,
                completionTokens: call.completionTokens,
                totalTokens: call.totalTokens,
                cachedTokens: call.cachedTokens,
                cacheWriteTokens: call.cacheWriteTokens,
                reasoningTokens: call.reasoningTokens,
                cost: call.cost,
                upstreamCost: call.upstreamCost,
                finishReason: call.finishReason,
                hasToolCalls: call.hasToolCalls,
                toolCallCount: call.toolCallCount,
                requestDurationMs: call.requestDurationMs,
                createdAt: Number(call.createdAt),
            })),
        };
    }));
    return result;
}
