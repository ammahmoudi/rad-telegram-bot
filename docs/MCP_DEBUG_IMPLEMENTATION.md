# MCP Tool Logging & Reasoning Display Control

## Overview
This implementation adds debugging capabilities for MCP tool calls and gives admins control over displaying AI reasoning to users.

## Features Implemented

### 1. MCP Tool Call Logging
- **Database Table**: `McpToolLog` stores all MCP tool calls with:
  - Input arguments (JSON)
  - Output content
  - Success/failure status
  - Error messages
  - Execution time in milliseconds
  - Telegram user ID
  - MCP server name (planka, rastar, time)
  - Tool name
  - Timestamp

- **Functions Added** (in `packages/shared/src/db.ts`):
  - `logMcpToolCall()` - Log a tool call
  - `getMcpToolLogs()` - Get logs for a specific user
  - `getAllMcpToolLogs()` - Get all logs (admin view)
  - `deleteOldMcpToolLogs()` - Cleanup old logs

- **Automatic Logging**: All MCP tool calls are automatically logged when enabled
  - Planka tools (via `executeMcpTool`)
  - Rastar tools (via `executeRastarTool`)
  - Time tools (via `executeTimeTool`)

### 2. Admin Panel Controls

Two new toggles in the admin panel Settings page:

#### 🔍 Enable MCP Tool Call Logging
- **Config Key**: `MCP_TOOL_LOGGING_ENABLED`
- **Default**: `false` (disabled)
- **When Enabled**: All MCP tool calls are logged to database
- **Use Case**: Debug tool issues, monitor usage, analyze performance

#### 🧠 Show AI Reasoning to Users
- **Config Key**: `SHOW_REASONING_TO_USERS`
- **Default**: `true` (enabled)
- **When Enabled**: Users see:
  - Full reasoning text in blockquotes
  - List of tools being used
  - Detailed progress updates
- **When Disabled**: Users only see:
  - "🤔 Thinking..." simple indicator
  - Final response without reasoning details
  - No tool usage history visible

### 3. Code Changes

#### Database Schema
```prisma
model McpToolLog {
  id              String  @id @default(cuid())
  telegramUserId  String
  mcpServer       String
  toolName        String
  inputArgs       String
  outputContent   String
  success         Boolean @default(true)
  errorMessage    String?
  executionTimeMs Int?
  createdAt       BigInt
  
  @@index([telegramUserId])
  @@index([mcpServer])
  @@index([toolName])
  @@index([createdAt])
}
```

#### Modified Files
1. **packages/shared/prisma/schema.prisma** - Added McpToolLog model
2. **packages/shared/src/db.ts** - Added logging functions
3. **apps/telegram-bot/src/mcp-client.ts** - Intercept tool calls and log them
4. **apps/telegram-bot/src/planka-tools.ts** - Pass telegramUserId for logging
5. **apps/telegram-bot/src/rastar-tools.ts** - Pass telegramUserId for logging
6. **apps/telegram-bot/src/time-tools.ts** - Pass telegramUserId for logging
7. **apps/telegram-bot/src/handlers/ai-tool-executor.ts** - Pass user ID to time tools
8. **apps/telegram-bot/src/handlers/message-streaming.ts** - Respect reasoning display setting
9. **apps/admin-panel/src/components/SettingsForm.tsx** - Added new toggle controls
10. **apps/admin-panel/src/app/page.tsx** - Pass new config values
11. **apps/admin-panel/src/app/api/update-config/route.ts** - Save new settings

## Usage

### For Admins

1. **Enable Tool Logging**:
   - Go to Admin Panel → Settings
   - Check "🔍 Enable MCP Tool Call Logging"
   - Click "Save Settings"
   - All subsequent tool calls will be logged

2. **Control Reasoning Display**:
   - Go to Admin Panel → Settings
   - Check/uncheck "🧠 Show AI Reasoning to Users"
   - Click "Save Settings"
   - Users will immediately see the new behavior

### For Developers

#### Query Tool Logs
```typescript
import { getMcpToolLogs, getAllMcpToolLogs } from '@rad/shared';

// Get logs for specific user
const userLogs = await getMcpToolLogs('123456789', 50);

// Get all logs (admin)
const allLogs = await getAllMcpToolLogs(100);
```

#### Check Settings in Code
```typescript
import { getSystemConfig } from '@rad/shared';

// Check if logging is enabled
const loggingEnabled = await getSystemConfig('MCP_TOOL_LOGGING_ENABLED');

// Check if reasoning should be shown
const showReasoning = await getSystemConfig('SHOW_REASONING_TO_USERS');
```

## Database Migration

Migration applied: `20260106063036_add_mcp_tool_logging`

To apply to production:
```bash
cd packages/shared
DATABASE_URL="file:../../data/rastar.db" npx prisma migrate deploy
```

## Performance Considerations

1. **Logging Overhead**: Minimal (~5-10ms per log write)
2. **Storage**: Each log entry ~1-5KB depending on tool output
3. **Cleanup**: Use `deleteOldMcpToolLogs(30)` to remove logs older than 30 days
4. **Indexing**: Logs are indexed by user, server, tool name, and date for fast queries

## Future Enhancements

Potential additions:
- Admin UI to view tool logs
- Tool performance analytics dashboard
- Export logs to CSV/JSON
- Real-time tool call monitoring
- Alert on tool failures
- Tool usage statistics
