# Quick Reference: Rastar & Planka Separation

## When Working on Planka

### Files to Modify
- `packages/mcp-planka/src/api/*.ts` - API methods
- `packages/mcp-planka/src/tools/*.ts` - Tool definitions
- `apps/telegram-bot/src/planka-tools.ts` - Tool execution
- `apps/telegram-bot/src/handlers/commands.ts` - Planka commands

### Don't Touch
- ❌ `rastar-tools.ts`
- ❌ `packages/mcp-rastar/`
- ❌ `RastarToken` model

## When Working on Rastar

### Files to Modify
- `packages/mcp-rastar/src/api/*.ts` - API methods
- `packages/mcp-rastar/src/tools/*.ts` - Tool definitions
- `apps/telegram-bot/src/rastar-tools.ts` - Tool execution
- `apps/telegram-bot/src/handlers/commands.ts` - Rastar commands

### Don't Touch
- ❌ `planka-tools.ts`
- ❌ `packages/mcp-planka/`
- ❌ `PlankaToken` model

## Shared Files (Touch Carefully)

### `packages/shared/src/db.ts`
- Contains CRUD for both `PlankaToken` and `RastarToken`
- Keep functions separate and clearly named
- Don't mix Planka and Rastar logic

### `apps/telegram-bot/src/services/tools-manager.ts`
- Combines tools from both services
- Keep filtering logic clear and separate
- Update when adding new service

### `apps/telegram-bot/src/handlers/ai-message.ts`
- Routes tools to correct executor
- Add new routing for new services
- Keep routing logic simple: prefix-based

## Tool Naming Convention

```
planka.{category}.{action}
rastar.{category}.{action}
```

Examples:
- `planka.cards.list`
- `planka.tasks.create`
- `rastar.menu.list`
- `rastar.menu.select_item`

## Command Naming Convention

```
/{service}_{action}
```

Examples:
- `/planka_status`
- `/planka_unlink`
- `/rastar_status`
- `/rastar_unlink`

## Adding New Service

1. Create `packages/mcp-{service}/`
2. Create `apps/telegram-bot/src/{service}-tools.ts`
3. Update `ai-message.ts` routing
4. Update `tools-manager.ts` filtering
5. Add commands to `commands.ts`
6. Register commands in `index.ts`

## Testing Separation

Each service should work independently:

```bash
# Test Planka MCP standalone
cd packages/mcp-planka && npm run dev

# Test Rastar MCP standalone  
cd packages/mcp-rastar && npm run dev

# Test Telegram bot with both
cd apps/telegram-bot && npm run dev
```

## Build Order

```bash
# Always build in this order:
cd packages/shared && npm run build
cd packages/mcp-planka && npm run build
cd packages/mcp-rastar && npm run build
cd apps/telegram-bot && npm run build
```

## Key Principles

1. **One Service, One File**: Never mix Planka and Rastar in the same file
2. **Prefix-Based Routing**: Use tool name prefixes for routing
3. **Independent Auth**: Each service manages its own tokens
4. **Shared Utilities Only**: Only share truly generic code
5. **Clear Naming**: Service name in filename and function names
