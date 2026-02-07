# Rastar Integration Guide

## Overview

The Rastar integration provides access to company services, starting with the food lunch menu system. Users can view available menus, make selections, and manage their food reservations through the Telegram bot.

## Features

### Authentication
- **Login**: Authenticate with Rastar using email and password
- **Token Management**: Automatic token refresh for seamless access
- **Secure Storage**: Tokens are encrypted at rest in the database

### Food Menu Management
- **View Menus**: Browse available lunch options by date
- **Select Items**: Choose your preferred meal for any day
- **Manage Selections**: View and modify your existing food selections
- **Delete Reservations**: Cancel unwanted reservations

## Setup

### Environment Variables

Add these to your `.env` file:

```env
# Rastar API Configuration
RASTAR_SUPABASE_URL=https://my-api.rastar.company
RASTAR_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5NjE0NDMwLCJleHAiOjE5MjcyOTQ0MzB9.LRItEoNveDk6rALZlcDpLrN_t7YX1othdPwgtIatVZ0
```

### Database

The integration uses a new `RastarToken` model in Prisma:

```prisma
model RastarToken {
  telegramUserId  String @id
  accessTokenEnc  String
  refreshTokenEnc String
  expiresAt       BigInt
  userId          String  // Rastar user ID
  email           String
  updatedAt       BigInt
}
```

Migration has been created automatically: `20251222141918_add_rastar_token`

## Usage

### Telegram Bot Commands

Users interact with Rastar through natural language in the Telegram bot:

#### Login
```
User: "Login to Rastar with email user@example.com and password mypassword"
Bot: "Successfully logged in as user@example.com! You can now use Rastar features."
```

#### View Menu
```
User: "What's for lunch today?"
Bot: Shows available menu items with descriptions

User: "Show me next week's lunch menu"
Bot: Lists all menu items organized by date
```

#### Select Food
```
User: "Select Ghormeh Sabzi for tomorrow"
Bot: "Successfully selected Ghormeh Sabzi for Dec 24!"
```

#### View Selections
```
User: "What did I order for lunch?"
Bot: Lists all your food selections by date
```

#### Cancel Selection
```
User: "Cancel my lunch for tomorrow"
Bot: "Cancelled your selection for Dec 24"
```

## MCP Tools

The integration provides the following MCP tools:

### Authentication Tools

#### `rastar.auth.login`
Login to Rastar with email and password.

**Parameters:**
- `email` (string, required): User email address
- `password` (string, required): User password

**Returns:** Token response with access token, refresh token, and user info

#### `rastar.auth.refresh`
Refresh access token using refresh token (handled automatically).

**Parameters:**
- `refreshToken` (string, required): Refresh token from previous login

**Returns:** New token response

### Menu Tools

#### `rastar.menu.list`
Get the available food menu schedule.

**Parameters:**
- `accessToken` (string, auto-injected): Rastar access token

**Returns:** Array of menu items with dates and descriptions

#### `rastar.menu.get_selections`
Get user's food menu selections.

**Parameters:**
- `accessToken` (string, auto-injected): Rastar access token
- `userId` (string, auto-injected): User ID

**Returns:** Array of user's menu selections

#### `rastar.menu.select_item`
Select a food item from the menu.

**Parameters:**
- `accessToken` (string, auto-injected): Rastar access token
- `userId` (string, auto-injected): User ID
- `menuScheduleId` (string, required): Menu schedule ID to select

**Returns:** Created selection

#### `rastar.menu.delete_selection`
Delete a food menu selection.

**Parameters:**
- `accessToken` (string, auto-injected): Rastar access token
- `selectionId` (string, required): Selection ID to delete

**Returns:** Success confirmation

## Architecture

### Package Structure

```
packages/mcp-rastar/
├── src/
│   ├── api/
│   │   ├── auth.ts          # Authentication API calls
│   │   ├── menu.ts          # Menu management API calls
│   │   └── client.ts        # HTTP client with API key injection
│   ├── tools/
│   │   ├── auth.tools.ts    # Auth tool definitions
│   │   ├── menu.tools.ts    # Menu tool definitions
│   │   └── tool-handlers.ts # Tool execution logic
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   └── index.ts             # MCP server entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Integration Points

1. **MCP Server**: Standalone MCP server in `packages/mcp-rastar`
2. **Shared Package**: Token management and helper functions in `packages/shared/src/rastar.ts`
3. **Database**: Token storage in SQLite via Prisma
4. **Telegram Bot**: Tool routing and execution in `apps/telegram-bot/src/rastar-tools.ts`

### Security

- **Encrypted Storage**: Access and refresh tokens are encrypted using AES-256-GCM
- **Auto-Refresh**: Tokens are automatically refreshed before expiration
- **No Password Storage**: Only tokens are stored; passwords are never persisted
- **API Key Protection**: API key is injected server-side, never exposed to users

## API Endpoints

The integration uses Supabase PostgREST API:

### Authentication
- `POST /auth/v1/token?grant_type=password` - Login with email/password
- `POST /auth/v1/token?grant_type=refresh_token` - Refresh access token

### Menu Management
- `GET /rest/v1/menu_schedule` - Get menu schedule
- `GET /rest/v1/user_menu_selections` - Get user selections
- `POST /rest/v1/user_menu_selections` - Create selection
- `DELETE /rest/v1/user_menu_selections` - Delete selection

All API calls include:
- `apikey` header for API authentication
- `Authorization: Bearer <token>` header for user authentication
- Supabase-style query parameters for filtering and embedding

## Development

### Building

```bash
# Build all packages
npm run build

# Build specific package
cd packages/mcp-rastar
npm run build
```

### Testing

The MCP server can be tested independently:

```bash
cd packages/mcp-rastar
npm run dev
```

### Adding New Features

To add new Rastar features:

1. Add API methods in `packages/mcp-rastar/src/api/`
2. Define tools in `packages/mcp-rastar/src/tools/`
3. Add handlers in `tool-handlers.ts`
4. Update system prompt in `apps/telegram-bot/src/config/system-prompt.ts`

## Troubleshooting

### Token Issues
If users encounter authentication errors:
1. Check token expiration: Tokens are automatically refreshed
2. Verify API key is correct in environment variables
3. Ask user to login again if refresh fails

### Menu Not Loading
- Verify RASTAR_BASE_URL is correct
- Check API key permissions
- Ensure user is authenticated

### Tool Not Found
- Verify MCP server is running: Check logs for "Connected to Rastar MCP server"
- Rebuild packages after changes: `npm run build`
- Check tool name format: Should be `rastar_menu_list` (underscores, not dots)

## Future Enhancements

Potential additions to the Rastar integration:
- Company announcements and news
- Leave management
- Time tracking
- Employee directory
- Office reservation system
- Transportation scheduling
