#!/usr/bin/env node
/**
 * Production PostgreSQL Migration Checker
 * Verifies migrations are applied correctly in production
 */

import { execSync } from 'child_process';

console.log('🔍 Checking Production Database Migrations...\n');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not set!');
  process.exit(1);
}

const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
const isSqlite = databaseUrl.startsWith('file:');

console.log(`📊 Database Type: ${isPostgres ? 'PostgreSQL' : isSqlite ? 'SQLite' : 'Unknown'}`);
console.log(`🔗 Connection: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

try {
  // Check migration status
  console.log('📋 Checking migration status...');
  const status = execSync('npx prisma migrate status', {
    cwd: 'packages/shared',
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  if (status.includes('Database schema is up to date')) {
    console.log('✅ All migrations applied successfully!');
    console.log(status);
  } else if (status.includes('pending migrations')) {
    console.log('⚠️  Pending migrations detected!');
    console.log(status);
    console.log('\n🔧 To apply pending migrations, run:');
    console.log('   npm run prisma:migrate:deploy');
    process.exit(1);
  } else {
    console.log('ℹ️  Migration status:');
    console.log(status);
  }
} catch (error) {
  console.error('❌ Failed to check migration status:', error.message);
  
  if (error.stdout) {
    console.log('\nOutput:', error.stdout);
  }
  if (error.stderr) {
    console.error('\nError:', error.stderr);
  }
  
  console.log('\n💡 Try running migrations manually:');
  console.log('   cd packages/shared');
  console.log('   npx prisma migrate deploy');
  
  process.exit(1);
}

console.log('\n🎉 Production database is healthy!\n');
