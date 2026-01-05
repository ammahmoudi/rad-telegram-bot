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
};

/**
 * Get or create a chat session for a user
 * Sessions are created on-demand and reused
 */
export async function getOrCreateChatSession(telegramUserId: string): Promise<ChatSessionRecord> {
  const prisma = getPrisma();

  // Try to get the most recent session
  const existing = await prisma.chatSession.findFirst({
    where: { telegramUserId },
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

  // Create new session
  const now = Date.now();
  const session = await prisma.chatSession.create({
    data: {
      telegramUserId,
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
 */
export async function createNewChatSession(telegramUserId: string): Promise<ChatSessionRecord> {
  const now = Date.now();
  const session = await getPrisma().chatSession.create({
    data: {
      telegramUserId,
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
