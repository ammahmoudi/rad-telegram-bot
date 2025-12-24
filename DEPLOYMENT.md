# Production Deployment Guide

This guide covers deploying the Rastar Telegram Bot platform to production using Docker.

## 📋 Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+
- A server with at least 2GB RAM and 10GB disk space
- Domain name (optional, for HTTPS/reverse proxy)
- Required API keys and credentials

## 🔐 Environment Variables

### Quick Setup

For production, copy the production template:
```bash
cp .env.production.example .env
```

For development:
```bash
cp .env.development.example .env
```

### Complete Environment Configuration

Create a `.env` file in the project root. All available variables:

```env
# ============================================================================
# DEPLOYMENT CONFIGURATION
# ============================================================================
NODE_ENV=production                          # 'production' or 'development'
BASE_DOMAIN=your-domain.com                  # Your base domain

# Public URLs (update with your actual domains/IPs)
ADMIN_PANEL_URL=https://admin.your-domain.com
LINK_PORTAL_URL=https://link.your-domain.com
MCP_PLANKA_URL=http://mcp-planka:3100       # Internal Docker network
MCP_RASTAR_URL=http://mcp-rastar:3101       # Internal Docker network

# ============================================================================
# TELEGRAM BOT (Required)
# ============================================================================
TELEGRAM_BOT_TOKEN=                          # From @BotFather
TELEGRAM_BOT_USERNAME=                       # Your bot's username

# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL=file:/app/data/rastar.db        # SQLite in Docker
# Or use PostgreSQL:
# DATABASE_URL=postgresql://user:password@postgres:5432/rastar

# ============================================================================
# SECURITY (Required)
# ============================================================================
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=

# Admin Panel
NEXTAUTH_URL=https://admin.your-domain.com   # Must match ADMIN_PANEL_URL
ADMIN_USERNAME=admin
ADMIN_PASSWORD=                              # Strong password!

# ============================================================================
# AI / OPENROUTER (Required)
# ============================================================================
OPENROUTER_API_KEY=                          # From https://openrouter.ai/keys
DEFAULT_AI_MODEL=anthropic/claude-3.5-sonnet

# ============================================================================
# MCP SERVERS
# ============================================================================
MCP_TRANSPORT=http                           # 'http' for production, 'stdio' for dev
MCP_PLANKA_PORT=3100
MCP_RASTAR_PORT=3101

# ============================================================================
# PLANKA INTEGRATION (Required if using Planka)
# ============================================================================
PLANKA_SERVER_URL=https://planka.your-domain.com

# ============================================================================
# RASTAR API (Required)
# ============================================================================
RASTAR_API_URL=https://api.rastar.com
RASTAR_USERNAME=
RASTAR_PASSWORD=

# ============================================================================
# SERVICE PORTS (Optional - defaults shown)
# ============================================================================
TELEGRAM_BOT_PORT=3001
LINK_PORTAL_PORT=3002
ADMIN_PANEL_PORT=3000

# ============================================================================
# OPTIONAL CONFIGURATIONS
# ============================================================================
LOG_LEVEL=info                               # error, warn, info, debug
DEBUG=false
RATE_LIMIT_PER_MINUTE=60
```

### 🔑 Generating Secrets

```bash
# Generate encryption key (64 hex characters)
openssl rand -hex 32

# Generate NextAuth secret
openssl rand -base64 32

# Or generate both at once
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
```

## 🌐 Domain Configuration

### Option 1: Using Subdomains (Recommended)

Set these in your `.env`:
```env
BASE_DOMAIN=your-domain.com
ADMIN_PANEL_URL=https://admin.your-domain.com
LINK_PORTAL_URL=https://link.your-domain.com

# MCP servers (internal only, not exposed)
MCP_PLANKA_URL=http://mcp-planka:3100
MCP_RASTAR_URL=http://mcp-rastar:3101
```

DNS Records needed:
```
A     admin.your-domain.com    →  your-server-ip
A     link.your-domain.com     →  your-server-ip
```

### Option 2: Using Different Ports

```env
BASE_DOMAIN=your-domain.com
ADMIN_PANEL_URL=https://your-domain.com:3000
LINK_PORTAL_URL=https://your-domain.com:3002
```

### Option 3: Using IP Address (Development/Testing)

```env
ADMIN_PANEL_URL=http://123.45.67.89:3000
LINK_PORTAL_URL=http://123.45.67.89:3002
```

## 📦 Service URLs

After deployment, your services will be available at:

| Service | Internal Port | External Access | Purpose |
|---------|--------------|-----------------|---------|
| Admin Panel | 3000 | `ADMIN_PANEL_URL` | User management, config |
| Link Portal | 3002 | `LINK_PORTAL_URL` | OAuth linking |
| Telegram Bot | 3001 | Not exposed | Bot server |
| MCP Planka | 3100 | Not exposed* | Planka API tools |
| MCP Rastar | 3101 | Not exposed* | Rastar API tools |

*MCP servers can be exposed if you want to use them from other projects

## 🚀 Deployment Steps

### Option 1: Simple VPS Deployment

#### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/yourusername/rastar-telegram-bot.git
cd rastar-telegram-bot

