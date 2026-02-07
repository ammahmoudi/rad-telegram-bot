import crypto from 'crypto';

import { decryptString, encryptString } from './crypto.js';
import { getPrisma } from './prisma.js';

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

export function getDb(): never {
  throw new Error('getDb() removed: use Prisma-based helpers (async).');
}

export async function purgeExpiredLinkStates(now = Date.now()): Promise<number> {
  const res = await getPrisma().linkState.deleteMany({ where: { expiresAt: { lte: BigInt(now) } } });
  return res.count;
}

export async function createLinkState(telegramUserId: string, ttlSeconds = 10 * 60): Promise<string> {
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

export async function peekLinkState(state: string): Promise<LinkStateRecord | null> {
  await purgeExpiredLinkStates();

  const found = await getPrisma().linkState.findUnique({ where: { state } });
  if (!found) return null;

  const expiresAt = Number(found.expiresAt);
  if (expiresAt <= Date.now()) return null;

  return {
    state: found.state,
    telegramUserId: found.telegramUserId,
    expiresAt,
  };
}

export async function consumeLinkState(state: string): Promise<LinkStateRecord | null> {
  await purgeExpiredLinkStates();

  const prisma = getPrisma();
  const now = Date.now();

  const record = await prisma.$transaction(async (tx) => {
    const found = await tx.linkState.findUnique({ where: { state } });
    if (!found) return null;

    await tx.linkState.delete({ where: { state } });
    return found;
  });

  if (!record) return null;
  const expiresAt = Number(record.expiresAt);
  if (expiresAt <= now) return null;

  return {
    state: record.state,
    telegramUserId: record.telegramUserId,
    expiresAt,
  };
}

export async function upsertPlankaToken(
  telegramUserId: string,
  plankaBaseUrl: string,
  accessToken: string,
): Promise<void> {
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

export async function getPlankaToken(telegramUserId: string): Promise<PlankaTokenRecord | null> {
  const row = await getPrisma().plankaToken.findUnique({ where: { telegramUserId } });
  if (!row) return null;

  return {
    telegramUserId: row.telegramUserId,
    plankaBaseUrl: row.plankaBaseUrl,
    accessToken: decryptString(row.accessTokenEnc),
    updatedAt: Number(row.updatedAt),
  };
}

export async function deletePlankaToken(telegramUserId: string): Promise<boolean> {
  try {
    await getPrisma().plankaToken.delete({ where: { telegramUserId } });
    return true;
  } catch {
    return false;
  }
}

export type PlankaTokenListItem = {
  telegramUserId: string;
  plankaBaseUrl: string;
  updatedAt: number;
};

export async function listPlankaTokens(): Promise<PlankaTokenListItem[]> {
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

export async function upsertRastarToken(
  telegramUserId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  userId: string,
  email: string,
): Promise<void> {
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

export async function getRastarToken(telegramUserId: string): Promise<RastarTokenRecord | null> {
  const row = await getPrisma().rastarToken.findUnique({ where: { telegramUserId } });
  if (!row) return null;

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

export async function deleteRastarToken(telegramUserId: string): Promise<boolean> {
  try {
    await getPrisma().rastarToken.delete({ where: { telegramUserId } });
    return true;
  } catch {
    return false;
  }
}

export type RastarTokenListItem = {
  telegramUserId: string;
  email: string;
  updatedAt: number;
};

export async function listRastarTokens(): Promise<RastarTokenListItem[]> {
  const rows = await getPrisma().rastarToken.findMany({
    select: { telegramUserId: true, email: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map((r: any) => ({
    telegramUserId: r.telegramUserId,
    email: r.email,
    updatedAt: Number(r.updatedAt),
  }));
}

function cryptoRandomBase64Url(bytes: number): string {
  const buf = crypto.randomBytes(bytes);
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export async function getSystemConfig(key: string): Promise<string | null> {
  const row = await getPrisma().systemConfig.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSystemConfig(key: string, value: string): Promise<void> {
  await getPrisma().systemConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

// ============================================================================
// Chat Session Management
// ============================================================================

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
export async function getOrCreateChatSession(telegramUserId: string): Promise<ChatSessionRecord> {
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
export async function createNewChatSession(
  telegramUserId: string,
  threadId?: number | null
): Promise<ChatSessionRecord> {
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
export async function getSessionMessages(
  sessionId: string,
  limit: number = 50,
): Promise<MessageRecord[]> {
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
export async function addMessage(
  sessionId: string,
  role: string,
  content: string,
  toolCallId?: string,
  toolName?: string,
  toolArgs?: string,
  metadata?: {
    telegramMessageId?: number;
    replyToMessageId?: number;
    threadId?: number;
  }
): Promise<MessageRecord> {
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
export async function listUserSessions(telegramUserId: string): Promise<ChatSessionRecord[]> {
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
export async function deleteChatSession(sessionId: string): Promise<boolean> {
  try {
    await getPrisma().chatSession.delete({ where: { id: sessionId } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete old sessions to manage storage
 * Keeps the most recent N sessions per user
 */
export async function pruneOldSessions(
  telegramUserId: string,
  keepMostRecent: number = 5,
): Promise<number> {
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
export async function restoreToolResultsFromLogs(
  sessionId: string,
  messages: MessageRecord[]
): Promise<MessageRecord[]> {
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
  const enriched: MessageRecord[] = [];
  
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

// ============================================================================
// MCP Tool Call Logging - for debugging and monitoring
// ============================================================================

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
export async function logMcpToolCall(params: {
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
}): Promise<void> {
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
export async function getMcpToolLogs(
  telegramUserId: string,
  limit: number = 50
): Promise<McpToolLogRecord[]> {
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
export async function getAllMcpToolLogs(options: {
  limit?: number;
  telegramUserId?: string;
  sessionId?: string;
  mcpServer?: string;
  success?: boolean;
  startDate?: number;
  endDate?: number;
} = {}): Promise<McpToolLogRecord[]> {
  const prisma = getPrisma();
  const {
    limit = 100,
    telegramUserId,
    sessionId,
    mcpServer,
    success,
    startDate,
    endDate,
  } = options;

  const where: any = {};
  if (telegramUserId) where.telegramUserId = telegramUserId;
  if (sessionId) where.sessionId = sessionId;
  if (mcpServer) where.mcpServer = mcpServer;
  if (success !== undefined) where.success = success;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = BigInt(startDate);
    if (endDate) where.createdAt.lte = BigInt(endDate);
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
export async function deleteOldMcpToolLogs(olderThanDays: number = 30): Promise<number> {
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
export async function getSessionMessagesWithToolCalls(sessionId: string): Promise<{
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
    audioTokens: number;
    cost: number;
    upstreamCost: number | null;
    finishReason: string | null;
    hasToolCalls: boolean;
    toolCallCount: number;
    requestDurationMs: number | null;
    createdAt: number;
  }[];
}[]> {
  const prisma = getPrisma();
  
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  const result = await Promise.all(
    messages.map(async (msg) => {
      const toolCalls = await prisma.mcpToolLog.findMany({
        where: { messageId: msg.id },
        orderBy: { createdAt: 'asc' },
      });

      const llmCalls = await (prisma as any).llmCall.findMany({
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
        llmCalls: llmCalls.map((call: any) => ({
          id: call.id,
          model: call.model,
          promptTokens: call.promptTokens,
          completionTokens: call.completionTokens,
          totalTokens: call.totalTokens,
          cachedTokens: call.cachedTokens,
          cacheWriteTokens: call.cacheWriteTokens,
          reasoningTokens: call.reasoningTokens,
          audioTokens: call.audioTokens,
          cost: call.cost,
          upstreamCost: call.upstreamCost,
          finishReason: call.finishReason,
          hasToolCalls: call.hasToolCalls,
          toolCallCount: call.toolCallCount,
          requestDurationMs: call.requestDurationMs,
          createdAt: Number(call.createdAt),
        })),
      };
    })
  );

  return result;
}

