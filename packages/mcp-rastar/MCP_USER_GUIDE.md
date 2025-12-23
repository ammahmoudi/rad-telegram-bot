# Rastar MCP Server - User Guide

## 🎯 Overview

The Rastar MCP server now provides a **complete user-friendly interface** built on top of helper functions. Users can interact with the Rastar restaurant menu system using:

- **Tools** - Perform actions (create, update, delete selections)
- **Resources** - Read data (menu, selections, statistics)
- **Prompts** - Smart templates for common workflows

## 🛠️ Tools (Write Operations)

All tools use the new helper API layer for better user experience.

### Authentication

#### `rastar.auth.refresh`
Refresh access token using refresh token.

**Parameters:**
- `refreshToken` (string, required) - Refresh token from previous authentication

### Menu Selection Management

#### `rastar.menu.change_selection`
Atomically change food selection for a specific date (deletes old, creates new).

**Parameters:**
- `accessToken` (string, required) - Rastar access token
- `userId` (string, required) - User ID
- `date` (string, required) - Date in YYYY-MM-DD format
- `newScheduleId` (string, required) - New menu schedule ID to select

**Example:**
```json
{
  "accessToken": "eyJhbGci...",
  "userId": "c77a6857-ead6-475e-97ae-58e37f4b57c7",
  "date": "2025-12-24",
  "newScheduleId": "abc-123"
}
```

#### `rastar.menu.select_food_by_date`
Select a food item for a specific date (creates new selection).

**Parameters:**
- `accessToken` (string, required) - Rastar access token
- `userId` (string, required) - User ID
- `date` (string, required) - Date in YYYY-MM-DD format
- `scheduleId` (string, required) - Menu schedule ID to select

#### `rastar.menu.remove_selection_by_date`
Remove food selection for a specific date.

**Parameters:**
- `accessToken` (string, required) - Rastar access token
- `userId` (string, required) - User ID
- `date` (string, required) - Date in YYYY-MM-DD format

#### `rastar.menu.bulk_select_foods`
Select multiple food items at once (batch operation).

**Parameters:**
- `accessToken` (string, required) - Rastar access token
- `userId` (string, required) - User ID
- `selections` (array, required) - Array of `{date, scheduleId}` objects

**Example:**
```json
{
  "accessToken": "eyJhbGci...",
  "userId": "c77a6857-ead6-475e-97ae-58e37f4b57c7",
  "selections": [
    { "date": "2025-12-24", "scheduleId": "abc-123" },
    { "date": "2025-12-25", "scheduleId": "def-456" },
    { "date": "2025-12-26", "scheduleId": "ghi-789" }
  ]
}
```

---

## 📚 Resources (Read Operations)

Resources provide read-only data access using URI query parameters.

### URI Format
```
rastar://menu/<resource-name>?accessToken=<TOKEN>&userId=<USER_ID>
```

### Available Resources

#### `rastar://menu/with-selections`
Get menu schedule combined with user selections, organized by date.

**URI:**
```
rastar://menu/with-selections?accessToken=YOUR_TOKEN&userId=USER_ID
```

**Returns:**
```json
[
  {
    "date": "2025-12-23",
    "foodOptions": [
      {
        "id": "schedule-123",
        "name": "Chicken Rice",
        "description": "Grilled chicken with rice",
        "isSelected": true
      },
      {
        "id": "schedule-456",
        "name": "Vegetable Pasta",
        "description": "Fresh pasta with vegetables",
        "isSelected": false
      }
    ],
    "hasSelection": true,
    "selectedFood": {
      "id": "schedule-123",
      "name": "Chicken Rice"
    }
  }
]
```

#### `rastar://menu/today`
Get today's available food options with selection status.

**URI:**
```
rastar://menu/today?accessToken=YOUR_TOKEN&userId=USER_ID
```

#### `rastar://menu/tomorrow`
Get tomorrow's available food options with selection status.

**URI:**
```
rastar://menu/tomorrow?accessToken=YOUR_TOKEN&userId=USER_ID
```

#### `rastar://menu/this-week`
Get current week (Monday-Sunday) menu with selections.

**URI:**
```
rastar://menu/this-week?accessToken=YOUR_TOKEN&userId=USER_ID
```

#### `rastar://menu/next-week`
Get next week menu with selections.

**URI:**
```
rastar://menu/next-week?accessToken=YOUR_TOKEN&userId=USER_ID
```

#### `rastar://menu/selection-stats`
Get comprehensive statistics about food selections.

**URI:**
```
rastar://menu/selection-stats?accessToken=YOUR_TOKEN&userId=USER_ID
```

**Returns:**
```json
{
  "totalDaysAvailable": 30,
  "totalDaysSelected": 25,
  "totalDaysUnselected": 5,
  "upcomingDaysNeedingSelection": 3,
  "pastUnselectedDays": 2,
  "futureSelectedDays": 23,
  "futureTotalDays": 26,
  "selectionRate": 83.33
}
```

#### `rastar://menu/unselected-days`
Get list of dates that need food selection.

**URI:**
```
rastar://menu/unselected-days?accessToken=YOUR_TOKEN&userId=USER_ID
```

**Returns:**
```json
[
  "2025-12-24",
  "2025-12-25",
  "2025-12-30"
]
```

---

## 💡 Prompts (Smart Templates)

Prompts provide pre-built workflows for common tasks.

### `weekly-menu-planner`
Plan food selections for the entire week with preferences.

**Arguments:**
- `accessToken` (required) - Rastar access token
- `userId` (required) - User ID
- `preferences` (optional) - Food preferences (e.g., "vegetarian", "no rice")

