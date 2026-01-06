# Database Provider Migration Guide

## Issue
The Prisma schema was configured for SQLite (`provider = "sqlite"`) but production uses PostgreSQL. This causes the error:
```
Error: P1013
The provided database string is invalid. must start with the protocol `file:`.
```

## Solution

### ✅ Already Fixed
The [schema.prisma](../packages/shared/prisma/schema.prisma) has been updated to use PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 🚀 Deployment Steps

#### 1. **Commit and Push Changes**
```bash
git add packages/shared/prisma/schema.prisma
git commit -m "fix: Update Prisma schema to use PostgreSQL provider"
git push
```

#### 2. **Redeploy on Dokploy**
- Go to your Dokploy project
- Navigate to the `telegram-bot` service
- Click "Rebuild" or "Redeploy"
- The Docker build will regenerate the Prisma client with PostgreSQL provider
- Migrations will run automatically on startup

#### 3. **Verify**
Check the deployment logs to confirm:
```
🚀 Starting Rastar Telegram Bot...
📊 Running database migrations...
Datasource "db": PostgreSQL database "rastar" at "rastaarchat-postgresql-ddvxsa:5432"
✅ Starting application...
```

### 📝 Production Environment

Ensure your `.env.production` or Dokploy project environment variables include:

```env
DATABASE_URL=postgresql://rastaar:5tf6axmzyomabjhn@rastaarchat-postgresql-ddvxsa:5432/rastar
```

### 🔄 For Other Services

All services that use the database (admin-panel, mcp-planka, mcp-rastar) will automatically use the updated schema when rebuilt.

### ⚠️ Important Notes

1. **PostgreSQL Only**: The schema is now configured for PostgreSQL. For local development with SQLite, you'll need to temporarily change the provider.

2. **Migration Lock**: The migrations were created for SQLite but are compatible with PostgreSQL since we use simple types (String, BigInt, Boolean).

3. **Existing Data**: If you had data in SQLite during development, you'll need to manually migrate it to PostgreSQL or recreate it.

### 🛠️ Local Development with SQLite (Optional)

If you want to use SQLite locally, create a local override:

1. Keep the schema as PostgreSQL (for production)
2. Use environment variable to switch:
   ```env
   DATABASE_URL=file:./data/rastar.db
   ```
3. Note: This only works because our schema uses compatible types

### 🔍 Troubleshooting

#### "Migration failed" errors
- Ensure the PostgreSQL database is accessible
- Check DATABASE_URL credentials
- Verify the database exists

#### "P1013" still appears
- Clear Docker build cache: `docker builder prune`
- Force rebuild in Dokploy
- Check that the schema.prisma change is included in the build

#### "No migration found"
- This is normal on first deployment
- Prisma will create tables based on the schema
- Subsequent deployments will detect and run new migrations

