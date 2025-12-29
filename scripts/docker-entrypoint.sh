#!/bin/sh
set -e

echo "🚀 Starting Rastar Telegram Bot..."

# Run database migrations
echo "📊 Running database migrations..."
cd packages/shared
npx prisma migrate deploy --schema=./prisma/schema.prisma
cd ../..

# Create default admin if credentials are provided
if [ -n "$DEFAULT_ADMIN_USERNAME" ] && [ -n "$DEFAULT_ADMIN_PASSWORD" ]; then
  echo "👤 Creating default admin user..."
  tsx scripts/create-admin.ts "$DEFAULT_ADMIN_USERNAME" "$DEFAULT_ADMIN_PASSWORD" || echo "⚠️  Admin user already exists or creation failed"
fi

# Create default character pack
echo "🎭 Creating default character pack..."
tsx scripts/create-default-pack.ts || echo "⚠️  Default pack already exists or creation failed"

# Start the application
echo "✅ Starting application..."
exec node apps/telegram-bot/dist/index.js
