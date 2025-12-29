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

# Start Next.js
echo "✅ Starting Next.js server..."
exec node apps/admin-panel/server.js
