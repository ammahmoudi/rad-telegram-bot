# Environment Variables Cleanup - Summary

## Changes Made

### 1. Variable Renaming
Renamed all `THIRD_PARTY_*` variables to `RASTAR_SUPABASE_*` for better clarity:

**Old Names** → **New Names**:
- `THIRD_PARTY_BASE_URL` → `RASTAR_SUPABASE_URL`
- `THIRD_PARTY_API_KEY` → `RASTAR_SUPABASE_ANON_KEY`
- `THIRD_PARTY_TOKEN_PATH` → `RASTAR_SUPABASE_AUTH_PATH`
- `THIRD_PARTY_API_KEY_HEADER` → `RASTAR_SUPABASE_KEY_HEADER`

**Removed Variables**:
- `THIRD_PARTY_API_KEY_BEARER_FOR_AUTH` - Not used
- `RASTAR_USERNAME` - Users authenticate individually via bot
- `RASTAR_PASSWORD` - Users authenticate individually via bot
- `RASTAR_API_URL` - Replaced by `RASTAR_SUPABASE_URL`
- `RASTAR_API_KEY` - Replaced by `RASTAR_SUPABASE_ANON_KEY`

### 2. Files Updated

#### Environment Files
- ✅ `.env` - Clean version with new variable names
- ✅ `.env.local` - Updated for local development
- ✅ `.env.example` - Updated template
- ✅ `.env.production.example` - Updated production template

#### Code Files
- ✅ `packages/mcp-rastar/src/api/client.ts` - Updated with backward compatibility
- ✅ `packages/mcp-rastar/src/api/auth.ts` - Updated with backward compatibility
- ✅ `apps/link-portal/src/server.ts` - Updated with backward compatibility

#### Configuration Files
- ✅ `docker-compose.yml` - Removed unused variables, added new RASTAR_SUPABASE_* variables

### 3. Backward Compatibility

All code changes include backward compatibility:
```typescript
const RASTAR_SUPABASE_URL = 
  process.env.RASTAR_SUPABASE_URL || 
  process.env.THIRD_PARTY_BASE_URL || 
  'https://my-api.rastar.company';
```

This allows existing deployments to continue working while migrating to new variable names.

### 4. Architecture

**Rastar Integration** uses Supabase backend:
- URL: `https://my-api.rastar.company`
- Authentication: Individual user authentication via `/link_rastar` command in Telegram bot
- API Key: Public anon key for client requests
- User tokens: Stored encrypted in PostgreSQL database

**Why No Username/Password in ENV**:
- Each user authenticates individually with their own my.rastar.company credentials
- User tokens are stored encrypted in the database per user
- No shared credentials needed in environment variables

### 5. Migration Path

For existing deployments:
1. Update environment files with new `RASTAR_SUPABASE_*` variables
2. Old `THIRD_PARTY_*` variables will continue to work (backward compatibility)
3. Remove old `THIRD_PARTY_*` variables when ready
4. Remove `RASTAR_USERNAME` and `RASTAR_PASSWORD` (not used)

## Testing

After updating, verify:
```bash
# Check environment variables are loaded
docker compose config

# Rebuild containers
docker compose build

# Restart services
docker compose up -d

# Check logs
docker compose logs -f telegram-bot
docker compose logs -f mcp-rastar
docker compose logs -f link-portal
```

## Documentation Updated
- See `ENV_FILES_GUIDE.md` for detailed environment file documentation
- See `ENV_CONFIGURATION.md` for configuration guidelines
