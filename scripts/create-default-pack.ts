import { getPrisma } from '@rad/shared';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Script to create default character pack with hardcoded system prompts
 * This ensures the default pack has the full system prompt with button instructions
 * 
 * Usage: tsx scripts/create-default-pack.ts
 */

async function createDefaultPack() {
  const prisma = getPrisma();
  
  try {
    // Check if default pack already exists
    const existingDefault = await prisma.characterPack.findFirst({
      where: { isDefault: true },
      include: { messages: true },
    });
    
    if (existingDefault) {
      console.log('✅ Default pack already exists:', existingDefault.name);
      console.log('   ID:', existingDefault.id);
      console.log('   Messages:', existingDefault.messages.length);
      
      if (existingDefault.messages.length === 0) {
        console.log('\n⚠️  Pack has no messages! Populating now...');
        // Continue to populate
      } else {
        console.log('\n📋 Existing messages:');
        existingDefault.messages.forEach(msg => {
          console.log(`   - ${msg.language} ${msg.messageType}: ${msg.content.substring(0, 50)}...`);
        });
        return;
      }
    } else {
      console.log('Creating default character pack...');
    }
    
    // Read hardcoded system prompt from config file
    console.log('Reading hardcoded system prompt...');
    const promptFilePath = join(process.cwd(), 'apps', 'telegram-bot', 'src', 'config', 'system-prompt.ts');
    const promptFileContent = readFileSync(promptFilePath, 'utf-8');
    
    // Extract the DEFAULT_SYSTEM_PROMPT content
    const promptMatch = promptFileContent.match(/const DEFAULT_SYSTEM_PROMPT = `([\s\S]*?)`;\s*\n/);
    
    if (!promptMatch) {
      console.error('❌ Could not extract DEFAULT_SYSTEM_PROMPT from system-prompt.ts');
      process.exit(1);
    }
    
    const defaultPrompt = promptMatch[1];
    console.log(`✅ Extracted system prompt (${defaultPrompt.length} characters)`);
    
    // Read welcome messages from config file
    console.log('Reading welcome messages...');
    const welcomeFilePath = join(process.cwd(), 'apps', 'telegram-bot', 'src', 'config', 'welcome-messages.ts');
    const welcomeFileContent = readFileSync(welcomeFilePath, 'utf-8');
    
    // Extract English welcome message
    const enWelcomeMatch = welcomeFileContent.match(/en:\s*`([\s\S]*?)`,\s*\n\s*fa:/);
    if (!enWelcomeMatch) {
      console.error('❌ Could not extract English welcome message from welcome-messages.ts');
      process.exit(1);
    }
    const defaultWelcomeEn = enWelcomeMatch[1];
    
    // Extract Farsi welcome message
    const faWelcomeMatch = welcomeFileContent.match(/fa:\s*`([\s\S]*?)`,\s*\n\}\s+as const/);
    if (!faWelcomeMatch) {
      console.error('❌ Could not extract Farsi welcome message from welcome-messages.ts');
      process.exit(1);
    }
    const defaultWelcomeFa = faWelcomeMatch[1];
    
    console.log(`✅ Extracted welcome messages (EN: ${defaultWelcomeEn.length} chars, FA: ${defaultWelcomeFa.length} chars)`);
    
    // Create default pack or use existing one
    const now = Date.now();
    let defaultPack = existingDefault;
    
    if (!existingDefault) {
      defaultPack = await prisma.characterPack.create({
        data: {
          name: 'Default Pack',
          description: 'Default pack with standard settings',
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log('✅ Created default pack:', defaultPack.id);
    }
    
    // Create pack messages with extracted prompts and welcome messages
    console.log('\nPopulating pack with default messages...');
    await prisma.packMessage.createMany({
      data: [
        {
          packId: defaultPack.id,
          language: 'fa',
          messageType: 'system_prompt',
          content: defaultPrompt,
          updatedAt: now,
        },
        {
          packId: defaultPack.id,
          language: 'en',
          messageType: 'system_prompt',
          content: defaultPrompt,
          updatedAt: now,
        },
        {
          packId: defaultPack.id,
          language: 'fa',
          messageType: 'welcome',
          content: defaultWelcomeFa,
          updatedAt: now,
        },
        {
          packId: defaultPack.id,
          language: 'en',
          messageType: 'welcome',
          content: defaultWelcomeEn,
          updatedAt: now,
        },
      ],
    });
    
    console.log('✅ Populated pack with 4 messages (system_prompt + welcome for FA/EN)');
    
    console.log('\n✨ Default pack setup complete!');
    console.log(`   Pack ID: ${defaultPack.id}`);
    console.log(`   Name: ${defaultPack.name}`);
    console.log(`   Messages: 4 (system prompts + welcome messages)`);
    console.log('\n📝 Next steps:');
    console.log('   1. Visit the admin panel at http://localhost:3001');
    console.log('   2. Go to "Character Packs" section');
    console.log('   3. Edit the default pack or create custom packs for specific users');
    
  } catch (error) {
    console.error('❌ Error creating default pack:', error);
    process.exit(1);
  }
}

createDefaultPack();
