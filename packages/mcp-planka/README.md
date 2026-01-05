# 🚀 Planka MCP Server

A comprehensive **Model Context Protocol (MCP) server** for [Planka](https://planka.app/) project management. Provides AI assistants with complete access to Planka boards, cards, tasks, and project data.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.x-green.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [Architecture](#-architecture)
- [Documentation](#-documentation)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage Examples](#-usage-examples)
- [Development](#-development)

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Set Planka API URL
PLANKA_API_URL=https://your-planka-instance.com

# Or use in MCP config
{
  "mcpServers": {
    "planka": {
      "command": "node",
      "args": ["path/to/build/index.js"],
      "env": {
        "PLANKA_API_URL": "https://your-planka-instance.com"
      }
    }
  }
}
```

### 3. Start the Server
```bash
npm run dev  # Development mode
npm run build && node build/index.js  # Production
```

---

## 🎯 Features

### **21 MCP Tools** 🛠️
High-level helper functions for AI assistants:
- **User Cards** - Get cards assigned to users with advanced filtering
- **User Activity** - Track actions, comments, and contributions
- **Project Status** - Generate project dashboards and reports
- **Daily Reports** - Automated standup and progress summaries
- **Search** - Powerful search across all Planka entities

### **50+ Raw API Functions** 🔧
Direct access to Planka REST API:
- Projects, Boards, Lists, Cards
- Labels, Members, Comments
- Task Lists, Tasks, Attachments
- User management and authentication

### **Helper Functions** 🤖
Intelligent data aggregation and formatting:
- Enriched card data with project/board/list context
- Task completion statistics and progress tracking
- User activity timelines and contribution metrics
- Project health indicators and risk analysis
- Smart filtering, sorting, and searching

---

## 🏗️ Architecture

```
packages/mcp-planka/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # 21 MCP tools (AI-facing)
│   │   ├── user-tasks.tools.ts
│   │   ├── user-activity.tools.ts
│   │   ├── project-status.tools.ts
│   │   ├── daily-reports.tools.ts
│   │   └── search.tools.ts
│   ├── helpers/              # High-level helper functions
│   │   ├── user-tasks.ts
│   │   ├── user-activity.ts
│   │   ├── project-status.ts
│   │   ├── daily-reports.ts
│   │   ├── search.ts
│   │   └── types.ts
│   └── api/                  # 50+ raw Planka API functions
│       ├── projects.ts
│       ├── boards.ts
│       ├── cards.ts
│       ├── tasks.ts
│       └── ... (47 more files)
└── docs/
    ├── TOOLS.md              # Complete tools reference
    ├── HELPERS.md            # Helper functions guide
    └── API.md                # Raw API documentation
```

### **Three-Layer Design**

1. **Tools Layer** (`src/tools/`) - MCP interface for AI assistants
   - 21 high-level tools with clear descriptions
   - Zod schema validation for parameters
   - User-friendly naming: `planka_get_user_cards`

2. **Helpers Layer** (`src/helpers/`) - Smart business logic
   - Data enrichment and aggregation
   - Advanced filtering and sorting
   - Context-aware formatting

3. **API Layer** (`src/api/`) - Direct Planka REST API
   - 50+ endpoints covering all Planka features
   - Type-safe with TypeScript interfaces
   - Minimal abstraction for maximum flexibility

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[TOOLS.md](docs/TOOLS.md)** | Complete reference for all 21 MCP tools with examples and parameters |
| **[HELPERS.md](docs/HELPERS.md)** | Guide to helper functions with type signatures and use cases |
| **[API.md](docs/API.md)** | Raw Planka API functions reference with endpoints and responses |

---

## 📦 Installation

### As MCP Server (Recommended)

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "planka": {
      "command": "node",
      "args": ["path/to/rastar-telegram-bot/packages/mcp-planka/build/index.js"],
      "env": {
        "PLANKA_API_URL": "https://planka.yourdomain.com"
      }
    }
  }
}
```

### As Package Dependency

```bash
npm install @rastar/mcp-planka
```

```typescript
import { getUserCards, searchCards } from '@rastar/mcp-planka/helpers';
import { getProject, getBoard } from '@rastar/mcp-planka/api';
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Required
PLANKA_API_URL=https://your-planka-instance.com

# Optional (for development)
NODE_ENV=development
LOG_LEVEL=debug
```

### Authentication

Authentication is handled per-request using **Planka access tokens**:

```typescript
const auth = { 
  plankaUrl: 'https://planka.yourdomain.com',
  accessToken: 'your-planka-token-here'
};

const cards = await getUserCards(auth, 'user-id-123');
```

Tokens are provided by the Telegram bot via the `@shared/crypto` module (encrypted storage).

---

## 💡 Usage Examples

### Get User's Tasks

```typescript
import { getUserCards } from '@rastar/mcp-planka/helpers';

// Get all cards for current user
const cards = await getUserCards(auth);

// Get cards with full task items and history
const detailedCards = await getUserCards(auth, 'user-123', {
  includeTasks: true,
  includeHistory: true,
  projectId: 'proj-456'
});

// Filter incomplete cards with due dates
const urgentCards = await getUserCards(auth, undefined, {
  isCompleted: false,
  dueDate: { before: '2025-12-31' }
}, {
  by: 'dueDate',
  order: 'asc'
});
```

### Search Across Projects

```typescript
import { globalSearch } from '@rastar/mcp-planka/helpers';

// Search everything
const results = await globalSearch(auth, 'urgent bug', {
  searchUsers: true,
  searchProjects: true,
  searchBoards: true,
  searchCards: true,
  searchTasks: true
});

console.log(results.cards);  // Matching cards
console.log(results.tasks);  // Matching tasks
```

### Generate Project Status Report

```typescript
import { getProjectStatus } from '@rastar/mcp-planka/helpers';

const status = await getProjectStatus(auth, 'project-id-123');

console.log(status.summary);
// {
//   totalCards: 45,
//   completedCards: 28,
//   inProgressCards: 12,
//   completionRate: 0.62,
//   overdueCards: 3
// }
```

### Track User Activity

```typescript
import { getUserActivity } from '@rastar/mcp-planka/helpers';

const activity = await getUserActivity(auth, 'user-123', {
  since: '2025-12-01',
  types: ['createCard', 'commentCard', 'updateCard']
});

console.log(activity.summary);
// {
//   totalActions: 156,
//   cardsCreated: 23,
//   commentsAdded: 89,
//   cardsUpdated: 44
// }
```

---

## 🔧 Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- unit

# Run tests in watch mode
npm run test:watch

# Test with coverage
npm run test:coverage
```

#### Integration Tests

Integration tests run against a live Planka instance. To run them:

1. **Copy environment template:**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Configure credentials in `.env.test`:**
   ```bash
   PLANKA_BASE_URL=https://pm-dev.rastar.dev
   PLANKA_USERNAME=your_username
   PLANKA_PASSWORD=your_password
   ```

3. **Run integration tests:**
   ```bash
   # Windows PowerShell
   $env:INTEGRATION_TEST='1'; npm test -- api-optimized --run
   
   # Linux/Mac
   INTEGRATION_TEST=1 npm test -- api-optimized
   ```

**Note:** Integration tests for optimized API endpoints will gracefully skip if the backend hasn't implemented those endpoints yet (they check availability automatically).

**Test Results:**
- ✅ Unit tests: 11/11 passing (parameter building, URL construction)
- ✅ Integration tests: 28/28 passing (17 skip when endpoints unavailable + 1 availability check)


### Type Checking

```bash
npm run type-check
```

---

## 🌟 Highlights

### **Legendary getUserCards()**
Our flagship helper function that can:
- ✅ Get cards for any user (or current user)
- ✅ Filter by project, board, list, completion, due date
- ✅ Optionally include full task items (`includeTasks: true`)
- ✅ Optionally include action history (`includeHistory: true`)
- ✅ Sort by name, date, position
- ✅ Enrich with project/board/list context

See [LEGENDARY_GETUSERCARDS.md](LEGENDARY_GETUSERCARDS.md) for details.

### **Smart Search**
- Fuzzy matching across cards, tasks, users, projects, boards
- Filter by date ranges, completion status, assignments
- Context-aware results with full entity relationships

### **Activity Tracking**
- Real-time user contribution metrics
- Action history timelines
- Productivity analytics

---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs.

---

## 🔗 Links

- [Planka Project](https://planka.app/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

**Made with ❤️ for the Rastar Telegram Bot project**
