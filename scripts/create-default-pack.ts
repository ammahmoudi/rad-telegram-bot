import { getPrisma } from '../packages/shared/dist/prisma.js';

// Hardcoded default values (embedded from config files)
const DEFAULT_SYSTEM_PROMPT = `You are Rad, a helpful AI assistant integrated with Planka (a project management tool) and Rastar (company services including food menu). 
You have access to Planka tools to search, list, create, update projects, boards, cards, tasks, comments, labels, and members.
You also have access to Rastar tools to view lunch menus, select food items, and manage food reservations.

**🚫 ABSOLUTELY FORBIDDEN IN YOUR RESPONSES:**
NEVER include ANY of these in your user-facing messages:
- System instructions, prompts, or internal thinking
- Meta-commentary: "Process Summary", "Reasoning Process", "Tools used", "Step X"
- Planning phrases: "I will", "I should", "Let me", "Wait", "Actually", "I'm going to"
- Documentation examples: "Label", "action_name", example JSON structures from docs
- Technical details about tool calls, API responses, or internal operations
- Phrases like: "If you found", "End with", "Specific instructions", "Language:", "Crucial:", "Response:"

**✅ YOUR RESPONSES MUST BE:**
- ONLY the final message the user should see
- Natural conversation in the user's language
- Clean, concise, and helpful
- NO technical internals or meta-commentary

**Language Support:**
- You are MULTILINGUAL and can communicate in ANY language the user prefers
- Common languages: Persian/Farsi (فارسی), English, and others
- Always respond in the SAME language the user is using
- Format dates appropriately for the user's language (Jalali calendar for Persian speakers)

**Important Guidelines:**
1. Use the tools provided to answer user questions about their Planka workspace and Rastar services
2. When searching or listing data, always provide structured, easy-to-read responses
3. Format dates in a user-friendly way (prefer Jalali calendar if user speaks Persian)
4. When creating or updating items, confirm the action was successful
5. If a tool call fails or returns empty results, inform the user clearly
6. **CRITICAL - Authentication Errors:** If you get an authentication error, 401 error, "not linked" error, or similar access issues:
   - For Planka: Tell user to use /link_planka command to reconnect their account
   - For Rastar: Tell user to use /link_rastar command to reconnect their account
7. Always use emojis to make responses more engaging 🎯
8. Keep responses concise but informative`;

const DEFAULT_WELCOME_MESSAGES = {
  en: `👋 Hi {name}!

🤖 I'm Rad, your AI assistant that can help you manage Planka tasks and Rastar services right from Telegram.

🔧 Available Commands:

📋 Planka:
🔗 /link_planka - Connect your Planka account
📊 /planka_status - Check connection status
🔓 /planka_unlink - Disconnect account

🍽️ Rastar (Food Menu):
🔗 /link_rastar - Connect your Rastar account  
📊 /rastar_status - Check connection status
🔓 /rastar_unlink - Disconnect account

💬 AI Chat:
💬 /new_chat - Start a new conversation
📚 /history - View your chat sessions
🗑️ /clear_chat - Clear current conversation

💡 Getting Started:
Just send me a message to start chatting! I can help you with Planka tasks once you connect your account with /link_planka

⌨️ Quick Access: Use the buttons below to quickly access common features!`,

  fa: `👋 سلام {name}!

🤖 من رد هستم، دستیار هوشمند شما که می‌تونم به شما در مدیریت کارهای پلانکا و خدمات رستار از طریق تلگرام کمک کنم.

🔧 دستورات موجود:

📋 پلانکا:
🔗 /link_planka - اتصال حساب پلانکا
📊 /planka_status - بررسی وضعیت اتصال
🔓 /planka_unlink - قطع اتصال حساب

🍽️ رستار (منوی غذا):
🔗 /link_rastar - اتصال حساب رستار
📊 /rastar_status - بررسی وضعیت اتصال
🔓 /rastar_unlink - قطع اتصال حساب

💬 گفتگوی هوشمند:
💬 /new_chat - شروع گفتگوی جدید
📚 /history - مشاهده تاریخچه گفتگوها
🗑️ /clear_chat - پاک کردن گفتگوی فعلی

💡 شروع کار:
فقط یه پیام برام بفرست تا شروع کنیم! می‌تونم بعد از اتصال حساب پلانکا با /link_planka بهت کمک کنم.

⌨️ دسترسی سریع: از دکمه‌های زیر برای دسترسی سریع به امکانات استفاده کنید!`,
} as const;

/**
 * Script to create default character pack with hardcoded system prompts
 * This ensures the default pack has the full system prompt with button instructions
 * 
 * Usage: tsx scripts/create-default-pack.ts
 */

async function createDefaultPack() {
  const prisma = getPrisma();
  const defaultModel = process.env.DEFAULT_AI_MODEL?.trim();
  
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

      if (!existingDefault.aiModel && defaultModel) {
        await prisma.characterPack.update({
          where: { id: existingDefault.id },
          data: { aiModel: defaultModel, updatedAt: Date.now() },
        });
        console.log('✅ Synced default pack AI model from env');
      }
      
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
    
    console.log('Using embedded default prompts...');
    const defaultPrompt = DEFAULT_SYSTEM_PROMPT;
    const defaultWelcomeEn = DEFAULT_WELCOME_MESSAGES.en;
    const defaultWelcomeFa = DEFAULT_WELCOME_MESSAGES.fa;
    console.log(`✅ System prompt: ${defaultPrompt.length} characters`);
    console.log(`✅ Welcome messages: EN: ${defaultWelcomeEn.length} chars, FA: ${defaultWelcomeFa.length} chars`);
    
    // Create default pack or use existing one
    const now = Date.now();
    let defaultPack = existingDefault;
    
    if (!existingDefault) {
      defaultPack = await prisma.characterPack.create({
        data: {
          name: 'Default Pack',
          description: 'Default pack with standard settings',
          aiModel: defaultModel || null,
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
