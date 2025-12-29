# Environment Variables Configuration Guide

Complete reference for all environment variables used in the Rastar Telegram Bot platform.

## 📂 Configuration Files

- `.env.example` - Template with all available variables
- `.env.production.example` - Production-ready template
- `.env.development.example` - Development template
- `.env` - Your actual configuration (gitignored)

## 🔧 Configuration by Service

### 🤖 Telegram Bot

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ Yes | - | Bot token from @BotFather |
| `TELEGRAM_BOT_USERNAME` | ❌ No | - | Bot username (for @mentions) |
| `MCP_PLANKA_URL` | ✅ Yes* | `http://mcp-planka:3100/sse` | MCP Planka server URL |
| `MCP_RASTAR_URL` | ✅ Yes* | `http://mcp-rastar:3101/sse` | MCP Rastar server URL |
| `LINK_PORTAL_URL` | ✅ Yes | `http://link-portal:3002` | Link portal URL |

*Auto-configured in docker-compose

### 🎨 Admin Panel

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_PANEL_URL` | ✅ Yes | `http://localhost:3000` | Public URL of admin panel |
| `NEXTAUTH_SECRET` | ✅ Yes | - | NextAuth encryption secret |
| `NEXTAUTH_URL` | ✅ Yes | `http://localhost:3000` | NextAuth callback URL |
| `DEFAULT_ADMIN_USERNAME` | ❌ No | - | Auto-create admin username (Docker only) |
| `DEFAULT_ADMIN_PASSWORD` | ❌ No | - | Auto-create admin password (Docker only) |
| `ADMIN_PANEL_PORT` | ❌ No | `3000` | Internal port |

### 🔗 Link Portal

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LINK_PORTAL_URL` | ✅ Yes | `http://localhost:3002` | Public URL of link portal |
| `LINK_PORTAL_PORT` | ❌ No | `3002` | Internal port |

### 🔌 MCP Planka Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PLANKA_SERVER_URL` | ✅ Yes | - | Your Planka instance URL |
| `MCP_PLANKA_URL` | ✅ Yes* | `http://localhost:3100` | MCP server public URL |
| `MCP_PLANKA_PORT` | ❌ No | `3100` | MCP server port |
| `MCP_TRANSPORT` | ❌ No | `stdio` / `http` | Transport mode |

*Only needed for external access

### 🔌 MCP Rastar Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RASTAR_API_URL` | ✅ Yes | - | Rastar API base URL |
| `RASTAR_USERNAME` | ✅ Yes | - | Rastar API username |
| `RASTAR_PASSWORD` | ✅ Yes | - | Rastar API password |
| `MCP_RASTAR_URL` | ✅ Yes* | `http://localhost:3101` | MCP server public URL |
| `MCP_RASTAR_PORT` | ❌ No | `3101` | MCP server port |
| `MCP_TRANSPORT` | ❌ No | `stdio` / `http` | Transport mode |

*Only needed for external access

### 🗄️ Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | `file:./data/rastar.db` | Prisma database URL |
| `DATABASE_PATH` | ❌ No | `./data/rastar.db` | SQLite file path (dev only) |

**PostgreSQL Example:**
```env
DATABASE_URL=postgresql://user:password@postgres:5432/rastar
```

### 🤖 AI / OpenRouter

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | ✅ Yes | - | API key from openrouter.ai |
| `DEFAULT_AI_MODEL` | ❌ No | `anthropic/claude-3.5-sonnet` | Default model ID |

### 🔒 Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENCRYPTION_KEY` | ✅ Yes | - | 64-char hex for encrypting tokens |
| `NEXTAUTH_SECRET` | ✅ Yes | - | NextAuth session encryption |

**Generate with:**
```bash
openssl rand -hex 32    # ENCRYPTION_KEY
openssl rand -base64 32 # NEXTAUTH_SECRET
```

### 🌐 Deployment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ❌ No | `development` | `development` or `production` |
| `BASE_DOMAIN` | ❌ No | - | Base domain for all services |
| `LOG_LEVEL` | ❌ No | `info` | `error`, `warn`, `info`, `debug` |
| `DEBUG` | ❌ No | `false` | Enable debug logging |

## 🚀 Quick Setup Guides

### For Production Deployment

