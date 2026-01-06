#!/bin/bash
# Example: Adding a new feature with database changes

set -e

echo "📝 Example: Adding email notifications feature"
echo ""

# Step 1: Edit schema
echo "1️⃣ Edit schema file..."
echo "   vim packages/shared/prisma/schema.prisma"
echo ""
echo "   Add this model:"
echo "   model EmailNotification {"
echo "     id        String @id @default(cuid())"
echo "     userId    String"
echo "     email     String"
echo "     enabled   Boolean @default(true)"
echo "     createdAt BigInt"
echo "   }"
echo ""

# Step 2: Create migration
echo "2️⃣ Create migration..."
echo "   npm run prisma:migrate"
echo ""
echo "   Prisma will prompt: Enter a name for the migration:"
echo "   Type: add_email_notifications"
echo ""

# Step 3: Generate client
echo "3️⃣ Generate Prisma client..."
echo "   npm run prisma:generate"
echo ""

# Step 4: Rebuild
echo "4️⃣ Rebuild TypeScript..."
echo "   npm run build"
echo ""

# Step 5: Test locally
echo "5️⃣ Test locally..."
echo "   npm run dev"
echo ""
echo "   ✅ Database verified automatically"
echo "   ✅ Tables created in SQLite"
echo "   ✅ Application started"
echo ""

# Step 6: Commit
echo "6️⃣ Commit changes..."
echo "   git add packages/shared/prisma/"
echo "   git commit -m 'feat: add email notifications'"
echo ""

# Step 7: Deploy
echo "7️⃣ Deploy to production..."
echo "   git push origin main"
echo ""
echo "   In Docker/Dokploy:"
echo "   📊 Running database migrations..."
echo "   ✓ Migration '20260106123456_add_email_notifications' applied"
echo "   ✅ Application started with new schema"
echo ""

echo "🎉 Done! Migration applied automatically in production!"
echo ""
echo "📋 The migration file:"
echo "   packages/shared/prisma/migrations/20260106123456_add_email_notifications/migration.sql"
echo ""
echo "📊 In PostgreSQL production:"
echo "   CREATE TABLE \"EmailNotification\" ("
echo "     \"id\" TEXT NOT NULL PRIMARY KEY,"
echo "     \"userId\" TEXT NOT NULL,"
echo "     \"email\" TEXT NOT NULL,"
echo "     \"enabled\" BOOLEAN NOT NULL DEFAULT true,"
echo "     \"createdAt\" BIGINT NOT NULL"
echo "   );"
echo ""
echo "✅ Same SQL works in both SQLite (dev) and PostgreSQL (prod)!"
