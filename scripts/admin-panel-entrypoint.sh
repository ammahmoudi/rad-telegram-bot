#!/bin/sh
set -e

echo "🚀 Starting Admin Panel..."

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

echo "📊 Database URL: ${DATABASE_URL:0:30}..."

# Debug: Check if migrations exist
echo "🔍 DEBUG: Checking migrations directory..."
ls -la /app/packages/shared/prisma/ || echo "❌ prisma directory not found"
ls -la /app/packages/shared/prisma/migrations/ || echo "⚠️  migrations directory not found (will be created)"

# Run database migrations
echo "📊 Running database migrations..."
cd /app/packages/shared

# For first-time setup or if migration state is corrupted, use db push
# This will create tables based on schema without checking migration history
npx prisma migrate deploy || {
  echo "⚠️  Migration history issue, attempting db push..."
  npx prisma db push --skip-generate
}

cd /app

# Debug: Check if env vars are set
echo "🔍 DEBUG: DEFAULT_ADMIN_USERNAME=${DEFAULT_ADMIN_USERNAME:-NOT_SET}"
echo "🔍 DEBUG: DEFAULT_ADMIN_PASSWORD length: ${#DEFAULT_ADMIN_PASSWORD}"

# Create default admin if credentials are provided
if [ -n "$DEFAULT_ADMIN_USERNAME" ] && [ -n "$DEFAULT_ADMIN_PASSWORD" ]; then
  echo "👤 Creating default admin user..."
  # Run with proper module resolution using npx from local node_modules
  cd /app && npx tsx /app/scripts/create-admin.ts "$DEFAULT_ADMIN_USERNAME" "$DEFAULT_ADMIN_PASSWORD" || echo "⚠️  Admin creation failed (non-critical)"
else
  echo "⚠️  Skipping admin creation - credentials not provided"
fi

# Create default character pack
echo "🎭 Creating default character pack..."
cd /app && npx tsx /app/scripts/create-default-pack.ts || echo "⚠️  Default pack creation failed (non-critical)"

# Start Next.js server (standalone output preserves workspace structure)
echo "✅ Starting Next.js server..."
exec node apps/admin-panel/server.js
