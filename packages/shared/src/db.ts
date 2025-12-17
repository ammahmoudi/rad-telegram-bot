import crypto from 'node:crypto';

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
