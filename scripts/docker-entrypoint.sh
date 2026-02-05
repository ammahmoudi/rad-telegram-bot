#!/bin/sh
set -e

echo "🚀 Starting Rastar Telegram Bot..."

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

echo "📊 Database URL: ${DATABASE_URL:0:30}..."

# Run database migrations
echo "📊 Running database migrations..."
cd /app/packages/shared
npx prisma migrate deploy || {
  echo "⚠️  Migration failed, attempting db push..."
  npx prisma db push --skip-generate
}

cd /app

# Start the application
echo "✅ Starting application..."
exec node apps/telegram-bot/dist/index.js
