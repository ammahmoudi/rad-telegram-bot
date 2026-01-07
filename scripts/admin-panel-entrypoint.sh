#!/bin/sh
set -e

echo "🚀 Starting Admin Panel..."

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

echo "📊 Database URL: ${DATABASE_URL:0:30}..."

# Run database migrations
echo "📊 Running database migrations..."
cd packages/shared
npx prisma migrate deploy
cd ../..

# Create default admin if credentials are provided
if [ -n "$DEFAULT_ADMIN_USERNAME" ] && [ -n "$DEFAULT_ADMIN_PASSWORD" ]; then
  echo "👤 Creating default admin user..."
  tsx scripts/create-admin.ts "$DEFAULT_ADMIN_USERNAME" "$DEFAULT_ADMIN_PASSWORD" || echo "⚠️  Admin creation failed (non-critical)"
fi

# Create default character pack
echo "🎭 Creating default character pack..."
tsx scripts/create-default-pack.ts || echo "⚠️  Default pack creation failed (non-critical)"

# Start Next.js server
echo "✅ Starting Next.js server..."
cd apps/admin-panel
exec node standalone/server.js
  
  (async () => {
    const prisma = getPrisma();
    
    try {
      const existingDefault = await prisma.characterPack.findFirst({
        where: { isDefault: true },
        include: { messages: true },
      });
      
      if (existingDefault && existingDefault.messages.length > 0) {
        console.log('ℹ️  Default pack already exists');
        return;
      }
      
      // Read system prompt from built file
      const promptFile = './apps/telegram-bot/dist/config/system-prompt.js';
      const welcomeFile = './apps/telegram-bot/dist/config/welcome-messages.js';
      
      // Import the modules to get the default values
      const { DEFAULT_SYSTEM_PROMPT } = require(path.resolve(promptFile));
      const { DEFAULT_WELCOME_MESSAGES } = require(path.resolve(welcomeFile));
      
      const now = Date.now();
      let pack = existingDefault;
      
      if (!pack) {
        pack = await prisma.characterPack.create({
          data: {
            name: 'Default Pack',
            description: 'Default pack with standard settings',
            isDefault: true,
            createdAt: now,
            updatedAt: now,
          },
        });
        console.log('✅ Created default pack');
      }
      
      // Create pack messages
      await prisma.packMessage.createMany({
        data: [
          {
            packId: pack.id,
            language: 'en',
            messageType: 'system_prompt',
            content: DEFAULT_SYSTEM_PROMPT,
            createdAt: now,
            updatedAt: now,
          },
          {
            packId: pack.id,
            language: 'en',
            messageType: 'welcome',
            content: DEFAULT_WELCOME_MESSAGES.en,
            createdAt: now,
            updatedAt: now,
          },
          {
            packId: pack.id,
            language: 'fa',
            messageType: 'welcome',
            content: DEFAULT_WELCOME_MESSAGES.fa,
            createdAt: now,
            updatedAt: now,
          },
        ],
        skipDuplicates: true,
      });
      console.log('✅ Default pack populated with messages');
    } catch (error) {
      console.log('⚠️  Could not create default pack:', error.message);
    }
  })();
" || echo "⚠️  Default pack creation failed (non-critical)"

# Start Next.js
echo "✅ Starting Next.js server..."
exec node apps/admin-panel/server.js
