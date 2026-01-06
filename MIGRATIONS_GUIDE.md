# 🚀 Production Database Migration Guide

## Overview

The system uses **Prisma migrations** that work seamlessly across:
- **Development**: SQLite (`data/rastar.db`)
- **Production**: PostgreSQL (Docker/Dokploy)

## 🔄 How It Works

### Development (SQLite)
```bash
DATABASE_URL=file:./data/rastar.db
```

### Production (PostgreSQL)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

The `prisma.ts` automatically:
- Detects database type from `DATABASE_URL`
- Uses correct adapter (`better-sqlite3` or `pg`)
- Converts relative paths to absolute
- Ensures database directory exists

---

## 📝 Making Schema Changes

### 1. **Modify Schema**

Edit `packages/shared/prisma/schema.prisma`:

```prisma
model NewTable {
  id        String @id @default(cuid())
  name      String
  createdAt BigInt
}
```

### 2. **Create Migration (Development)**

```bash
# Create a new migration
npm run prisma:migrate

# Prisma will prompt for migration name
# Example: "add_new_table"
```

This creates:
```
packages/shared/prisma/migrations/
└── 20260106123456_add_new_table/
    └── migration.sql
```

### 3. **Generate Prisma Client**

```bash
npm run prisma:generate
```

This updates TypeScript types in `node_modules/@prisma/client`.

### 4. **Rebuild Code**

```bash
npm run build
```

---

## 🐳 Deploying to Production (Docker)

### Automatic Migration on Startup

The `docker-entrypoint.sh` automatically runs:

```bash
npx prisma migrate deploy
```

This:
1. ✅ Applies **only** new migrations
2. ✅ Skips already-applied migrations
3. ✅ Never drops data
4. ✅ Works with PostgreSQL

### Docker Compose Deployment

```bash
# Build with new schema changes
docker compose up -d --build

# The entrypoint will:
# 1. Generate Prisma Client
# 2. Apply pending migrations
# 3. Start application
```

### Docker Logs

```bash
# Watch migration progress
docker compose logs -f telegram-bot

# You'll see:
# 📊 Running database migrations...
# ✓ Migration applied: 20260106123456_add_new_table
# ✅ Starting application...
```

---

## 🎯 Dokploy Deployment

### 1. **Push Changes to Git**

```bash
git add .
git commit -m "feat: add new table to schema"
git push origin main
```

### 2. **Trigger Dokploy Deploy**

Dokploy will automatically:
1. Pull latest code
2. Build Docker image
3. Run container
4. Execute `docker-entrypoint.sh`
   - Applies migrations
   - Starts application

### 3. **Monitor Migration**

In Dokploy logs:
```
📊 Running database migrations...
Applying migration `20260106123456_add_new_table`
Database is now up to date!
✅ Starting application...
```

---

## 🔧 Production PostgreSQL Setup

### Environment Variables

Required in `.env` (production):

```bash
DATABASE_URL=postgresql://user:password@postgres-host:5432/rastar
```

### Docker Compose (Local PostgreSQL Testing)

```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: rastar
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  volumes:
    - postgres-data:/var/lib/postgresql/data
```

### Dokploy (Managed PostgreSQL)

1. Create PostgreSQL database in Dokploy
2. Copy connection string
3. Set `DATABASE_URL` in application environment variables

---

## 🛡️ Safety Features

### No Data Loss

Prisma migrations are **additive only** by default:
- ✅ Adding columns: Safe
- ✅ Adding tables: Safe
- ✅ Adding indexes: Safe
- ⚠️ Dropping columns: Requires `--accept-data-loss` flag
- ⚠️ Changing types: May require manual migration

### Rollback Protection

```bash
# Migrations are tracked in _prisma_migrations table
# Each migration runs only once
# State is preserved across restarts
```

### Production Migration Strategy

```bash
# Development: Create migration
npm run prisma:migrate

# Production: Auto-applies on deploy
# No manual intervention needed
```

---

## 🚨 Troubleshooting

### Migration Failed in Production

**Check logs:**
```bash
docker compose logs telegram-bot | grep -A 10 "Running database migrations"
```

**Manual migration:**
```bash
docker exec -it rastar-telegram-bot sh
cd packages/shared
npx prisma migrate deploy
```

### Database Out of Sync

**Verify migration state:**
```bash
npm run db:verify
```

This runs `reset-migrations.mjs` which:
1. Checks `_prisma_migrations` table
2. Verifies all tables exist
3. Auto-applies missing SQL if needed

### Reset Development Database

```bash
# ⚠️ DESTRUCTIVE - Only for development!
rm data/rastar.db
npm run prisma:migrate:deploy
```

---

## 📋 Quick Reference

### Development Workflow

```bash
# 1. Edit schema
vim packages/shared/prisma/schema.prisma

# 2. Create migration
npm run prisma:migrate

# 3. Generate client
npm run prisma:generate

# 4. Rebuild
npm run build

# 5. Test locally
npm run dev
```

### Production Deployment

```bash
# Push to Git
git push origin main

# Dokploy auto-deploys
# Migrations run automatically
# Zero downtime
```

### Docker Compose Testing

```bash
# Rebuild with new schema
docker compose up -d --build

# Check migration logs
docker compose logs -f telegram-bot
```

---

## ✅ Best Practices

1. **Always test migrations locally first**
   ```bash
   npm run prisma:migrate
   npm run dev
   ```

2. **Commit migration files to Git**
   ```bash
   git add packages/shared/prisma/migrations/
   git commit -m "migration: add new table"
   ```

3. **Never edit migration files manually**
   - Let Prisma generate them
   - Edits break checksum validation

4. **Use descriptive migration names**
   ```bash
   # Good: "add_tool_logs_table"
   # Bad: "test" or "migration"
   ```

5. **Monitor first production deploy**
   ```bash
   docker compose logs -f telegram-bot
   ```

6. **Backup before major changes**
   ```bash
   # PostgreSQL backup
   docker exec rastar-postgres pg_dump -U postgres rastar > backup.sql
   ```

---

## 🎓 Summary

- ✅ **Local dev**: Automatic verification with `npm run dev`
- ✅ **Docker**: Migrations run automatically on container start
- ✅ **Dokploy**: Migrations run automatically on deploy
- ✅ **Zero downtime**: Additive migrations are safe
- ✅ **No manual steps**: Everything is automated
- ✅ **Works with both**: SQLite (dev) and PostgreSQL (prod)

**Just push your code, and migrations happen automatically!** 🚀
