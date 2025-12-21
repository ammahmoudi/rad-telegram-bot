# 📚 MCP Documentation Resource

## Overview

The MCP Planka server now includes a built-in documentation resource that provides comprehensive usage examples and guidance for all capabilities.

## Access the Documentation

### Via MCP Resource

```
planka://docs/examples
```

This resource returns a complete markdown guide covering:
- ✅ Authentication setup
- ✅ All 40+ tools with examples
- ✅ All 5 resources with usage patterns
- ✅ All 5 workflow prompts
- ✅ Common workflows and best practices
- ✅ Error handling guide
- ✅ Integration examples

### No Authentication Required

Unlike other resources, the documentation resource does **not** require `plankaBaseUrl` or `plankaToken` parameters - it's publicly accessible.

## Example Usage

### From Claude Desktop

```
Read resource: planka://docs/examples
```

### From Code

```typescript
const manager = getMcpManager();
const result = await manager.readResource('planka', 'planka://docs/examples');
```

### From MCP Inspector

```bash
# Start the MCP inspector
npx @modelcontextprotocol/inspector npx tsx packages/mcp-planka/src/index.ts

# Then in the inspector UI, navigate to Resources and select:
# "MCP Usage Examples & Documentation"
```

## What's Included

The documentation resource provides:

### 1. Authentication Guide
- How to get your Planka token
- Required parameters for all operations
- Connection testing with `auth.status`

### 2. Complete Tool Reference (40+ Tools)
Organized by category:
- **Authentication Tools** (1 tool)
- **Project Tools** (5 tools) - create, list, update, delete, getManagers
- **Board Tools** (4 tools) - create, list, update, delete
- **List Tools** (4 tools) - create, update, sort, delete
- **Card Tools** (7 tools) - create, get, update, move, duplicate, delete, listByBoard
- **Task Tools** (4 tools) - create, update, toggle, delete
- **Label Tools** (4 tools) - create, update, addToCard, removeFromCard
- **Member Tools** (4 tools) - add, remove, addToCard, removeFromCard
- **Comment Tools** (3 tools) - create, update, delete
- **User Tools** (2 tools) - getCurrent, listAll
- **Attachment Tools** (3 tools) - upload, update, delete

### 3. Resource Patterns (5 Resources)
- `planka://projects` - All projects
- `planka://projects/{id}` - Project details
- `planka://boards/{id}` - Board details
- `planka://users/{id}/assigned-cards` - User's cards
- `planka://projects/{id}/cards` - Project cards

### 4. Workflow Prompts (5 Prompts)
- `daily-standup` - Generate standup reports
- `create-sprint-card` - Sprint card templates
- `weekly-report` - Weekly status reports
- `project-overview` - Project status overview
- `board-health-check` - Board health analysis

### 5. Example Workflows
Step-by-step guides for:
- Creating a complete sprint board
- Managing card lifecycle
- Setting up projects
- Common task patterns

### 6. Error Handling
- Common errors and solutions
- Authentication troubleshooting
- Parameter validation

### 7. Best Practices
- When to use resources vs tools
- Bulk operation strategies
- Position management
- Rate limit handling

## Benefits

### For AI Assistants (Claude, etc.)
- Quick reference for available capabilities
- Example JSON payloads for each tool
- Common workflow patterns
- No need to guess parameter names

### For Developers
- Complete API reference
- Integration examples
- Troubleshooting guide
- Best practices

### For Users
- Understanding what's possible
- Learning by example
- Self-service troubleshooting

## Implementation

The documentation is:
- ✅ Generated dynamically in code (no external files needed)
- ✅ Always up-to-date with the server capabilities
- ✅ Accessible via standard MCP resource protocol
- ✅ Formatted as markdown for readability
- ✅ Includes comprehensive examples
- ✅ No authentication required

## Files Modified

1. **src/resources/resources.ts**
   - Added `planka://docs/examples` resource definition

2. **src/resources/handlers.ts**
   - Added early handler for documentation resource
   - Added `generateDocumentation()` function with complete guide

## Usage in Different Contexts

### Claude Desktop
"Show me the MCP Planka documentation" → Reads `planka://docs/examples` resource

### Telegram Bot
Users can ask: "What can this bot do?" → Bot reads and summarizes the documentation

### MCP Inspector
Visual browsing of all capabilities and examples

### Custom Clients
Any MCP client can read this resource for self-documentation

## Next Steps

The documentation resource makes the MCP server self-documenting. Users and AI assistants can always access comprehensive usage guidance without external documentation.
