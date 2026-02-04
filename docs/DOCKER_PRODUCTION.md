# 🐳 Docker Production Deployment Guide

This guide covers deploying the Rastar Telegram Bot in production using Docker Compose.

---

## ✨ What's Automated in Docker

### ✅ **Zero Manual Commands Required**

When you run `docker compose up`, everything happens automatically:

1. **Database Migrations** - Prisma migrations run automatically on container startup
2. **Prisma Client Generation** - Built into the Docker image during build
3. **Dependencies Installation** - All npm packages installed during build
4. **TypeScript Compilation** - All code compiled to JavaScript during build
5. **Default Admin Creation** - Optional admin user created from environment variables
6. **Health Checks** - Automatic service health monitoring
7. **Auto-restart** - Services restart automatically on failure

### 🎯 **No Manual Intervention**

You don't need to:
- ❌ Run `npm install`
- ❌ Run `npm run prisma:generate`
- ❌ Run `npm run prisma:migrate`
- ❌ Run `npm run build`
- ❌ Run `tsx scripts/create-admin.ts` (optional, uses env vars)

Everything is handled by Docker! 🚀

---

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- Your `.env` file configured

---

## 🚀 Quick Deployment

### 1. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your production values
nano .env
```

### 2. Set Required Variables

```env
# Telegram
TELEGRAM_BOT_TOKEN=your_production_bot_token

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rastar

# AI
OPENROUTER_API_KEY=your_production_key
DEFAULT_AI_MODEL=anthropic/claude-3.5-sonnet

# Security (generate strong random keys)
ENCRYPTION_KEY=your_32_character_encryption_key
NEXTAUTH_SECRET=your_nextauth_secret_key

# Planka
PLANKA_SERVER_URL=https://planka.yourdomain.com

# Rastar
RASTAR_SUPABASE_URL=https://your-project.supabase.co
RASTAR_SUPABASE_ANON_KEY=your_anon_key

# Optional: Auto-create admin user on first startup
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123
```

### 3. Deploy

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Check service status
docker compose ps
```

That's it! Everything is now running. 🎉

---

## 🔐 Default Admin Creation (Automatic)

### Option 1: Environment Variables (Recommended)

Set these in your `.env` file:

```env
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123
```

The admin user will be created automatically on first startup. If the user already exists, it will be skipped.

### Option 2: Manual Creation (After Deployment)

If you prefer not to use environment variables:

```bash
# Create admin user manually
docker exec rastar-telegram-bot tsx scripts/create-admin.ts adminuser MyPassword123

# Or in the admin-panel container
docker exec rastar-admin-panel tsx scripts/create-admin.ts adminuser MyPassword123
```

---

## 📦 What Each Service Does

### **postgres** (Database)
- PostgreSQL 16
- Port: 5432
- Auto-creates `rastar` database
- Health checks ensure it's ready before other services start

### **mcp-planka** (Planka MCP Server)
- Port: 3100
- Handles Planka API operations
- **Auto-migration**: Runs Prisma migrations on startup

### **mcp-rastar** (Rastar MCP Server)
- Port: 3101
- Handles Rastar API operations
- **Auto-migration**: Runs Prisma migrations on startup

### **telegram-bot** (Main Bot)
- Listens for Telegram messages
- AI-powered chat responses
- Account linking logic
- **Auto-migration**: Runs Prisma migrations on startup
- **Auto-admin**: Creates default admin if env vars are set

### **link-portal** (OAuth Portal)
- Port: 3002
- Handles OAuth flows for account linking
- **Auto-migration**: Runs Prisma migrations on startup

### **admin-panel** (Admin UI)
- Port: 3000
- Web interface for system configuration
- **Auto-migration**: Runs Prisma migrations on startup
- **Auto-admin**: Creates default admin if env vars are set

---

## 🔄 Container Lifecycle

### On Startup (Automatic)

Each container follows this sequence:

```
1. Container starts
2. Entrypoint script runs
3. ✅ Prisma migrations execute (npx prisma migrate deploy)
4. ✅ Default admin created (if env vars set)
5. ✅ Application starts
6. ✅ Health check confirms service is ready
```

### On Restart

```
1. Container restarts (automatic if crashed)
2. Migrations run again (idempotent, safe to re-run)
3. Admin creation attempted (skips if exists)
4. Application starts
```

---

## 🛠️ Common Commands

### Deployment

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d telegram-bot

# Stop all services
docker compose down

# Stop and remove volumes (CAUTION: deletes data)
docker compose down -v

# Restart a service
docker compose restart telegram-bot

# Rebuild and restart
docker compose up -d --build
```

### Logs & Monitoring

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f telegram-bot
docker compose logs -f admin-panel

# View last 100 lines
docker compose logs --tail=100 telegram-bot

# Check service health
docker compose ps
```

### Database Operations

