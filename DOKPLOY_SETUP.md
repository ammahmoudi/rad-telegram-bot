# Dokploy Deployment Setup

## Overview

This project uses **project-level environment variables** in Dokploy for shared configuration, with service-specific env files that reference those project variables.

## Setup Steps

### 1. Set Project-Level Variables

In Dokploy, go to your project **`rastaar-chat`** → **Settings** → **Environment Variables** and add all variables from [.env.production](.env.production).

### 2. Configure Each Service

For each service in Dokploy, copy the corresponding service env file content:

| Service | Dokploy Service Name | Env File to Copy |
|---------|---------------------|------------------|
| Admin Panel | `admin-panel` | [.env.dokploy.admin-panel](.env.dokploy.admin-panel) |
| Telegram Bot | `telegram-bot` | [.env.dokploy.telegram-bot](.env.dokploy.telegram-bot) |
| Link Portal | `link-portal` | [.env.dokploy.link-portal](.env.dokploy.link-portal) |
| MCP Planka | `mcp-planka` | [.env.dokploy.mcp-planka](.env.dokploy.mcp-planka) |
| MCP Rastar | `mcp-rastar` | [.env.dokploy.mcp-rastar](.env.dokploy.mcp-rastar) |
| MCP Time | `mcp-time` | [.env.dokploy.mcp-time](.env.dokploy.mcp-time) |

### 3. How It Works

**Project-level variables** are defined once at the project level:
```env
DATABASE_URL=postgresql://user:pass@host:5432/rastar
TELEGRAM_BOT_TOKEN=123456:ABC...
ENCRYPTION_KEY=abc123...
```

**Service-level variables** reference them using:
```env
DATABASE_URL=${{project.DATABASE_URL}}
TELEGRAM_BOT_TOKEN=${{project.TELEGRAM_BOT_TOKEN}}
ENCRYPTION_KEY=${{project.ENCRYPTION_KEY}}
```

### 4. Port Configuration

Each service has default ports set in their Dockerfile:
- Admin Panel: `3000`
- Telegram Bot: `3001`
- Link Portal: `3002`
- MCP Planka: `3100`
- MCP Rastar: `3101`
- MCP Time: `3102`

Dokploy handles external port mapping automatically. If you need to override the internal port, uncomment the `PORT` variable in the service env.

### 5. Security Configuration

**IMPORTANT:** For MCP servers to accept external requests, you **MUST** set `ALLOWED_HOSTS` at the project level:

```env
ALLOWED_HOSTS=rastar-mcp.rastar.dev,planka-mcp.rastar.dev,time-mcp.rastar.dev
```

This prevents DNS rebinding attacks while allowing your production domains.

### 6. Database Setup

After deploying all services, run migrations on any service (e.g., telegram-bot):

```bash
# In Dokploy terminal for telegram-bot service
npx prisma migrate deploy --schema=./packages/shared/prisma/schema.prisma
```

Or use the built-in migration in the Docker CMD (automatic on startup).

## Benefits of This Approach

✅ **Single source of truth** - Update project vars once, affects all services
✅ **Security** - Sensitive values stored only at project level
✅ **Flexibility** - Services can override specific vars if needed
✅ **Clarity** - Each service env file shows exactly what it needs
✅ **No duplication** - Shared values aren't repeated across services

## Troubleshooting

### Service can't connect to database
- Check that `DATABASE_URL` is set at project level
- Verify the service has `DATABASE_URL=${{project.DATABASE_URL}}` in its env

### MCP server returns "Invalid Host" error
- Ensure `ALLOWED_HOSTS` includes your production domain
- Format: `ALLOWED_HOSTS=rastar-mcp.rastar.dev,planka-mcp.rastar.dev,time-mcp.rastar.dev`
- Check that MCP service has `ALLOWED_HOSTS=${{project.ALLOWED_HOSTS}}`

### Port conflicts
- Dokploy manages external ports automatically
- Internal ports (3000-3102) should not conflict
- If needed, override with `PORT=XXXX` in service env

## Quick Reference

**Project:** rastaar-chat

**Variable Syntax:** `${{project.VARIABLE_NAME}}`

**Deployment Order:**
1. Set project-level variables
2. Deploy services with service-level env references
3. Run database migrations
4. Test each service endpoint
