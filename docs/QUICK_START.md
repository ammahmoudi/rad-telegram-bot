# Quick Start Guide 🚀

Get your Rastar Telegram Bot up and running in minutes!

---

## 📋 Prerequisites

- Node.js 20+ or Docker
- PostgreSQL (or use Docker)
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- OpenRouter API Key (for AI features)
- Planka instance URL
- Rastar Supabase credentials

---

## 🚀 Option 1: Quick Start with Docker (Recommended)

### 1. Clone & Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd rastar-telegram-bot

# Copy environment file
cp .env.example .env
```

### 2. Edit `.env` file with your credentials

```bash
# Required: Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Required: Database (if using Docker, keep defaults)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rastar

# Required: AI Features
OPENROUTER_API_KEY=your_openrouter_api_key
DEFAULT_AI_MODEL=anthropic/claude-3.5-sonnet

# Required: Security
ENCRYPTION_KEY=your_32_character_encryption_key_here
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Optional: Auto-create default admin (Docker only)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123

# Required: Planka Integration
PLANKA_SERVER_URL=https://your-planka-instance.com

# Required: Rastar Integration
RASTAR_SUPABASE_URL=https://my-api.rastar.company
RASTAR_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5NjE0NDMwLCJleHAiOjE5MjcyOTQ0MzB9.LRItEoNveDk6rALZlcDpLrN_t7YX1othdPwgtIatVZ0
RASTAR_SUPABASE_AUTH_PATH=/auth/v1/token?grant_type=password
RASTAR_SUPABASE_KEY_HEADER=apikey

# Optional: URLs (use defaults for Docker)
LINK_PORTAL_URL=http://link-portal:3002
NEXTAUTH_URL=http://localhost:3000
```

**Important for Production:** If you set `DEFAULT_ADMIN_USERNAME` and `DEFAULT_ADMIN_PASSWORD` in `.env`, the admin user will be created automatically when Docker starts. No manual commands needed!

### 3. Start Everything with Docker

```bash
# Start all services (Database, MCP Servers, Bot, Admin Panel, Link Portal)
npm run docker:up

# View logs
npm run docker:logs
```

**⚡ Docker automatically handles:**
- ✅ Database migrations (Prisma)
- ✅ Prisma client generation
- ✅ TypeScript compilation
- ✅ Dependencies installation
- ✅ Admin user creation (if env vars set)
- ✅ Service health checks

**No manual commands needed!** Everything runs automatically.

### 4. Access Your Services

**If you set `DEFAULT_ADMIN_USERNAME` and `DEFAULT_ADMIN_PASSWORD` in `.env`, skip this step!**

Otherwise, create an admin user manually:

```bash
# Create your first admin user (only if not using env vars)
docker exec rastar-telegram-bot npm run create-admin -- adminuser YourSecurePassword123
```

Access your services:
- **Telegram Bot**: Send `/start` to your bot on Telegram
- **Admin Panel**: http://localhost:3000
- **Link Portal**: http://localhost:3002

### 5. Configure System Messages (Optional)

1. Login to Admin Panel at http://localhost:3000
2. Navigate to System Messages
3. Configure AI prompts and welcome messages for Persian and English
4. Save changes

---

## 🐳 Docker Production Notes

**Everything is automated in Docker! You don't need to run any commands.**

When you run `docker compose up`:
1. ✅ Prisma migrations run automatically
2. ✅ Default admin user created (if `DEFAULT_ADMIN_USERNAME` and `DEFAULT_ADMIN_PASSWORD` are set in `.env`)
3. ✅ All dependencies installed during build
4. ✅ TypeScript compiled during build
5. ✅ Services start automatically
6. ✅ Health checks monitor all services

**See [DOCKER_PRODUCTION.md](./DOCKER_PRODUCTION.md) for complete production deployment guide.**

---

## 💻 Option 2: Development Mode (Local)

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Start PostgreSQL (or use Docker)
# If using Docker for DB only:
docker compose up postgres -d

# Generate Prisma client and run migrations
npm run db:setup
```

