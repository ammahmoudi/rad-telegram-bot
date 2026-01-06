#!/usr/bin/env node
/**
 * Reset Prisma migrations and reapply them properly
 * Use this when migration state is corrupted
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Database path
const dbPath = join(rootDir, '../../data/rastar.db');

console.log('🔄 Resetting database migrations...');
console.log(`📂 Database: ${dbPath}`);

if (!existsSync(dbPath)) {
  console.error('❌ Database file not found:', dbPath);
  process.exit(1);
}

// Open database
const db = new Database(dbPath);

try {
  // Get list of applied migrations
  const migrations = db.prepare('SELECT migration_name FROM _prisma_migrations ORDER BY finished_at').all();
  
  console.log('\n📋 Current migrations:');
  migrations.forEach(m => console.log(`  - ${m.migration_name}`));
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  
  console.log('\n📊 Current tables:');
  tables.forEach(t => console.log(`  - ${t.name}`));
  
  // Check if LinkState table exists
  const linkStateExists = tables.some(t => t.name === 'LinkState');
  
  if (!linkStateExists) {
    console.log('\n⚠️  LinkState table is missing but migrations show as applied!');
    console.log('🔧 Applying SQL from migration file directly...');
    
    // Read the migration SQL
    const migrationPath = join(rootDir, 'prisma/migrations/20251228134626_test/migration.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    db.exec(sql);
    
    console.log('✅ Migration SQL applied successfully!');
  } else {
    console.log('\n✅ All tables exist, no action needed');
  }
  
  // Verify all tables now exist
  const finalTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  
  console.log('\n📊 Final tables:');
  finalTables.forEach(t => console.log(`  - ${t.name}`));
  
  console.log('\n✅ Database migration state fixed!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}
