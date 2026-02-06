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

# Run database migrations (single migration runner)
echo "📊 Running database migrations..."
cd /app/packages/shared

# Optionally resolve a failed migration if provided
# Example: PRISMA_RESOLVE_ACTION=rolled-back PRISMA_RESOLVE_MIGRATION=20251228134626_test
if [ -n "$PRISMA_RESOLVE_ACTION" ] && [ -n "$PRISMA_RESOLVE_MIGRATION" ]; then
  echo "🩹 Resolving failed migration: $PRISMA_RESOLVE_MIGRATION ($PRISMA_RESOLVE_ACTION)"
  resolve_output=$(npx prisma migrate resolve --$PRISMA_RESOLVE_ACTION "$PRISMA_RESOLVE_MIGRATION" 2>&1) || resolve_status=$?
  if [ "${resolve_status:-0}" -ne 0 ]; then
    echo "$resolve_output"
    echo "$resolve_output" | grep -q "P3008" && echo "ℹ️  Migration already recorded, skipping resolve."
    echo "$resolve_output" | grep -q "P3008" || echo "⚠️  Migration resolve failed (non-critical)"
  fi
fi

npx prisma migrate deploy || {
  echo "⚠️  Migration failed. Skipping db push to avoid data loss."
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
