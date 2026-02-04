# Rastar Link Portal Implementation

## Changes Made

### 1. **Link Portal** (`apps/link-portal/src/server.ts`)
Added secure Rastar authentication routes:

- **GET `/link/rastar`** - Link form page
- **POST `/link/rastar`** - Handles credentials & stores token

### 2. **Telegram Bot Commands** (`apps/telegram-bot/src/handlers/commands.ts`)
Added `/link_rastar` command:
- Generates secure one-time link with state parameter
- Link expires in 10 minutes
- Shows user instructions similar to `/link_planka`

### 3. **Command Registration** (`apps/telegram-bot/src/index.ts`)
Registered `link_rastar` command with bot

### 4. **Removed Natural Language Auth**
- Removed `rastar.auth.login` tool from MCP
- Updated tool handler to remove login case
- Updated tool filtering to hide all auth tools
- Updated rastar-tools.ts to always require /link_rastar

### 5. **Updated Status Messages**
All Rastar status/unlink messages now point to `/link_rastar` instead of natural language

## User Flow

### Linking Account:
1. User runs `/link_rastar` in Telegram
2. Bot generates secure link with unique state
3. User opens link in browser
4. User enters email & password on secure page
5. Link portal authenticates with Rastar API
6. Token stored encrypted in database
7. Bot notifies user of success

### Using Features:
1. User asks "what's for lunch today?"
2. Bot has Rastar tools available (menu.list, etc.)
3. Bot calls tools with auto-injected credentials
4. User gets response without re-authenticating

## Security Improvements

✅ **No credentials in chat** - Email/password never sent via Telegram  
✅ **One-time links** - State parameter consumed after use  
✅ **Time-limited** - Links expire in 10 minutes  
✅ **Encrypted storage** - Tokens encrypted at rest  
✅ **Auto-refresh** - Tokens refreshed transparently  
✅ **Separate from Planka** - Independent auth systems

## Commands

- `/link_rastar` - Securely link Rastar account
- `/rastar_status` - Check connection & token expiry
- `/rastar_unlink` - Disconnect Rastar account

## Consistency with Planka

Both services now use identical patterns:
- ✅ Secure link portal for authentication
- ✅ One-time state parameters
- ✅ Time-limited links
- ✅ No credentials in chat
- ✅ Encrypted token storage
- ✅ Status/unlink commands

## Testing

Build successful for:
- ✅ `packages/mcp-rastar`
- ✅ `apps/telegram-bot`  
- ✅ `apps/link-portal`

Ready for deployment!