```bash
# 1. Copy production template
cp .env.production.example .env

# 2. Generate secrets
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env

# 3. Edit .env and set:
nano .env
# - TELEGRAM_BOT_TOKEN
# - OPENROUTER_API_KEY
# - ENCRYPTION_KEY
# - NEXTAUTH_SECRET
# - PLANKA_SERVER_URL
# - RASTAR_SUPABASE_URL
# - RASTAR_SUPABASE_ANON_KEY
# - DEFAULT_ADMIN_USERNAME (optional)
# - DEFAULT_ADMIN_PASSWORD (optional)
# - Update all URLs with your domain

# 4. Deploy
docker compose up -d
```

### For Local Development

```bash
# 1. Copy development template
cp .env.development.example .env

# 2. Edit .env and set your API keys
nano .env

# 3. Start services
npm run dev
```

### For Exposing MCP Servers Externally

If you want to access MCP servers from other projects:

```bash
# In your .env, set public URLs
MCP_PLANKA_URL=https://mcp-planka.your-domain.com
MCP_RASTAR_URL=https://mcp-rastar.your-domain.com

# Then update your reverse proxy (Caddy example):
cat >> Caddyfile << EOF
mcp-planka.your-domain.com {
    reverse_proxy localhost:3100
}

mcp-rastar.your-domain.com {
    reverse_proxy localhost:3101
}
EOF

# Restart Caddy
caddy reload
```

## 🔗 URL Configuration Examples

### Example 1: Subdomains (Recommended)

```env
BASE_DOMAIN=mycompany.com
ADMIN_PANEL_URL=https://admin.mycompany.com
LINK_PORTAL_URL=https://link.mycompany.com
MCP_PLANKA_URL=http://mcp-planka:3100      # Internal
MCP_RASTAR_URL=http://mcp-rastar:3101      # Internal
```

**Reverse Proxy (Caddy):**
```caddy
admin.mycompany.com {
    reverse_proxy localhost:3000
}

link.mycompany.com {
    reverse_proxy localhost:3002
}
```

### Example 2: Path-based

```env
BASE_DOMAIN=mycompany.com
ADMIN_PANEL_URL=https://mycompany.com/admin
LINK_PORTAL_URL=https://mycompany.com/link
```

**Reverse Proxy (Nginx):**
```nginx
location /admin {
    proxy_pass http://localhost:3000;
}

location /link {
    proxy_pass http://localhost:3002;
}
```

### Example 3: Development (localhost)

```env
ADMIN_PANEL_URL=http://localhost:3000
LINK_PORTAL_URL=http://localhost:3002
MCP_PLANKA_URL=http://localhost:3100
MCP_RASTAR_URL=http://localhost:3101
```

### Example 4: IP Address (Testing)

```env
ADMIN_PANEL_URL=http://192.168.1.100:3000
LINK_PORTAL_URL=http://192.168.1.100:3002
```

## 🔍 Validation

Check your configuration:

```bash
# Verify all required vars are set
docker compose config

# Test database connection
docker compose exec telegram-bot npx prisma db pull

# Test MCP servers
curl http://localhost:3100/health
curl http://localhost:3101/health

# Test admin panel
curl http://localhost:3000/api/health

# Test link portal
curl http://localhost:3002/health
```

## ⚠️ Security Best Practices

1. **Never commit `.env` files** - They're gitignored by default
2. **Use strong passwords** - At least 16 characters
3. **Rotate secrets regularly** - Especially after team changes
4. **Limit exposed ports** - Only expose what's needed
5. **Use HTTPS in production** - Always use SSL/TLS
6. **Restrict database access** - Only internal services
7. **Monitor logs** - Set up log aggregation

## 🐛 Troubleshooting

### Environment not loading

```bash
# Check if .env exists
ls -la .env

# Verify syntax (no spaces around =)
cat .env | grep -v '^#' | grep '= '

# Test with docker compose
docker compose config | grep -i "your_variable"
```

### Wrong URLs being used

```bash
# Check what's actually set in container
docker compose exec telegram-bot env | grep URL

# Override in docker-compose.yml if needed
docker compose exec telegram-bot sh -c 'echo $ADMIN_PANEL_URL'
```

### MCP servers not connecting

```bash
# Check MCP_TRANSPORT is set correctly
docker compose exec telegram-bot env | grep MCP

# Test MCP server health
curl http://localhost:3100/health
curl http://localhost:3101/health

# Check logs
docker compose logs mcp-planka
docker compose logs mcp-rastar
```

## 📚 Related Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [MCP_STANDALONE.md](MCP_STANDALONE.md) - MCP server configuration
- [README.md](README.md) - Project overview
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
