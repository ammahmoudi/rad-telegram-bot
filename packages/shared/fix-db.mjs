import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../../data/rastar.db'
    }
  }
});

async function main() {
  console.log('Checking database tables...');
  
  // Check which tables exist
  const tables = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
  `;
  
  console.log('Existing tables:', tables.map(t => t.name));
  
  // Read and apply the initial migration SQL directly
  const migrationPath = join(__dirname, 'prisma', 'migrations', '20251228134626_test', 'migration.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  
  // Split by semicolon and filter empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  console.log(`\nApplying ${statements.length} SQL statements...`);
  
  for (const statement of statements) {
    try {
      // Skip if it's a CREATE TABLE for a table that exists
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE "([^"]+)"/);
        if (match) {
          const tableName = match[1];
          const exists = tables.some(t => t.name === tableName);
          if (exists) {
            console.log(`✓ Table ${tableName} already exists, skipping`);
            continue;
          }
        }
      }
      
      await prisma.$executeRawUnsafe(statement);
      console.log(`✓ Executed: ${statement.substring(0, 60)}...`);
    } catch (error) {
      console.error(`✗ Failed: ${statement.substring(0, 60)}...`);
      console.error(`  Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Database repair complete!');
  
  // Verify tables now
  const tablesAfter = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
  `;
  console.log('\nTables after repair:', tablesAfter.map(t => t.name));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
