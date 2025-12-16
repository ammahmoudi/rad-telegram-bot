import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import fs from 'node:fs';
import { defineConfig } from 'prisma/config';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

dotenv.config({ path: path.join(repoRoot, '.env') });

function normalizeFileUrl(fileUrlOrPath: string): string {
  if (fileUrlOrPath.startsWith('file:')) {
    return fileUrlOrPath.replaceAll('\\', '/');
  }
  return `file:${fileUrlOrPath.replaceAll('\\', '/')}`;
}

function buildDatabaseUrl(): string {
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

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: buildDatabaseUrl(),
  },
});
