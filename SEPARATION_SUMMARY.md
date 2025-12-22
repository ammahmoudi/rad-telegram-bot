# Rastar and Planka Separation Summary

## ✅ Completed Changes

### 1. **Separate MCP Packages**
- ✅ `packages/mcp-planka/` - Planka MCP server (existing)
- ✅ `packages/mcp-rastar/` - Rastar MCP server (new)
- Each has its own tools, API client, and handlers
- Independent deployment and testing

### 2. **Separate Tool Executors**
- ✅ `apps/telegram-bot/src/planka-tools.ts` - Handles Planka tool execution
- ✅ `apps/telegram-bot/src/rastar-tools.ts` - Handles Rastar tool execution
- Each manages its own authentication and error handling
- Clear separation of concerns

### 3. **Unified Tool Management**
- ✅ `apps/telegram-bot/src/services/tools-manager.ts`
  - Combines tools from both MCP servers
  - Filters based on user authentication status
  - Removes internal parameters before sending to AI

### 4. **Smart Tool Routing**
- ✅ `apps/telegram-bot/src/handlers/ai-message.ts`
  - Routes tools based on name prefix:
    - `rastar.*` → `executeRastarTool()`
    - `planka.*` → `executeMcpTool()`
  - No coupling between services

### 5. **Separate Commands**
- ✅ Planka commands:
  - `/link_planka` - OAuth link portal
  - `/planka_status` - Connection status
  - `/planka_unlink` - Disconnect
  
- ✅ Rastar commands:
  - `/rastar_status` - Connection status
  - `/rastar_unlink` - Disconnect
  - Login via AI chat (no separate link command)

### 6. **Database Separation**
- ✅ `PlankaToken` model - Stores Planka credentials
- ✅ `RastarToken` model - Stores Rastar credentials
- Separate CRUD operations in `packages/shared/src/db.ts`
- Independent token refresh logic

### 7. **Independent Authentication**
- ✅ **Planka**: OAuth flow via link portal
- ✅ **Rastar**: Direct login via AI chat
- Each service maintains its own tokens
- No cross-dependencies

## File Structure

```
packages/
├── mcp-planka/          # Planka MCP Server
│   ├── src/
│   │   ├── api/         # Planka API client
│   │   ├── tools/       # Planka tools
│   │   └── index.ts     # MCP server
│   └── package.json
│
├── mcp-rastar/          # Rastar MCP Server
│   ├── src/
│   │   ├── api/         # Rastar API client
│   │   ├── tools/       # Rastar tools
│   │   └── index.ts     # MCP server
│   └── package.json
│
├── shared/              # Shared utilities
│   ├── src/
│   │   ├── db.ts        # Both PlankaToken and RastarToken CRUD
│   │   ├── rastar.ts    # Rastar-specific helpers
│   │   └── ...
│   └── prisma/
│       └── schema.prisma # Both models defined
│
└── telegram-bot/
    └── src/
        ├── planka-tools.ts      # Planka executor
        ├── rastar-tools.ts      # Rastar executor
        ├── mcp-client.ts        # Connects to both MCPs
        ├── services/
        │   └── tools-manager.ts # Unified tool management
        └── handlers/
            ├── commands.ts      # All commands (separated by service)
            └── ai-message.ts    # Routes to correct executor
```

## Benefits of This Architecture

### 🎯 **Separation of Concerns**
- Each service has its own:
  - API client
  - Tool definitions
  - Execution logic
  - Authentication flow

### 🔧 **Easy Maintenance**
- Change Planka without touching Rastar
- Add Rastar features independently
- Clear file organization

### 🚀 **Scalability**
- Easy to add new services (e.g., `mcp-hr`, `mcp-finance`)
- Each MCP server can be deployed independently
- Telegram bot orchestrates multiple services

### 🧪 **Testability**
- Test each MCP server standalone
- Mock individual services
- No coupling between tests

### 📝 **Code Clarity**
- Developer knows exactly where to look:
  - Planka bug? Check `planka-tools.ts` and `mcp-planka/`
  - Rastar bug? Check `rastar-tools.ts` and `mcp-rastar/`
  - Routing issue? Check `ai-message.ts`

## How Tool Routing Works

```typescript
// In ai-message.ts
for (const toolCall of response.toolCalls) {
  const mcpToolName = toolCall.name.replace(/_/g, '.');
  
  // Route based on prefix
  let toolResult;
  if (mcpToolName.startsWith('rastar.')) {
    toolResult = await executeRastarTool(
      telegramUserId,
      mcpToolName,
      JSON.parse(toolCall.arguments)
    );
  } else {
    toolResult = await executeMcpTool(
      telegramUserId,
      mcpToolName,
      JSON.parse(toolCall.arguments)
    );
  }
}
```

## Adding a New Service

To add a third service (e.g., HR system):

1. **Create MCP package**: `packages/mcp-hr/`
2. **Define tools**: `packages/mcp-hr/src/tools/`
3. **Create executor**: `apps/telegram-bot/src/hr-tools.ts`
4. **Update routing**: Add to `ai-message.ts`:
   ```typescript
   if (mcpToolName.startsWith('hr.')) {
     toolResult = await executeHrTool(...);
   }
   ```
5. **Add to tools-manager**: Include in tool filtering
6. **Add commands**: `/hr_status`, `/hr_unlink`, etc.

## Environment Variables

Each service has its own configuration:

```env
# Planka
PLANKA_DEFAULT_BASE_URL=...

# Rastar
RASTAR_BASE_URL=...
RASTAR_API_KEY=...

# (Future) HR System
HR_API_URL=...
HR_CLIENT_ID=...
```

## Summary

✅ **Complete separation** of Planka and Rastar code
✅ **Clear file organization** - easy to navigate
✅ **Independent development** - work on one without affecting the other
✅ **Unified user experience** - seamless integration in Telegram bot
✅ **Scalable architecture** - easy to add more services