**What it does:**
1. Fetches this week's menu
2. Checks current selections
3. Suggests variety-focused selections
4. Applies selections after confirmation

---

### `today-menu-selector`
Smart food selection for today based on preferences and history.

**Arguments:**
- `accessToken` (required) - Rastar access token
- `userId` (required) - User ID
- `preferences` (optional) - Food preferences or dietary restrictions

**What it does:**
1. Shows today's available options
2. Recommends best choice based on preferences and variety
3. Selects after confirmation

---

### `selection-reminder`
Generate reminder for unselected days that need food selection.

**Arguments:**
- `accessToken` (required) - Rastar access token
- `userId` (required) - User ID
- `daysAhead` (optional) - Number of days to check ahead (default: 7)

**What it does:**
1. Finds unselected days
2. Fetches statistics
3. Creates friendly reminder with urgency indicators

---

### `menu-report`
Generate comprehensive report of selections: stats, upcoming meals, unselected days.

**Arguments:**
- `accessToken` (required) - Rastar access token
- `userId` (required) - User ID
- `period` (optional) - Time period: "week", "month", or "all" (default: week)

**What it does:**
Creates professional report with:
- Selection statistics and completion rate
- Upcoming meals with dates
- Action items for unselected days
- Insights and patterns

---

### `auto-select-week`
Automatically select meals for the week based on variety and preferences.

**Arguments:**
- `accessToken` (required) - Rastar access token
- `userId` (required) - User ID
- `avoidDuplicates` (optional) - Avoid selecting same food multiple times (default: true)
- `preferences` (optional) - Food preferences to prioritize

**What it does:**
1. Analyzes this week's menu
2. Intelligently selects foods with variety
3. Applies preferences
4. Uses bulk selection for efficiency

---

### `change-tomorrow`
Change tomorrow's food selection with smart suggestions.

**Arguments:**
- `accessToken` (required) - Rastar access token
- `userId` (required) - User ID
- `reason` (optional) - Reason for change (e.g., "want something lighter")

**What it does:**
1. Shows tomorrow's current selection
2. Suggests alternatives based on reason
3. Changes selection after confirmation

---

## 🗂️ Architecture

```
User Application (Telegram Bot / CLI)
           │
           ├─► Tools (write operations)
           │   └─► Helper Functions
           │       └─► Raw APIs
           │
           ├─► Resources (read operations)
           │   └─► Helper Functions
           │       └─► Raw APIs
           │
           └─► Prompts (smart workflows)
               └─► Combine Tools + Resources
```

### Layers

1. **Raw API Layer** (`src/api/auth.ts`, `menu.ts`)
   - Direct API mappings
   - Low-level CRUD operations
   - Type-safe interfaces

2. **Helper Layer** (`src/api/menu-helpers.ts`)
   - User-friendly functions
   - Smart date filtering
   - Combined data views
   - Atomic operations

3. **MCP Layer** (`src/tools/`, `src/resources/`, `src/prompts/`)
   - MCP protocol integration
   - Tools, resources, and prompts
   - Request handling and validation

---

## ✅ Key Features

### For Users

- **Date-based operations** - Work with dates instead of IDs
- **Smart filtering** - Today, this week, next week, custom ranges
- **Batch operations** - Select multiple foods at once
- **Statistics** - Track selection progress and patterns
- **Prompt templates** - Pre-built workflows for common tasks

### For Developers

- **Complete type safety** - Full TypeScript typing
- **Two-layer API** - Raw APIs + helpers for flexibility
- **Well-tested** - 38 tests covering all functionality
- **Comprehensive docs** - Multiple markdown files
- **Schema generation** - Auto-document all APIs

---

## 🚀 Quick Start Examples

### Example 1: Check Today's Menu
```typescript
// Use resource
const uri = `rastar://menu/today?accessToken=${token}&userId=${userId}`;
const todayMenu = await readResource(uri);

console.log(`Today (${todayMenu.date}):`);
todayMenu.foodOptions.forEach(food => {
  console.log(`  ${food.isSelected ? '✓' : ' '} ${food.name}`);
});
```

### Example 2: Select Food for Tomorrow
```typescript
// Use tool
await callTool('rastar.menu.select_food_by_date', {
  accessToken: token,
  userId: userId,
  date: '2025-12-24',
  scheduleId: 'abc-123'
});
```

### Example 3: Get Weekly Report
```typescript
// Use prompt
const response = await getPrompt('menu-report', {
  accessToken: token,
  userId: userId,
  period: 'week'
});
```

### Example 4: Auto-Plan Week
```typescript
// Use prompt
const response = await getPrompt('auto-select-week', {
  accessToken: token,
  userId: userId,
  preferences: 'vegetarian, no spicy',
  avoidDuplicates: 'true'
});
```

---

## 📖 Related Documentation

- [`TESTING_COMPLETE.md`](TESTING_COMPLETE.md) - Testing implementation summary
- [`API_STRUCTURE.md`](API_STRUCTURE.md) - API architecture details
- [`MENU_HELPERS_USAGE.md`](MENU_HELPERS_USAGE.md) - Helper functions guide
- [`TESTING_GUIDE.md`](TESTING_GUIDE.md) - How to run tests

---

## 🎉 Summary

Users can now:
- ✅ Select/change/remove foods by **date** (no need to find IDs manually)
- ✅ Get **today/tomorrow/week** menus with one call
- ✅ See **statistics** and **unselected days** easily
- ✅ Use **batch operations** for multiple selections
- ✅ Apply **smart prompt templates** for common workflows
- ✅ Access data via **resources** (read) and modify via **tools** (write)

**Everything is user-friendly, well-typed, and production-ready!** 🚀
