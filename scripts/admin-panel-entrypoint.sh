#!/bin/sh
set -e

echo "🚀 Starting Admin Panel..."

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy --schema=./packages/shared/prisma/schema.prisma

# Create default admin if credentials are provided
if [ -n "$DEFAULT_ADMIN_USERNAME" ] && [ -n "$DEFAULT_ADMIN_PASSWORD" ]; then
  echo "👤 Creating default admin user..."
  node -e "
    const { getPrisma } = require('./packages/shared/dist/db');
    const bcrypt = require('bcryptjs');
    
    (async () => {
      const prisma = getPrisma();
      const username = process.env.DEFAULT_ADMIN_USERNAME;
      const password = process.env.DEFAULT_ADMIN_PASSWORD;
      
      try {
        const existing = await prisma.admin.findUnique({ where: { username } });
        if (!existing) {
          const passwordHash = await bcrypt.hash(password, 10);
          const now = Date.now();
          await prisma.admin.create({
            data: {
              id: 'admin_' + username + '_' + now,
              username,
              passwordHash,
              createdAt: now,
              updatedAt: now,
            },
          });
          console.log('✅ Default admin created:', username);
        } else {
          console.log('ℹ️  Admin already exists:', username);
        }
      } catch (error) {
        console.log('⚠️  Could not create default admin:', error.message);
      }
    })();
  " || echo "⚠️  Admin creation failed (non-critical)"
fi

# Create default character pack
echo "🎭 Creating default character pack..."
node -e "
  const { getPrisma } = require('./packages/shared/dist/db');
  const fs = require('fs');
  const path = require('path');
  
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
