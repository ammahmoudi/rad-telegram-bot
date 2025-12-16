import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');

function normalizeFileUrl(fileUrlOrPath: string): string {
  if (fileUrlOrPath.startsWith('file:')) {
    return fileUrlOrPath.replaceAll('\\', '/');
  }
  return `file:${fileUrlOrPath.replaceAll('\\', '/')}`;
}

function buildSqliteDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const dbPathEnv = process.env.DATABASE_PATH;
  const dbPath = dbPathEnv
    ? path.isAbsolute(dbPathEnv)
      ? dbPathEnv
      : path.resolve(repoRoot, dbPathEnv)
    : path.resolve(repoRoot, 'data', 'dev.sqlite');

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  return normalizeFileUrl(dbPath);
}

let prismaSingleton: import('@prisma/client').PrismaClient | null = null;

export function getPrisma(): import('@prisma/client').PrismaClient {
  if (prismaSingleton) return prismaSingleton;

  // Ensure DATABASE_URL exists for Prisma
  process.env.DATABASE_URL = buildSqliteDatabaseUrl();

  // Prisma ORM 7 requires an explicit driver adapter (or Accelerate).
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3') as typeof import('@prisma/adapter-better-sqlite3');

  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL,
  });

  prismaSingleton = new PrismaClient({
    adapter,
    // Minimal logging; never log secrets
    log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['warn', 'error'] : ['error'],
  });

  return prismaSingleton;
}
