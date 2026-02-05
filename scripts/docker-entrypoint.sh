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
# Only one container should run migrations in production.
# Set RUN_MIGRATIONS=true on the container responsible for migrations.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "📊 Running database migrations..."
  cd /app/packages/shared
  npx prisma migrate deploy || {
    echo "⚠️  Migration failed, attempting db push with accept-data-loss..."
    npx prisma db push --accept-data-loss
  }
  cd /app
else
  echo "⏭️  Skipping migrations (RUN_MIGRATIONS=false)"
fi

# Start the application
echo "✅ Starting application..."
exec node apps/telegram-bot/dist/index.js
