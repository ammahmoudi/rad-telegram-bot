import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

import { decryptString, encryptString } from './crypto.js';

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

function getDatabasePath(): string {
  return process.env.DATABASE_PATH || './data/dev.sqlite';
}

function ensureParentDir(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

let dbSingleton: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbSingleton) return dbSingleton;

  const dbPath = getDatabasePath();
  ensureParentDir(dbPath);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS link_states (
      state TEXT PRIMARY KEY,
      telegram_user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS planka_tokens (
      telegram_user_id TEXT PRIMARY KEY,
      planka_base_url TEXT NOT NULL,
      access_token_enc TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_link_states_expires_at ON link_states (expires_at);
  `);

  dbSingleton = db;
  return db;
}

export function purgeExpiredLinkStates(now = Date.now()): number {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM link_states WHERE expires_at <= ?');
  const res = stmt.run(now);
  return res.changes;
}

export function createLinkState(telegramUserId: string, ttlSeconds = 10 * 60): string {
  const db = getDb();
  purgeExpiredLinkStates();

  const state = cryptoRandomBase64Url(32);
  const expiresAt = Date.now() + ttlSeconds * 1000;

  db.prepare('INSERT INTO link_states(state, telegram_user_id, expires_at) VALUES(?,?,?)').run(
    state,
    telegramUserId,
    expiresAt,
  );

  return state;
}

export function consumeLinkState(state: string): LinkStateRecord | null {
  const db = getDb();
  purgeExpiredLinkStates();

  const row = db
    .prepare('SELECT state, telegram_user_id, expires_at FROM link_states WHERE state = ?')
    .get(state) as { state: string; telegram_user_id: string; expires_at: number } | undefined;

  if (!row) return null;

  db.prepare('DELETE FROM link_states WHERE state = ?').run(state);

  if (row.expires_at <= Date.now()) {
    return null;
  }

  return {
    state: row.state,
    telegramUserId: row.telegram_user_id,
    expiresAt: row.expires_at,
  };
}

export function upsertPlankaToken(telegramUserId: string, plankaBaseUrl: string, accessToken: string): void {
  const db = getDb();
  const updatedAt = Date.now();
  const enc = encryptString(accessToken);

  db.prepare(
    `INSERT INTO planka_tokens(telegram_user_id, planka_base_url, access_token_enc, updated_at)
     VALUES(?,?,?,?)
     ON CONFLICT(telegram_user_id)
     DO UPDATE SET planka_base_url=excluded.planka_base_url, access_token_enc=excluded.access_token_enc, updated_at=excluded.updated_at`,
  ).run(telegramUserId, plankaBaseUrl, enc, updatedAt);
}

export function getPlankaToken(telegramUserId: string): PlankaTokenRecord | null {
  const db = getDb();
  const row = db
    .prepare('SELECT telegram_user_id, planka_base_url, access_token_enc, updated_at FROM planka_tokens WHERE telegram_user_id = ?')
    .get(telegramUserId) as
    | {
        telegram_user_id: string;
        planka_base_url: string;
        access_token_enc: string;
        updated_at: number;
      }
    | undefined;

  if (!row) return null;

  return {
    telegramUserId: row.telegram_user_id,
    plankaBaseUrl: row.planka_base_url,
    accessToken: decryptString(row.access_token_enc),
    updatedAt: row.updated_at,
  };
}

export function deletePlankaToken(telegramUserId: string): boolean {
  const db = getDb();
  const res = db.prepare('DELETE FROM planka_tokens WHERE telegram_user_id = ?').run(telegramUserId);
  return res.changes > 0;
}

function cryptoRandomBase64Url(bytes: number): string {
  const buf = crypto.randomBytes(bytes);
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}
