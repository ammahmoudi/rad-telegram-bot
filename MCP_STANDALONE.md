# MCP Servers Standalone Deployment

Your MCP servers (`mcp-planka` and `mcp-rastar`) are now fully **standalone microservices** that can be accessed by multiple projects.

## 🎯 Architecture

```
┌─────────────────┐     HTTP/SSE      ┌─────────────────┐
│ Telegram Bot    │ ←────────────────→ │  mcp-planka     │
│                 │                    │  (Port 3100)    │
└─────────────────┘                    └─────────────────┘
         ↑                                      ↑
         │                                      │
         │         HTTP/SSE                     │
         │                                      │
         └──────────────────┐                   │
                            ↓                   │
                  ┌─────────────────┐          │
                  │  mcp-rastar     │          │
                  │  (Port 3101)    │          │
                  └─────────────────┘          │
                            ↑                   │
                            │                   │
                            └───────────────────┘
                        Shared Database Volume
```

## 🌐 Network Endpoints

### MCP Planka Server
- **Port**: 3100
- **Health Check**: `http://mcp-planka:3100/health`
- **SSE Endpoint**: `http://mcp-planka:3100/sse`
- **External**: `http://your-server-ip:3100`

### MCP Rastar Server
- **Port**: 3101
- **Health Check**: `http://mcp-rastar:3101/health`
- **SSE Endpoint**: `http://mcp-rastar:3101/sse`
- **External**: `http://your-server-ip:3101`

## 🚀 Deployment

### Start All Services
```bash
docker compose up -d
```

### Start Only MCP Servers
```bash
docker compose up -d mcp-planka mcp-rastar
```

### Check MCP Server Status
```bash
# View logs
docker compose logs -f mcp-planka
docker compose logs -f mcp-rastar

# Test health
curl http://localhost:3100/health
curl http://localhost:3101/health
```

## 🔌 Connect from Other Projects

### Option 1: HTTP/SSE Client (Recommended)

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// Connect to MCP Planka
const plankaTransport = new SSEClientTransport(
  new URL('http://your-server:3100/sse')
);

const plankaClient = new Client(
  { name: 'my-app', version: '1.0.0' },
  { capabilities: {} }
);

await plankaClient.connect(plankaTransport);

// List available tools
const tools = await plankaClient.listTools();

// Call a tool
const result = await plankaClient.callTool({
  name: 'planka_login',
  arguments: {
    email: 'user@example.com',
    password: 'password'
  }
});
```

### Option 2: Direct HTTP Requests

```bash
# Health check
curl http://your-server:3100/health

# Connect to SSE endpoint
curl -X POST http://your-server:3100/sse
```

### Option 3: From Docker Network

If your other project is also in Docker:

```yaml
services:
  your-app:
    environment:
      - MCP_PLANKA_URL=http://mcp-planka:3100/sse
      - MCP_RASTAR_URL=http://mcp-rastar:3101/sse
    networks:
      - rastar-network

networks:
  rastar-network:
    external: true  # Use existing network
```

## 🔐 Environment Variables

Add these to your `.env`:

```env
# MCP Server URLs (for telegram-bot)
MCP_PLANKA_URL=http://mcp-planka:3100/sse
MCP_RASTAR_URL=http://mcp-rastar:3101/sse

# MCP Server Config (for the MCP servers themselves)
PLANKA_SERVER_URL=https://your-planka-instance.com
RASTAR_API_URL=https://api.rastar.com
RASTAR_USERNAME=your_username
RASTAR_PASSWORD=your_password
```

## 📊 Features

### ✅ Standalone Operation
- Each MCP server runs independently
- Can be started/stopped without affecting other services
- Separate health checks and monitoring

### ✅ Multi-Client Support
- Multiple apps can connect simultaneously
- HTTP/SSE transport allows network access
- No stdio limitations

### ✅ Production Ready
- Health checks for automatic recovery
- Graceful shutdown handling
- Non-root user security
- Alpine Linux (minimal attack surface)

### ✅ Shared Data
- All services share the same database volume
- Consistent state across MCP servers
- Single source of truth

## 🔄 Updates

### Update MCP Servers Only
```bash
# Rebuild and restart MCP servers
docker compose build mcp-planka mcp-rastar
docker compose up -d mcp-planka mcp-rastar

# Or rebuild all
docker compose build
docker compose up -d
```

### Rolling Updates
```bash
# Update one at a time
docker compose up -d --no-deps --build mcp-planka
docker compose up -d --no-deps --build mcp-rastar
```

## 🐛 Troubleshooting

### MCP Server Won't Start

```bash
# Check logs
docker compose logs mcp-planka

# Check if port is available
netstat -an | grep 3100

# Restart service
docker compose restart mcp-planka
```

### Can't Connect from External App

```bash
# Test connectivity
curl http://your-server-ip:3100/health

# Check firewall
sudo ufw status

# Check Docker network
docker network inspect rastar-network
```

### Database Lock Issues

```bash
# Stop all services
docker compose down

# Start in order
docker compose up -d mcp-planka mcp-rastar
docker compose up -d link-portal
docker compose up -d telegram-bot admin-panel
```

## 📝 Development vs Production

### Development (stdio)
- Telegram bot spawns MCP servers as child processes
- Uses stdin/stdout for communication
- Easier debugging with direct console output

### Production (HTTP/SSE)
- MCP servers run as separate containers
- Network communication via HTTP/SSE
- Can be accessed by multiple clients
- Better for scaling and monitoring

The system automatically detects the environment:
- `NODE_ENV=production` → HTTP/SSE transport
- `NODE_ENV=development` → stdio transport

## 🎉 Benefits

1. **Reusability**: Use MCP servers from any project
2. **Scalability**: Scale MCP servers independently
3. **Isolation**: Failures don't affect other services
4. **Monitoring**: Individual health checks per service
5. **Updates**: Update MCP servers without touching bot code
6. **Multi-Client**: Multiple apps can use the same MCP server