### 3. Configure Environment

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your credentials (same as Docker option above)
```

### 4. Create Admin User

```bash
npm run create-admin -- adminuser YourPassword123
```

### 5. Start Development Servers

```bash
# Start all services (Bot, Admin Panel, Link Portal)
npm run dev
```

This will start:
- Telegram Bot on port 3001
- Link Portal on port 3002  
- Admin Panel on port 3000

---

## 🛠️ Available NPM Scripts

### Main Commands
```bash
npm run setup           # Install deps + setup database
npm run dev            # Start all services in development
npm run build          # Build all TypeScript projects
npm run start          # Start telegram bot in production

# Docker commands
npm run docker:up      # Start all Docker services
npm run docker:down    # Stop all Docker services
npm run docker:logs    # View Docker logs
npm run docker:rebuild # Rebuild and restart containers
```

### Database Commands
```bash
npm run db:setup              # Generate Prisma client + run migrations
npm run prisma:generate       # Generate Prisma client only
npm run prisma:migrate        # Create new migration (dev)
npm run prisma:migrate:deploy # Apply migrations (production)
npm run prisma:studio         # Open Prisma Studio GUI
```

### Admin Panel Commands
```bash
npm run admin:build   # Build admin panel for production
npm run admin:start   # Start admin panel in production
```

---

## 📝 Useful Scripts

### Create Admin User
```bash
# Development
tsx scripts/create-admin.ts <username> <password>

# Docker
docker exec rastar-telegram-bot tsx scripts/create-admin.ts <username> <password>
```

### Create Default Character Pack
```bash
# Development
tsx scripts/create-default-pack.ts

# Docker  
docker exec rastar-telegram-bot tsx scripts/create-default-pack.ts
```

---

## 🔍 Verify Installation

### Check if services are running:

```bash
# Docker
docker ps

# You should see containers:
# - rastar-postgres
# - rastar-telegram-bot
# - rastar-admin-panel
# - rastar-link-portal
# - rastar-mcp-planka
# - rastar-mcp-rastar
```

### Test the bot:

1. Open Telegram
2. Find your bot
3. Send `/start` - you should get a welcome message
4. Try linking accounts using `/link_planka` or `/link_rastar`

### Check logs:

```bash
# All services
npm run docker:logs

# Specific service
docker logs rastar-telegram-bot
docker logs rastar-admin-panel
```

---

## 🐛 Troubleshooting

### Database connection issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Reset database
docker compose down -v
docker compose up postgres -d
npm run db:setup
```

### Prisma errors

```bash
# Regenerate Prisma client
npm run prisma:generate

# Reset migrations
npm run prisma:migrate
```

### Docker build issues

```bash
# Clean rebuild
npm run docker:down
docker system prune -f
npm run docker:rebuild
```

### Admin panel login issues

```bash
# Create a new admin user
tsx scripts/create-admin.ts newadmin NewPassword123
```

### Bot not responding

1. Check `TELEGRAM_BOT_TOKEN` in `.env`
2. Check logs: `docker logs rastar-telegram-bot`
3. Verify bot is running: `docker ps`
4. Restart bot: `docker restart rastar-telegram-bot`

---

## 📚 Next Steps

1. **Configure AI Prompts**: Login to Admin Panel and customize system messages
2. **Test Account Linking**: Try `/link_planka` and `/link_rastar` commands
3. **Review Documentation**:
   - [Admin Panel Guide](./ADMIN_PANEL_GUIDE.md)
   - [AI Chatbot Guide](./AI_CHATBOT_GUIDE.md)
   - [Environment Configuration](./ENV_CONFIGURATION.md)
   - [Deployment Guide](./DEPLOYMENT.md)

---

## 🆘 Need Help?

- Check existing documentation in the project root
- Review logs: `npm run docker:logs`
- Check `.env` configuration
- Verify all required services are running

---

## 🎉 You're Ready!

Your Rastar Telegram Bot is now running with:
- ✅ AI-powered chat responses
- ✅ Multi-language support (Persian/English)
- ✅ Planka and Rastar account linking
- ✅ Admin panel for system configuration
- ✅ MCP servers for extensibility

Enjoy your bot! 🤖
