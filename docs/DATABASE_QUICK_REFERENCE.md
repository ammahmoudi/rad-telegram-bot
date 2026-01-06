# 🎯 Database Management - Quick Reference

## 🚀 Production Works Automatically

Your setup is **production-ready** and handles PostgreSQL automatically:

```bash
# Just push code - migrations happen automatically!
git push origin main
```

## 📋 Common Commands

### Development (SQLite)

```bash
# Start with auto-verification
npm run dev

# Create new migration
npm run prisma:migrate

# Check migration status
npm run prisma:status

# View/edit data
npm run prisma:studio
```

### Production (PostgreSQL)

```bash
# Check production migrations (via SSH/Docker)
npm run db:check

# Apply migrations manually (if needed)
npm run prisma:migrate:deploy

# View database
npm run prisma:studio
```

## 🔄 Making Schema Changes

### Step-by-Step

1. **Edit Schema**
   ```bash
   vim packages/shared/prisma/schema.prisma
   ```

2. **Create Migration**
   ```bash
   npm run prisma:migrate
   # Enter descriptive name: "add_notifications_table"
   ```

3. **Generate Client**
   ```bash
   npm run prisma:generate
   ```

4. **Rebuild**
   ```bash
   npm run build
   ```

5. **Test Locally**
   ```bash
   npm run dev  # Auto-verifies database
   ```

6. **Deploy to Production**
   ```bash
   git add packages/shared/prisma/
   git commit -m "feat: add notifications"
   git push origin main
   ```

## ✅ What Happens in Production

### Docker Compose

```bash
docker compose up -d --build

# Container startup:
# 1. 📊 Running database migrations...
# 2. ✓ Migration '20260106_add_notifications' applied
# 3. ✅ Starting application...
```

### Dokploy

```
# On git push:
1. Pull latest code
2. Build Docker image
3. Start container
   └─> docker-entrypoint.sh
       ├─> npx prisma migrate deploy
       │   └─> Applies new migrations only
       └─> node apps/telegram-bot/dist/index.js
```

## 🛡️ Safety Features

### Automatic Protection

- ✅ **Migrations run once** - Tracked in `_prisma_migrations` table
- ✅ **Skips existing** - Only applies new migrations
- ✅ **No data loss** - Additive changes are safe
- ✅ **Database type detection** - Works with SQLite and PostgreSQL
- ✅ **Path resolution** - Handles relative and absolute paths

### Development Safeguards

```bash
# Verifies database before starting
npm run dev
# 🔄 Resetting database migrations...
# ✅ All tables exist, no action needed
```

## 📊 Database Types

### SQLite (Development)

```env
DATABASE_URL=file:./data/rastar.db
```

- ✅ File-based
- ✅ No server needed
- ✅ Perfect for local dev
- ✅ Committed to Git (small data)

### PostgreSQL (Production)

```env
DATABASE_URL=postgresql://user:pass@host:5432/rastar
```

- ✅ Robust and scalable
- ✅ Multi-user access
- ✅ ACID transactions
- ✅ Production-grade

### Both Use Same Migrations! 🎉

```sql
-- Works in SQLite AND PostgreSQL
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL
);
```

## 🔧 Troubleshooting

### Check Migration Status

```bash
# Development
npm run prisma:status

# Production (Docker)
docker exec rastar-telegram-bot npm run prisma:status
```

### View Migration Logs

```bash
# Docker Compose
docker compose logs telegram-bot | grep migration

# Dokploy
# Check container logs in Dokploy UI
```

### Manual Migration (Emergency)

```bash
# Docker
docker exec -it rastar-telegram-bot sh
cd packages/shared
npx prisma migrate deploy

# Direct access (if you have SSH)
cd /path/to/app/packages/shared
npx prisma migrate deploy
```

### Reset Development Database

```bash
# ⚠️ DESTROYS DATA - Development only!
rm data/rastar.db
npm run db:setup
```

## 📚 Full Documentation

For detailed guides, see:
- 📖 [MIGRATIONS_GUIDE.md](../MIGRATIONS_GUIDE.md) - Complete migration workflow
- 📝 [migration-example.sh](../docs/migration-example.sh) - Step-by-step example
- 🔍 [check-production-migrations.mjs](../scripts/check-production-migrations.mjs) - Production checker

## 🎓 Key Concepts

### Migration Files

```
packages/shared/prisma/migrations/
├── 20251228134626_test/
│   └── migration.sql          # Initial schema
├── 20260106063036_add_mcp_tool_logging/
│   └── migration.sql          # Add McpToolLog table
└── 20260106070831_add_session_message_to_tool_logs/
    └── migration.sql          # Add sessionId/messageId fields
```

### Migration Tracking

```sql
-- _prisma_migrations table
SELECT migration_name, finished_at FROM _prisma_migrations;

20251228134626_test                              | 2025-12-28 13:46:30
20260106063036_add_mcp_tool_logging             | 2026-01-06 06:30:40
20260106070831_add_session_message_to_tool_logs | 2026-01-06 07:08:35
```

### Prisma Client Generation

```bash
npm run prisma:generate
# Generates TypeScript types in node_modules/@prisma/client
# Enables type-safe database queries
```

## 💡 Pro Tips

1. **Always test migrations locally first**
   ```bash
   npm run prisma:migrate
   npm run dev
   ```

2. **Use descriptive migration names**
   ```bash
   # Good: "add_email_notifications"
   # Bad: "test" or "migration1"
   ```

3. **Commit migration files**
   ```bash
   git add packages/shared/prisma/migrations/
   ```

4. **Monitor first production deploy**
   ```bash
   docker compose logs -f telegram-bot
   ```

5. **Keep migrations additive**
   - Add tables ✅
   - Add columns ✅
   - Add indexes ✅
   - Drop columns ⚠️ (requires flag)

## 🚀 Summary

Your production database setup is **bulletproof**:

- ✅ Automatic migrations on deploy
- ✅ Works with SQLite and PostgreSQL
- ✅ No manual intervention needed
- ✅ Safe and tested
- ✅ Zero downtime deployments

**Just push your code and let it handle the rest!** 🎉