```bash
# Access Prisma Studio (database GUI)
docker exec -it rastar-telegram-bot npx prisma studio

# Run migrations manually (not needed, but available)
docker exec rastar-telegram-bot npx prisma migrate deploy

# Database backup (PostgreSQL)
docker exec rastar-postgres pg_dump -U postgres rastar > backup.sql

# Database restore
cat backup.sql | docker exec -i rastar-postgres psql -U postgres rastar
```

### Admin User Management

```bash
# Create additional admin users
docker exec rastar-telegram-bot tsx scripts/create-admin.ts newadmin NewPassword123

# List all admin users
docker exec rastar-telegram-bot npx prisma studio
# Then navigate to the Admin table
```

---

## 🔍 Troubleshooting

### Services Not Starting

```bash
# Check logs for errors
docker compose logs telegram-bot

# Check if database is healthy
docker compose ps postgres

# Restart problematic service
docker compose restart telegram-bot
```

### Database Connection Issues

```bash
# Verify database is running
docker exec rastar-postgres pg_isready -U postgres

# Check DATABASE_URL in containers
docker exec rastar-telegram-bot env | grep DATABASE_URL

# Restart database
docker compose restart postgres
```

### Migration Errors

```bash
# View migration status
docker exec rastar-telegram-bot npx prisma migrate status

# Force re-run migrations
docker compose down
docker compose up -d
```

### Admin Login Not Working

```bash
# Verify admin exists
docker exec rastar-admin-panel npx prisma studio

# Create new admin
docker exec rastar-admin-panel tsx scripts/create-admin.ts testadmin TestPass123

# Check logs for auth errors
docker compose logs admin-panel
```

### Bot Not Responding

```bash
# Check bot logs
docker compose logs telegram-bot

# Verify TELEGRAM_BOT_TOKEN
docker exec rastar-telegram-bot env | grep TELEGRAM_BOT_TOKEN

# Restart bot
docker compose restart telegram-bot
```

---

## 🔐 Security Best Practices

### Environment Variables

```bash
# Generate strong encryption key (32 characters)
openssl rand -hex 32

# Generate NextAuth secret
openssl rand -base64 32
```

### Production Checklist

- [ ] Use strong `ENCRYPTION_KEY` (32+ chars)
- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Use strong `DEFAULT_ADMIN_PASSWORD` (if used)
- [ ] Set `NODE_ENV=production` (default in docker-compose)
- [ ] Use PostgreSQL (not SQLite) for production
- [ ] Enable HTTPS/TLS (use reverse proxy like Nginx)
- [ ] Restrict database access (firewall rules)
- [ ] Regularly backup PostgreSQL data
- [ ] Monitor logs for suspicious activity

---

## 📊 Health Checks

All services have automatic health checks:

```yaml
telegram-bot:  Every 30s, checks http://localhost:3001/health
admin-panel:   Every 30s, checks http://localhost:3000/api/health
link-portal:   Every 30s, checks http://localhost:3002/healthz
mcp-planka:    Every 30s, checks http://localhost:3100/health
mcp-rastar:    Every 30s, checks http://localhost:3101/health
postgres:      Every 10s, checks pg_isready
```

View health status:
```bash
docker compose ps
```

Healthy services show `healthy` in the STATUS column.

---

## 🔄 Updates & Maintenance

### Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build

# Check logs to verify update
docker compose logs -f
```

### Database Migrations on Update

Migrations run automatically when containers start, so:

1. Pull new code with schema changes
2. Rebuild containers: `docker compose up -d --build`
3. Migrations apply automatically
4. No manual intervention needed

---

## 📈 Scaling & Performance

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  telegram-bot:
    deploy:
      replicas: 3  # Run 3 instances
```

### Resource Limits

```yaml
services:
  telegram-bot:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

---

## 🆘 Getting Help

### Useful Diagnostic Commands

```bash
# Full system status
docker compose ps
docker compose stats

# Check all environment variables
docker compose config

# Inspect specific container
docker inspect rastar-telegram-bot

# Access container shell
docker exec -it rastar-telegram-bot sh

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## 🎉 Summary

### What You DON'T Need to Do

- ❌ Run any npm commands
- ❌ Run Prisma commands manually
- ❌ Build TypeScript manually
- ❌ Create admin users manually (if using env vars)
- ❌ Worry about dependencies

### What Docker Does Automatically

- ✅ Installs dependencies
- ✅ Generates Prisma client
- ✅ Compiles TypeScript
- ✅ Runs database migrations
- ✅ Creates default admin (optional)
- ✅ Monitors service health
- ✅ Restarts on failure

### All You Need

```bash
# Setup
cp .env.example .env
nano .env  # Add your credentials

# Deploy
docker compose up -d

# That's it! 🎉
```

Your production bot is now running with zero manual intervention! 🚀
