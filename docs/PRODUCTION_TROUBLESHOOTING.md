# Production Deployment Troubleshooting

## Common Production Issues and Solutions

### Issue 1: Grammy 409 Conflict - Multiple Bot Instances

#### Error Message
```
GrammyError: Conflict: terminated by other getUpdates request
```

#### Cause
Multiple instances of your bot are trying to use long polling from Telegram simultaneously. Telegram only allows **one active long polling connection** per bot token.

#### Symptoms
- Bot logs show 409 errors repeatedly
- Bot starts but immediately fails
- Retries keep failing with the same error

#### Solutions

**1. Stop Old Deployments on Dokploy**
- Go to Dokploy dashboard
- Find the `telegram-bot` service
- Check if there are multiple deployments/instances running
- Stop or delete old deployments before starting new one

**2. Check for Local Development Instances**
- Make sure you don't have `npm run dev` running locally
- Check if you have any terminal windows with the bot running
- Stop all local instances before deploying to production

**3. Wait for Previous Instance to Stop**
- The bot now includes automatic retry with longer delays for 409 errors
- It will wait up to 10 seconds between retries for the old instance to stop
- Monitor the logs to see when it successfully connects

**4. Force Stop via Telegram**
```bash
# Use curl or visit in browser to force stop all active connections
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook?drop_pending_updates=true"
```

#### Prevention
- Ensure proper graceful shutdown on Dokploy
- Use Dokploy's "Stop" button before deploying new version
- Set deployment strategy to "stop old before starting new"

---

### Issue 2: MCP Service Not Found (ENOTFOUND)

#### Error Message
```
Error: getaddrinfo ENOTFOUND mcp-time
```

#### Cause
The telegram-bot service can't resolve the DNS hostname of the MCP service. This happens when:
- The MCP service isn't deployed yet
- The service name doesn't match
- Services aren't on the same Docker network

#### Solutions

**1. MCP Time is Now Optional**
The bot will now start even if MCP Time isn't available. You'll see:
```
[MCP] Failed to connect to Time MCP server (optional)
[MCP] Bot will continue without Time tools
```

**2. Deploy MCP Time Service**
If you want to use Time tools:
- Deploy the `mcp-time` service on Dokploy
- Use the configuration from [.env.dokploy.mcp-time](../.env.dokploy.mcp-time)
- Ensure it's in the same Docker network as telegram-bot

**3. Check Service Names**
Verify that your Dokploy service names match:
- `mcp-planka` (required)
- `mcp-rastar` (required)
- `mcp-time` (optional)

**4. Verify Network Configuration**
- All services must be in the same Dokploy application
- They should automatically be on the same Docker network
- Check Dokploy network settings if services can't communicate

---

### Issue 3: Prisma Provider Mismatch

#### Error Message
```
Error: P1013
The provided database string is invalid. must start with the protocol `file:`.
```

#### Cause
Prisma schema was set to SQLite but DATABASE_URL is PostgreSQL.

#### Solution
✅ **Already fixed!** The schema has been updated to use PostgreSQL.

After redeploying, you should see:
```
Datasource "db": PostgreSQL database "rastar" at "rastaarchat-postgresql-ddvxsa:5432"
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Stop any running local development instances
- [ ] Stop old deployments on Dokploy
- [ ] Ensure all required environment variables are set
- [ ] Verify DATABASE_URL points to PostgreSQL
- [ ] Check that all MCP services are deployed (except mcp-time which is optional)
- [ ] Monitor logs during startup for any errors

## Monitoring Deployment

Watch the logs for successful startup:
```
✅ Connected successfully as @rad_rastar_bot
🚀 Starting bot with Grammy runner...
✨ Modern Grammy bot started successfully!
🎯 Ready to accept messages!
```

## Emergency Commands

**Stop bot immediately:**
```bash
# Delete webhook and drop pending updates
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook?drop_pending_updates=true"
```

**Check bot status:**
```bash
curl "https://api.telegram.org/bot<TOKEN>/getMe"
```

**Check webhook status:**
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## Need Help?

If issues persist:
1. Check Dokploy service logs for all services
2. Verify environment variables are correctly set
3. Ensure Docker network connectivity between services
4. Try deploying services one at a time to isolate issues
