# MCP Rastar

Model Context Protocol (MCP) server for Rastar company integration.

## ✨ What's New in v0.2.0

**Complete MCP interface with Tools, Resources, and Prompts!**

- 🛠️ **4 Tools** - Write operations (select, change, remove, bulk)
- 📚 **7 Resources** - Read operations (today, week, stats, etc.)
- 💡 **6 Prompts** - Smart templates for common workflows
- 🎯 **User-friendly** - Work with dates instead of IDs
- 📊 **Statistics** - Built-in analytics and reporting

See [`MCP_USER_GUIDE.md`](MCP_USER_GUIDE.md) for complete MCP usage guide.

## Features

- **MCP Server**: Full Model Context Protocol support with tools, resources, and prompts
- **Authentication**: OAuth2-based authentication with password and refresh token grants
- **Food Menu Management**: View available lunch menus and make selections
- **Three API Layers**:
  - **MCP Layer**: Tools, resources, and prompts for AI agents (recommended for MCP clients)
  - **Helper APIs**: User-friendly functions with smart defaults (recommended for applications)
  - **Raw APIs**: Direct database operations for advanced use

## Quick Start

### As MCP Server (New! 🎉)

```bash
npm start
```

**Available interfaces:**
- **Tools**: `rastar.menu.*` - Create, update, delete selections
- **Resources**: `rastar://menu/*` - Read menu data, statistics
- **Prompts**: Planning, reporting, reminders

See [`MCP_USER_GUIDE.md`](MCP_USER_GUIDE.md) for complete MCP documentation.

### As a Library

```typescript
import { 
  login, 
  getTodayMenu, 
  getThisWeekMenu,
  selectFoodByDate,
} from '@rastar/mcp-rastar';

// Login
const { access_token, user } = await login('email@example.com', 'password');
const auth = { accessToken: access_token };

// Get today's menu with your selection
const today = await getTodayMenu(auth, user.id);
console.log(`Foods: ${today.foodOptions.map(f => f.name).join(', ')}`);
console.log(`Selected: ${today.hasSelection ? today.selectedFood!.name : 'None'}`);

// Get this week's menu
const week = await getThisWeekMenu(auth, user.id);
week.forEach(day => {
  console.log(`${day.date}: ${day.hasSelection ? day.selectedFood!.name : 'Not selected'}`);
});

// Select food for a date
await selectFoodByDate(auth, user.id, '2025-12-25', 'schedule-id-here');
```

See [`MENU_HELPERS_USAGE.md`](MENU_HELPERS_USAGE.md) for complete examples.

## 📚 Documentation

### MCP Server Documentation (New! 🎉)
- **[MCP_USER_GUIDE.md](MCP_USER_GUIDE.md)** - Complete MCP tools, resources, and prompts guide ⭐
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - What changed from v0.1 to v0.2

### API Documentation
- **[API_STRUCTURE.md](API_STRUCTURE.md)** - Complete API architecture overview
- **[MENU_HELPERS_USAGE.md](MENU_HELPERS_USAGE.md)** - Helper API examples (recommended for apps)
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing documentation
- **[TESTING_COMPLETE.md](TESTING_COMPLETE.md)** - Test implementation summary
- **[API_SCHEMA_GENERATOR.md](API_SCHEMA_GENERATOR.md)** - Schema generation

## 🛠️ MCP Interface (v0.2.0)

### Tools (Write Operations)

- `rastar.auth.refresh` - Refresh access token
- `rastar.menu.change_selection` - Change selection by date (atomic)
- `rastar.menu.select_food_by_date` - Select food for specific date
- `rastar.menu.remove_selection_by_date` - Remove selection by date
- `rastar.menu.bulk_select_foods` - Batch selections

### Resources (Read Operations)

- `rastar://menu/with-selections` - Menu + selections combined
- `rastar://menu/today` - Today's menu with status
- `rastar://menu/tomorrow` - Tomorrow's options
- `rastar://menu/this-week` - Current week menu
- `rastar://menu/next-week` - Next week menu
- `rastar://menu/selection-stats` - Statistics and analytics
- `rastar://menu/unselected-days` - Days needing selection

### Prompts (Smart Templates)

- `weekly-menu-planner` - Plan entire week
- `today-menu-selector` - Smart daily selection
- `selection-reminder` - Friendly reminders
- `menu-report` - Comprehensive reports
- `auto-select-week` - Automated planning
- `change-tomorrow` - Quick tomorrow changes

## 📦 Library API Overview

### Helper APIs (Recommended for Applications) ⭐

User-friendly functions with built-in logic:

```typescript
// Menu retrieval with filtering
getTodayMenu(auth, userId)
getTomorrowMenu(auth, userId)
getThisWeekMenu(auth, userId)
getNextWeekMenu(auth, userId)
getMenuWithSelections(auth, userId, filter?)

// Smart selection management
selectFoodByDate(auth, userId, date, scheduleId)
changeSelection(auth, userId, { date, newMenuScheduleId })
removeSelectionByDate(auth, userId, date)
bulkSelectFoods(auth, userId, [...selections])

// Analytics
getSelectionStats(auth, userId)
getUnselectedDays(auth, userId, filter?)

// Analytics
getSelectionStats(auth, userId)
getUnselectedDays(auth, userId, 'future')
```

### Raw APIs (Advanced)

Direct database operations:

```typescript
// Authentication
login(email, password)
refreshToken(refreshToken)

// Menu CRUD
getMenuSchedule(auth)
getUserMenuSelections(auth, userId)
createMenuSelection(auth, userId, menuScheduleId)
deleteMenuSelection(auth, selectionId)
```

## Configuration

Required environment variables:

```
RASTAR_BASE_URL=https://hhryfmueyrkbnjxgjzlf.supabase.co
RASTAR_API_KEY=<your-api-key>
```

## Development

### Build

```bash
npm run build
```

### Testing

**Unit tests:**
```bash
npm test
```

**Integration tests** (requires `.env.test` with valid credentials):
```bash
INTEGRATION_TEST=1 npm test integration
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing documentation.

### Generate API Schemas

```bash
npm run schema:generate
```

See [API_SCHEMA_GENERATOR.md](API_SCHEMA_GENERATOR.md) for details.

## Project Structure

```
src/
├── api/              # API client functions
│   ├── auth.ts       # Authentication (login, refresh)
│   ├── menu.ts       # Menu operations
│   ├── client.ts     # Base HTTP client
│   └── __tests__/    # Unit and integration tests
├── tools/            # MCP tool definitions
│   ├── auth.tools.ts
│   ├── menu.tools.ts
│   └── tool-handlers.ts
├── types/            # TypeScript type definitions
└── index.ts          # MCP server entry point
```
