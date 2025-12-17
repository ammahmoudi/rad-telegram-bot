import { getPrisma } from '../packages/shared/dist/prisma.js';

await getPrisma().$executeRawUnsafe(
  'CREATE TABLE IF NOT EXISTS SystemConfig (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);'
);

console.log('Created SystemConfig table');
