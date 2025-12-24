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

  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');

  // Check if DATABASE_URL is already set (e.g., for PostgreSQL in Docker)
  if (!process.env.DATABASE_URL) {
    // Use SQLite for local development
    process.env.DATABASE_URL = buildSqliteDatabaseUrl();
  }

  const databaseUrl = process.env.DATABASE_URL;

  // Prisma 7 with library engine STILL requires adapters for all databases
  if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
    // PostgreSQL - requires @prisma/adapter-pg
    const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg');
    const pg = require('pg') as typeof import('pg');

    const pool = new pg.Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    prismaSingleton = new PrismaClient({
      adapter,
      log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['warn', 'error'] : ['error'],
    });
  } else {
    // SQLite - requires @prisma/adapter-better-sqlite3
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3') as typeof import('@prisma/adapter-better-sqlite3');

    const adapter = new PrismaBetterSqlite3({
      url: databaseUrl,
    });

    prismaSingleton = new PrismaClient({
      adapter,
      log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['warn', 'error'] : ['error'],
    });
  }

  return prismaSingleton;
}
