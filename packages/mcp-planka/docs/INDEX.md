# 📚 Planka MCP Documentation Index

Welcome to the Planka MCP Server documentation! This guide will help you find what you need.

---

## 🎯 Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| **[README.md](../README.md)** | Overview, quick start, installation | Everyone |
| **[TOOLS.md](TOOLS.md)** | Complete MCP tools reference | AI developers, MCP users |
| **[HELPERS.md](HELPERS.md)** | Helper functions guide | TypeScript developers |
| **[API.md](API.md)** | Raw API functions reference | Advanced developers |
| **[LEGENDARY_GETUSERCARDS.md](../LEGENDARY_GETUSERCARDS.md)** | getUserCards() deep dive | Power users |

---

## 📖 Documentation Structure

### **Core Documentation** (Start Here)

```
packages/mcp-planka/
├── README.md                      # 📘 Main entry point - start here!
├── LEGENDARY_GETUSERCARDS.md      # 🔥 Deep dive into our flagship function
└── docs/
    ├── TOOLS.md                   # 🛠️ 21 MCP tools reference
    ├── HELPERS.md                 # 🤖 Helper functions guide
    ├── API.md                     # 🔧 50+ raw API functions
    └── archive/                   # 📦 Historical documentation
```

---

## 🚀 Getting Started

### New to Planka MCP?
1. Start with **[README.md](../README.md)** for overview and installation
2. Check **[TOOLS.md](TOOLS.md)** to see what tools are available
3. Try examples in **Quick Start** section

### Building with Planka MCP?
1. Use **[TOOLS.md](TOOLS.md)** for AI-facing MCP tools
2. Use **[HELPERS.md](HELPERS.md)** for high-level TypeScript functions
3. Use **[API.md](API.md)** for low-level REST API access

### Advanced Usage?
1. Read **[LEGENDARY_GETUSERCARDS.md](../LEGENDARY_GETUSERCARDS.md)** for advanced filtering
2. Check **[HELPERS.md](HELPERS.md)** Type Definitions section
3. Use **[API.md](API.md)** for custom endpoints

---

## 📚 Documentation Details

### [README.md](../README.md) - 9 KB
**Main Entry Point**

- ✅ Quick start guide
- ✅ Feature overview (21 tools, 50+ API functions)
- ✅ Architecture explanation
- ✅ Installation instructions
- ✅ Configuration guide
- ✅ Usage examples
- ✅ Development setup

**Best for:** First-time users, project overview

---

### [TOOLS.md](TOOLS.md) - 20 KB
**MCP Tools Reference**

- ✅ All 21 MCP tools documented
- ✅ Complete parameter schemas
- ✅ Return type examples
- ✅ Real-world usage examples
- ✅ Error handling guide
- ✅ Best practices

**Categories:**
- User Cards (2 tools)
- User Activity (5 tools)
- Project Status (4 tools)
- Daily Reports (4 tools)
- Search (6 tools)

**Best for:** AI developers, MCP users, bot developers

---

### [HELPERS.md](HELPERS.md) - 19 KB
**Helper Functions Guide**

- ✅ High-level TypeScript functions
- ✅ Full type signatures
- ✅ Filter and sort options
- ✅ Data enrichment examples
- ✅ Migration from raw API
- ✅ Best practices

**Functions Covered:**
- `getUserCards()` 🔥 - Legendary all-in-one function
- `getUserActivity()` - Track user actions
- `getProjectStatus()` - Project dashboards
- `searchCards()` - Smart search
- And 15+ more...

**Best for:** TypeScript developers, direct API usage

---

### [API.md](API.md) - 20 KB
**Raw API Functions Reference**

- ✅ 50+ raw Planka API functions
- ✅ Direct REST endpoint access
- ✅ CRUD operations for all entities
- ✅ Advanced features (webhooks, teams, etc.)
- ✅ Error handling patterns

**Entities Covered:**
- Projects, Boards, Lists, Cards
- Labels, Tasks, Members
- Comments, Attachments
- Activity, Notifications
- And more...

**Best for:** Advanced developers, custom implementations

---

### [LEGENDARY_GETUSERCARDS.md](../LEGENDARY_GETUSERCARDS.md) - 6 KB
**Deep Dive: getUserCards()**

- ✅ Detailed explanation of flagship function
- ✅ Migration guide from deprecated getUserTasks()
- ✅ Advanced filtering examples
- ✅ Optional data loading (tasks, history)
- ✅ Performance optimization tips

**Best for:** Power users, optimization seekers

---

## 🔍 Find What You Need

### "I want to..."

#### Get user's assigned cards
→ **[TOOLS.md](TOOLS.md)** - `planka_get_user_cards`  
→ **[HELPERS.md](HELPERS.md)** - `getUserCards()`

#### Search for cards/tasks
→ **[TOOLS.md](TOOLS.md)** - Search section (6 tools)  
→ **[HELPERS.md](HELPERS.md)** - Search Functions section

#### Track user activity
→ **[TOOLS.md](TOOLS.md)** - User Activity section (5 tools)  
→ **[HELPERS.md](HELPERS.md)** - User Activity section

#### Generate project reports
→ **[TOOLS.md](TOOLS.md)** - Project Status section (4 tools)  
→ **[HELPERS.md](HELPERS.md)** - Project Status section

#### Create/update cards directly
→ **[API.md](API.md)** - Cards section  
→ Direct REST API access

#### Check daily report compliance
→ **[TOOLS.md](TOOLS.md)** - Daily Reports section (4 tools)  
→ **[HELPERS.md](HELPERS.md)** - Daily Reports section

---

## 💡 Usage Patterns

### Pattern 1: MCP AI Assistant
```typescript
// Use MCP tools (AI-friendly)
const cards = await mcp.callTool('planka_get_user_cards', {
  filter: { isCompleted: false }
});
```
**Docs:** [TOOLS.md](TOOLS.md)

---

### Pattern 2: TypeScript Application
```typescript
// Use helper functions (developer-friendly)
import { getUserCards } from '@rastar/mcp-planka/helpers';
const cards = await getUserCards(auth, undefined, {
  done: false,
  includeTasks: true
});
```
**Docs:** [HELPERS.md](HELPERS.md)

---

### Pattern 3: Direct API Access
```typescript
// Use raw API (maximum control)
import { getBoard, createCard } from '@rastar/mcp-planka/api';
const board = await getBoard(auth, boardId);
const card = await createCard(auth, listId, 'Task name');
```
**Docs:** [API.md](API.md)

---

## 📈 Documentation Stats

| Metric | Value |
|--------|-------|
| **Total Documentation** | ~95 KB (5 main docs) |
| **MCP Tools Documented** | 21 tools |
| **Helper Functions** | 20+ functions |
| **Raw API Functions** | 50+ functions |
| **Code Examples** | 100+ examples |
| **Archived Docs** | 17 files (historical reference) |

---

## 🗂️ Archive

Old documentation has been moved to `docs/archive/` for historical reference. These documents may contain outdated information but are preserved for reference:

- API implementation summaries
- Testing guides
- Usage examples (pre-refactor)
- Original README

**Note:** Always refer to the main documentation above for current information.

---

## 🤝 Contributing

Found a typo? Want to add examples? Contributions welcome!

1. Edit the relevant markdown file
2. Test your changes locally
3. Submit a pull request

---

## 📞 Support

- **Issues:** Check existing documentation first
- **Questions:** Refer to examples in docs
- **Bugs:** File an issue with details

---

**Last Updated:** December 30, 2025  
**Documentation Version:** 2.0.0  
**Planka MCP Version:** 1.0.0

---

**Made with ❤️ for clear, comprehensive documentation**
