# 📖 How the Documentation System Works

## Overview

The MCP Planka server includes **built-in, self-documenting capabilities** through a special resource that returns comprehensive usage documentation.

---

## 🏗️ Architecture

### Where It Lives

```
packages/mcp-planka/src/
├── resources/
│   ├── resources.ts          ← Resource definition
│   └── handlers.ts            ← Documentation generation
```

### How It Works

```
User/AI → MCP Client → Read Resource "planka://docs/examples"
                              ↓
                    handleReadResource() function
                              ↓
                    generateDocumentation() function
                              ↓
                    Returns markdown documentation
```

---

## 📝 Code Breakdown

### Step 1: Resource Definition

**File:** [src/resources/resources.ts](c:\Users\ammah\Documents\GitHub\rastar-telegram-bot\packages\mcp-planka\src\resources\resources.ts)

```typescript
export const resources = [
  {
    uri: 'planka://docs/examples',
    name: 'MCP Usage Examples & Documentation',
    description: 'Complete guide with examples for all tools, resources, and prompts',
    mimeType: 'text/markdown',
  },
  // ... other resources
];
```

This registers the documentation as a discoverable MCP resource.

### Step 2: Request Handler

**File:** [src/resources/handlers.ts](c:\Users\ammah\Documents\GitHub\rastar-telegram-bot\packages\mcp-planka\src\resources\handlers.ts) (lines 4-17)

```typescript
export async function handleReadResource(request: ReadResourceRequest) {
  const uri = request.params.uri;

  // Handle documentation resource (no auth required)
  if (uri === 'planka://docs/examples') {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: generateDocumentation(),  // ← Generates the docs
        },
      ],
    };
  }

  // ... handle other resources
}
```

When someone requests the docs resource, it immediately returns the generated documentation.

### Step 3: Documentation Generator

**File:** [src/resources/handlers.ts](c:\Users\ammah\Documents\GitHub\rastar-telegram-bot\packages\mcp-planka\src\resources\handlers.ts) (lines 225-537)

```typescript
function generateDocumentation(): string {
  return `# MCP Planka Server - Complete Usage Guide

## 🔐 Authentication
All tools and resources require Planka credentials...

## 📚 Resources (Read-Only Data Access)
Resources provide optimized read-only access...

## 🛠️ Tools (40+ Available)
### Authentication Tools
- **auth.status** - Check Planka connection status

### Project Tools (5 tools)
- **projects.list** - List all projects
...

## 📋 Example Usage
### Creating a Sprint Board
...

## 🔄 Prompts (Workflow Templates)
...

## 💡 Tips & Best Practices
...
`;
}
```

This function returns a complete markdown guide with:
- Authentication instructions
- All 40+ tools organized by category
- All 5 resources with URI patterns
- All 5 workflow prompts
- Detailed JSON examples
- Best practices and tips

---

## 🎯 How to Use It

### Method 1: MCP Inspector (Visual)

```bash
# 1. Start the inspector
cd packages/mcp-planka
npx @modelcontextprotocol/inspector npx tsx src/index.ts

# 2. Open the URL shown (e.g., http://localhost:6274)

# 3. Navigate to "Resources" tab

# 4. Click "MCP Usage Examples & Documentation"

# 5. See the full documentation rendered beautifully!
```

### Method 2: Claude Desktop

```
User: "Show me the Planka MCP documentation"

Claude: [Reads planka://docs/examples resource]
         [Displays comprehensive guide with all tools, examples, etc.]
```

### Method 3: Direct MCP Call

```typescript
import { getMcpManager } from './mcp-client.js';

const manager = getMcpManager();
const result = await manager.readResource('planka', 'planka://docs/examples');

console.log(result.contents[0].text);
// Prints complete markdown documentation
```

### Method 4: curl (if HTTP transport)

```bash
curl http://localhost:3000/resources/read \
  -H "Content-Type: application/json" \
  -d '{"uri": "planka://docs/examples"}'
```

---

## ✨ Key Features

### 1. **No Authentication Required**
Unlike other resources that need `plankaBaseUrl` and `plankaToken`, the documentation is **publicly accessible**.

```typescript
// Other resources need auth:
planka://projects?plankaBaseUrl=...&plankaToken=...

// Documentation doesn't:
planka://docs/examples  // ✅ Works immediately!
```

### 2. **Always Up-to-Date**
Documentation is generated **dynamically** from code, not from static files. If you add a new tool, you just update the `generateDocumentation()` function.

### 3. **Rich Formatting**
Returns **markdown** with:
- Headers and sections
- Code blocks with JSON examples
- Tables for quick reference
- Emojis for visual clarity
- Step-by-step workflows

### 4. **Discoverable**
Listed in the resources catalog, so:
- MCP Inspector shows it in the UI
- AI assistants can discover it automatically
- Clients can enumerate available docs