# Create .env file
nano .env
# (Paste your environment variables)
```

#### 2. Build and Start Services

```bash
# Build all images
docker compose build

# Start services in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Check service status
docker compose ps
```

#### 3. Verify Deployment

```bash
# Check telegram-bot logs
docker compose logs telegram-bot

# Check link-portal health
curl http://localhost:3002/health

# Check admin-panel health
curl http://localhost:3000/api/health
```

### Option 2: Production with Reverse Proxy (Recommended)

#### 1. Setup Nginx/Caddy

**Using Caddy (Easier, Auto-HTTPS):**

Create `Caddyfile`:

```caddy
# Admin Panel
admin.your-domain.com {
    reverse_proxy localhost:3000
}

# Link Portal
link.your-domain.com {
    reverse_proxy localhost:3002
}
```

Start Caddy:
```bash
caddy run
```

**Using Nginx:**

```nginx
# /etc/nginx/sites-available/rastar

# Admin Panel
server {
    listen 80;
    server_name admin.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Link Portal
server {
    listen 80;
    server_name link.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and setup SSL with Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/rastar /etc/nginx/sites-enabled/
sudo certbot --nginx -d admin.your-domain.com -d link.your-domain.com
sudo systemctl reload nginx
```

## 🔄 Updates and Maintenance

### Update Services

```bash
# Pull latest code
git pull

# Rebuild and restart services
docker compose build
docker compose up -d

# Or rebuild specific service
docker compose build telegram-bot
docker compose up -d telegram-bot
```

### Database Backups

```bash
# Backup database
docker compose exec telegram-bot tar czf - /app/data/rastar.db > backup-$(date +%Y%m%d).tar.gz

# Restore database (with services stopped)
docker compose down
tar xzf backup-20251223.tar.gz -C ./data/
docker compose up -d
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f telegram-bot

# Last 100 lines
docker compose logs --tail=100 telegram-bot
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart telegram-bot
```

## 📊 Monitoring

### Health Checks

All services have built-in health checks:

```bash
# Check container health
docker compose ps

# Manual health check
curl http://localhost:3002/health
curl http://localhost:3000/api/health
```

### Resource Usage

```bash
# Check container resources
docker stats

# Check specific container
docker stats rastar-telegram-bot
```

### Logs Rotation

Configure Docker logging driver in `docker-compose.yml`:

```yaml
services:
  telegram-bot:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🔒 Security Best Practices

1. **Use Strong Secrets**: Generate cryptographically secure keys
2. **Limit Port Exposure**: Only expose admin-panel and link-portal ports
3. **Regular Updates**: Keep Docker images and dependencies updated
4. **Database Backups**: Automate daily backups
5. **Use HTTPS**: Always use SSL/TLS in production
6. **Monitor Logs**: Set up log monitoring and alerts
7. **Firewall Rules**: Configure UFW/iptables to restrict access

### Setup Firewall (UFW)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if using reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny direct access to application ports from outside
sudo ufw deny 3000/tcp
sudo ufw deny 3002/tcp

# Enable firewall
sudo ufw enable
```

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs for errors
docker compose logs telegram-bot

# Check environment variables
docker compose exec telegram-bot env

# Validate .env file
cat .env | grep -v '^#' | grep -v '^$'
```

### Database Issues

```bash
# Check database permissions
docker compose exec telegram-bot ls -la /app/data/

# Run migrations manually
docker compose exec telegram-bot npx prisma migrate deploy --schema=./packages/shared/prisma/schema.prisma
```

### Network Issues

```bash
# Check network connectivity
docker network ls
docker network inspect rastar-network

# Test inter-service communication
docker compose exec telegram-bot ping link-portal
```

### Build Failures

```bash
# Clean build
docker compose build --no-cache

# Check disk space
df -h

# Prune unused Docker resources
docker system prune -a
```

## 📈 Scaling Considerations

### Horizontal Scaling

For multiple telegram-bot instances:

```yaml
services:
  telegram-bot:
    deploy:
      replicas: 3
```

**Note**: Telegram Bot API doesn't support multiple webhook endpoints. Use polling mode or implement a message queue.

### External Database

For production at scale, migrate from SQLite to PostgreSQL:

1. Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://user:password@postgres:5432/rastar
```

2. Add PostgreSQL service to `docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: rastar
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

## 🔧 Advanced Configuration

### Custom Build Args

```bash
# Build with specific Node version
docker compose build --build-arg NODE_VERSION=22.12

# Build with custom registry
docker compose build --build-arg NPM_REGISTRY=https://registry.npmjs.org/
```

### Production Environment File

Create separate `.env.production`:

```bash
# Use production env file
docker compose --env-file .env.production up -d
```

## 📞 Support

- Check logs: `docker compose logs -f`
- GitHub Issues: [Report a bug](https://github.com/yourusername/rastar-telegram-bot/issues)
- Documentation: See README.md files in each package

## ✅ Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] Services are running (`docker compose ps`)
- [ ] Health checks pass
- [ ] Database migrations completed
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring configured
- [ ] Bot responds in Telegram
- [ ] Admin panel accessible
- [ ] Link portal working
