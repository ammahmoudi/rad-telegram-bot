#!/usr/bin/env node

/**
 * Interactive Setup Script
 * Helps configure and start the Rastar Telegram Bot
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

async function checkDocker() {
  try {
    await execAsync('docker --version');
    return true;
  } catch {
    return false;
  }
}

async function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  return major >= 20;
}

async function setupEnv() {
  const envPath = join(rootDir, '.env');
  const envExamplePath = join(rootDir, '.env.example');

  if (existsSync(envPath)) {
    const answer = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      log('Skipping .env setup', 'warning');
      return;
    }
  }

  if (!existsSync(envExamplePath)) {
    log('Error: .env.example not found', 'error');
    return;
  }

  log('📝 Setting up .env file...', 'info');
  
  const botToken = await question('Telegram Bot Token: ');
  const openRouterKey = await question('OpenRouter API Key: ');
  const encryptionKey = await question('Encryption Key (32 chars, or press Enter to generate): ');
  const nextAuthSecret = await question('NextAuth Secret (or press Enter to generate): ');
  const plankaUrl = await question('Planka Server URL: ');
  const supabaseUrl = await question('Rastar Supabase URL: ');
  const supabaseKey = await question('Rastar Supabase Anon Key: ');

  const finalEncKey = encryptionKey || generateKey(32);
  const finalNextAuth = nextAuthSecret || generateKey(32);

  let envContent = readFileSync(envExamplePath, 'utf-8');
  
  envContent = envContent
    .replace(/TELEGRAM_BOT_TOKEN=.*/, `TELEGRAM_BOT_TOKEN=${botToken}`)
    .replace(/OPENROUTER_API_KEY=.*/, `OPENROUTER_API_KEY=${openRouterKey}`)
    .replace(/ENCRYPTION_KEY=.*/, `ENCRYPTION_KEY=${finalEncKey}`)
    .replace(/NEXTAUTH_SECRET=.*/, `NEXTAUTH_SECRET=${finalNextAuth}`)
    .replace(/PLANKA_SERVER_URL=.*/, `PLANKA_SERVER_URL=${plankaUrl}`)
    .replace(/RASTAR_SUPABASE_URL=.*/, `RASTAR_SUPABASE_URL=${supabaseUrl}`)
    .replace(/RASTAR_SUPABASE_ANON_KEY=.*/, `RASTAR_SUPABASE_ANON_KEY=${supabaseKey}`);

  writeFileSync(envPath, envContent);
  log('✅ .env file created successfully', 'success');
}

function generateKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function installDependencies() {
  log('📦 Installing dependencies...', 'info');
  try {
    await execAsync('npm install', { cwd: rootDir });
    log('✅ Dependencies installed', 'success');
  } catch (error) {
    log(`Error installing dependencies: ${error.message}`, 'error');
    throw error;
  }
}

async function setupDatabase(useDocker) {
  log('🗄️  Setting up database...', 'info');
  
  if (useDocker) {
    log('Starting PostgreSQL with Docker...', 'info');
    await execAsync('docker compose up postgres -d', { cwd: rootDir });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for DB to be ready
  }

  log('Running Prisma migrations...', 'info');
  await execAsync('npm run db:setup', { cwd: rootDir });
  log('✅ Database setup complete', 'success');
}

async function createAdmin() {
  log('👤 Creating admin user...', 'info');
  const username = await question('Admin username: ');
  const password = await question('Admin password (min 8 chars): ');

  try {
    await execAsync(`tsx scripts/create-admin.ts ${username} ${password}`, { cwd: rootDir });
    log('✅ Admin user created', 'success');
  } catch (error) {
    log(`Error creating admin: ${error.message}`, 'error');
  }
}

async function startServices(useDocker) {
  log('🚀 Starting services...', 'info');
  
  if (useDocker) {
    log('Starting all services with Docker...', 'info');
    await execAsync('npm run docker:up', { cwd: rootDir });
    log('✅ All services started', 'success');
    log('\n📊 View logs with: npm run docker:logs', 'info');
  } else {
    log('Starting development servers...', 'info');
    log('Run: npm run dev', 'warning');
  }
}

async function main() {
  console.clear();
  log('🤖 Rastar Telegram Bot Setup Wizard\n', 'success');

  // Check prerequisites
  log('Checking prerequisites...', 'info');
  
  const hasNode = await checkNodeVersion();
  if (!hasNode) {
    log('❌ Node.js 20+ is required', 'error');
    process.exit(1);
  }
  log('✅ Node.js version OK', 'success');

  const hasDocker = await checkDocker();
  if (hasDocker) {
    log('✅ Docker is available', 'success');
  } else {
    log('⚠️  Docker not found (will use local setup)', 'warning');
  }

  console.log('\n');

  // Setup mode
  const setupMode = hasDocker 
    ? await question('Setup mode? (1) Docker (recommended) | (2) Local development: ')
    : '2';

  const useDocker = setupMode === '1';

  try {
    // Step 1: Environment setup
    await setupEnv();

    // Step 2: Install dependencies
    await installDependencies();

    // Step 3: Database setup
    await setupDatabase(useDocker);

    // Step 4: Create admin user
    const createAdminAnswer = await question('\nCreate admin user? (Y/n): ');
    if (createAdminAnswer.toLowerCase() !== 'n') {
      await createAdmin();
    }

    // Step 5: Start services
    const startAnswer = await question('\nStart services now? (Y/n): ');
    if (startAnswer.toLowerCase() !== 'n') {
      await startServices(useDocker);
    }

    console.log('\n');
    log('🎉 Setup complete!', 'success');
    log('\n📚 Next steps:', 'info');
    log('1. Test your bot on Telegram with /start', 'info');
    log('2. Login to admin panel at http://localhost:3000', 'info');
    log('3. Configure AI prompts and welcome messages', 'info');
    log('\n📖 Documentation:', 'info');
    log('- Quick Start: QUICK_START.md', 'info');
    log('- Admin Guide: ADMIN_PANEL_GUIDE.md', 'info');
    log('- AI Features: AI_CHATBOT_GUIDE.md', 'info');

  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
