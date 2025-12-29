import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';

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
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    console.log('[Prisma] Using DATABASE_URL from env:', dbUrl);
    // If it's a file URL, ensure the directory exists
    if (dbUrl.startsWith('file:')) {
      const filePathMatch = dbUrl.match(/^file:(.+)$/);
      if (filePathMatch) {
        const filePath = filePathMatch[1];
        const absolutePath = path.isAbsolute(filePath) 
          ? filePath 
          : path.resolve(repoRoot, filePath);
        console.log('[Prisma] Resolved absolute path:', absolutePath);
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      }
    }
    return dbUrl;
  }

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

  // Build/validate database URL (this ensures directory exists for file: URLs)
  let databaseUrl = process.env.DATABASE_URL || buildSqliteDatabaseUrl();
  
  // Ensure directory exists for file-based databases and convert to absolute path
  if (databaseUrl.startsWith('file:')) {
    const filePathMatch = databaseUrl.match(/^file:(.+)$/);
    if (filePathMatch) {
      const filePath = filePathMatch[1];
      const absolutePath = path.isAbsolute(filePath) 
        ? filePath 
        : path.resolve(repoRoot, filePath);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      
      // Convert to absolute file URL for better-sqlite3
      databaseUrl = `file:${absolutePath}`;
    }
  }
  
  // Set the DATABASE_URL if it wasn't set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
  }

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