---

## 📊 What's Included

The generated documentation covers:

| Section | Content |
|---------|---------|
| **Authentication** | How to get and use Planka credentials |
| **Resources** | All 5 URI patterns with examples |
| **Tools** | All 40+ tools organized by category |
| **Examples** | JSON payloads for common operations |
| **Prompts** | All 5 workflow templates |
| **Workflows** | Step-by-step guides (sprint board, card lifecycle) |
| **Error Handling** | Common errors and solutions |
| **Best Practices** | Tips for optimal usage |
| **Integration** | Examples for Claude Desktop, Telegram Bot |

---

## 🔄 Updating the Documentation

To add or modify documentation:

1. **Open:** [src/resources/handlers.ts](c:\Users\ammah\Documents\GitHub\rastar-telegram-bot\packages\mcp-planka\src\resources\handlers.ts)

2. **Find:** The `generateDocumentation()` function (line ~225)

3. **Edit:** Update the markdown string inside the function

4. **That's it!** No build step needed - it's generated on-the-fly

Example:

```typescript
function generateDocumentation(): string {
  return `# MCP Planka Server - Complete Usage Guide

## New Section!
Here's my new documentation section...

${existingContent}
`;
}
```

---

## 🎨 Benefits

### For AI Assistants (Claude, ChatGPT, etc.)
- ✅ Discover capabilities without trial and error
- ✅ Get exact JSON examples for tool calls
- ✅ Learn parameter names and types
- ✅ Understand workflows and best practices

### For Developers
- ✅ Self-documenting API
- ✅ No need to maintain separate docs
- ✅ Examples always match current implementation
- ✅ Quick reference while coding

### For End Users
- ✅ Learn what's possible
- ✅ Copy-paste working examples
- ✅ Troubleshoot errors
- ✅ Discover advanced features

---

## 🧪 Testing the Documentation

### Quick Test

```bash
cd packages/mcp-planka

# Start the server
npx tsx src/index.ts

# In another terminal, read the resource
echo '{"jsonrpc":"2.0","id":1,"method":"resources/read","params":{"uri":"planka://docs/examples"}}' | npx tsx src/index.ts
```

### With MCP Inspector

```bash
# Start inspector
npx @modelcontextprotocol/inspector npx tsx src/index.ts

# Open browser to shown URL
# Click Resources → MCP Usage Examples & Documentation
# Verify content displays correctly
```

---

## 📁 Related Files

### Created in This Update

1. **[SAMPLE_USAGE.md](c:\Users\ammah\Documents\GitHub\rastar-telegram-bot\packages\mcp-planka\SAMPLE_USAGE.md)**
   - Markdown file with sample usage examples
   - Shows how to access the built-in docs
   - Provides real-world workflow examples
   - You're reading from this pattern!

2. **[DOCUMENTATION_RESOURCE.md](c:\Users\ammah\Documents\GitHub\rastar-telegram-bot\packages\mcp-planka\DOCUMENTATION_RESOURCE.md)**
   - Explains the documentation resource feature
   - How it works technically
   - Benefits for different users

3. **[HOW_DOCS_WORK.md](c:\Users\ammah\Documents\GitHub\rastar-telegram-bot\packages\mcp-planka\HOW_DOCS_WORK.md)** (this file)
   - Deep dive into the implementation
   - Code walkthrough
   - Testing and updating guide

### Modified Files

1. **[src/resources/resources.ts](c:\Users\ammah\Documents\GitHub\rastar-telegram-bot\packages\mcp-planka\src\resources\resources.ts)**
   - Added `planka://docs/examples` resource definition

2. **[src/resources/handlers.ts](c:\Users\ammah\Documents\GitHub\rastar-telegram-bot\packages\mcp-planka\src\resources\handlers.ts)**
   - Added early handler for docs resource (line 7)
   - Added `generateDocumentation()` function (line 225)

---

## 🚀 Try It Now!

```bash
# Start the MCP Inspector
cd packages/mcp-planka
npx @modelcontextprotocol/inspector npx tsx src/index.ts

# Open the URL in your browser
# Navigate to Resources tab
# Click "MCP Usage Examples & Documentation"
# Browse the complete guide!
```

Or ask Claude:

```
"Show me the Planka MCP documentation"
```

Or read it programmatically:

```typescript
const docs = await mcpClient.readResource('planka://docs/examples');
console.log(docs.contents[0].text);
```

---

## 💡 Summary

The documentation system works by:

1. **Registering** a resource at `planka://docs/examples`
2. **Intercepting** requests for that URI
3. **Generating** markdown documentation on-the-fly
4. **Returning** it to the client

No external files, no build steps, no sync issues - just pure, self-documenting code! 🎉
