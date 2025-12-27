# Environment Configuration Guide

This guide explains the different environment files and when to use each one.

## 📁 Environment Files Overview

### `.env.local` - Local Development (npm run dev)
**Use when:** Running the bot locally on your machine without Docker

**Features:**
- ✅ SQLite database (file-based, no setup needed)
- ✅ Stdio MCP transport (no separate server processes)
- ✅ Debug mode enabled
- ✅ All services run on localhost

**Setup:**
```bash
# Copy to .env for local development
cp .env.local .env

# Update these values:
# - TELEGRAM_BOT_TOKEN (get from @BotFather)
# - RASTAR_USERNAME (your my.rastar.company username)
# - RASTAR_PASSWORD (your my.rastar.company password)
# - OPENROUTER_API_KEY (optional, for AI features)

# Run development mode
npm run dev
```

---

### `.env` - Docker Local Testing
**Use when:** Testing with Docker locally before production deployment

**Features:**
- ✅ PostgreSQL database (Docker container)
- ✅ HTTP MCP transport (separate server containers)
- ✅ Production-like environment
- ✅ All services containerized

**Setup:**
```bash
# .env is already configured for Docker
# Update these values if needed:
# - TELEGRAM_BOT_TOKEN
# - RASTAR_USERNAME/PASSWORD
# - ADMIN_BASIC_AUTH_PASS

# Start all services
docker compose up -d --build
```

---

### `.env.production.example` - Production Deployment
**Use when:** Deploying to production server

**Features:**
- ✅ PostgreSQL database (production instance)
- ✅ HTTPS/SSL support
- ✅ Production security settings
- ✅ Custom domain configuration

**Setup:**
```bash
# Copy to .env for production
cp .env.production.example .env

# Update ALL values (marked with # UPDATE THIS)
# Generate secure keys:
openssl rand -hex 32    # for ENCRYPTION_KEY
openssl rand -base64 32 # for NEXTAUTH_SECRET

# Deploy with Docker
docker compose up -d --build
```

---

### `.env.example` - Template Reference
**Use when:** Need a reference for all available environment variables

This file documents all possible configuration options with explanations.

---

## 🔑 Important Credentials

### Rastar Credentials
**RASTAR_USERNAME** and **RASTAR_PASSWORD** are your login credentials for **my.rastar.company** (the company food ordering system).

- These are used for system-level operations
- Individual users authenticate via `/link_rastar` in the Telegram bot
- Each user's credentials are stored encrypted in the database

### Telegram Bot Token
Get your token from [@BotFather](https://t.me/BotFather):
1. Send `/newbot` to @BotFather
2. Follow the instructions
3. Copy the token to `TELEGRAM_BOT_TOKEN`

### OpenRouter API Key
Get your key from [OpenRouter](https://openrouter.ai/keys):
1. Sign up at openrouter.ai
2. Go to Keys section
3. Create a new key
4. Copy to `OPENROUTER_API_KEY`

---

## 🗄️ Database Comparison

| Feature | SQLite (.env.local) | PostgreSQL (.env / production) |
|---------|---------------------|--------------------------------|
| Setup | Zero config | Requires server/container |
| Performance | Good for <100 users | Excellent for any scale |
| Concurrency | Limited | High |
| Backups | Copy file | Standard DB backups |
| Best for | Development | Production |

---

## 🚀 Quick Start

### For Development:
```bash
cp .env.local .env
# Edit .env with your credentials
npm install
npm run dev
```

### For Docker Testing:
```bash
# .env is already set up
docker compose up -d --build
# Access at http://localhost:3000
```

### For Production:
```bash
cp .env.production.example .env
# Edit .env with production values
docker compose up -d --build
```

---

## 🔒 Security Notes

1. **Never commit `.env` files to git** - they contain sensitive credentials
2. **Generate unique keys** for each environment (dev, staging, prod)
3. **Use strong passwords** for production databases
4. **Rotate API keys** regularly
5. **Enable SSL/TLS** in production

---

## 📚 Related Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Environment Configuration](./ENV_CONFIGURATION.md) - Detailed variable reference
- [Docker Setup](./README.md#docker-deployment) - Docker-specific configuration
