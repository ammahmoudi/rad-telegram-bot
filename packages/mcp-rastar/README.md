# MCP Rastar

Model Context Protocol (MCP) server for Rastar company integration.

## Features

- **Authentication**: OAuth2-based authentication with password and refresh token grants
- **Food Menu Management**: View available lunch menus and make selections
- **Two API Layers**:
  - **Raw APIs**: Direct database operations for advanced use
  - **Helper APIs**: User-friendly functions with smart defaults (recommended)

## Quick Start

### As a Library (Recommended)

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
console.log(`Foods: ${today.foodOptions.map(f => f.menu_item.name).join(', ')}`);
console.log(`Selected: ${today.hasSelection ? today.selectedFood!.menu_schedule!.menu_item.name : 'None'}`);

// Get this week's menu
const week = await getThisWeekMenu(auth, user.id);
console.log(`${week.daysWithSelection}/${week.totalDays} days selected`);

// Select food for a date
await selectFoodByDate(auth, user.id, '2025-12-25', 'chicken');
```

See [USAGE_EXAMPLES_HELPERS.md](USAGE_EXAMPLES_HELPERS.md) for complete examples.

### As MCP Server

```bash
npm start
```

## Documentation

- **[API_STRUCTURE.md](API_STRUCTURE.md)** - Complete API architecture overview
- **[USAGE_EXAMPLES_HELPERS.md](USAGE_EXAMPLES_HELPERS.md)** - Helper API examples (recommended)
- **[USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)** - Raw API examples
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing documentation
- **[API_SCHEMA_GENERATOR.md](API_SCHEMA_GENERATOR.md)** - Schema generation

## API Overview

### Helper APIs (Recommended) ⭐

User-friendly functions with built-in logic:

```typescript
// Menu retrieval with filtering
getTodayMenu(auth, userId)
getTomorrowMenu(auth, userId)
getThisWeekMenu(auth, userId)
getNextWeekMenu(auth, userId)
getMenuWithSelections(auth, userId, 'this-month')

// Smart selection management
selectFoodByDate(auth, userId, date, foodName)
changeSelection(auth, userId, { date, newMenuScheduleId })
removeSelectionByDate(auth, userId, date)
bulkSelectFoods(auth, userId, [...selections])

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
