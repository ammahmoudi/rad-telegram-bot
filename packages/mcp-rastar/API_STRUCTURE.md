# Rastar MCP Package - API Structure

## 📁 File Organization

```
src/
├── api/
│   ├── auth.ts              # Raw authentication API
│   ├── menu.ts              # Raw menu CRUD operations
│   └── menu-helpers.ts      # 🌟 High-level user-friendly API
├── types/
│   ├── index.ts             # Basic types (RastarAuth, MenuSchedule, etc.)
│   └── menu-helpers.ts      # Helper function types
├── utils/
│   └── date-helpers.ts      # Date utility functions
└── index.ts                 # Main exports
```

## 🎯 Two API Layers

### Layer 1: Raw APIs (Low-Level)
Direct database operations - fast but requires more code.

**Files:** `api/auth.ts`, `api/menu.ts`

```typescript
import { getMenuSchedule, getUserMenuSelections, createMenuSelection } from '@rastar/mcp-rastar';

// Raw: Returns flat array, not grouped
const schedule = await getMenuSchedule(auth);
const selections = await getUserMenuSelections(auth, userId);

// Raw: You handle the logic
const dec25Foods = schedule.filter(s => s.date === '2025-12-25');
const myDec25Selection = selections.find(s => s.menu_schedule?.date === '2025-12-25');
```

### Layer 2: Helper APIs (High-Level) ⭐
User-friendly functions with smart defaults and built-in logic.

**File:** `api/menu-helpers.ts`

```typescript
import { getTodayMenu, getThisWeekMenu, changeSelection } from '@rastar/mcp-rastar';

// Helper: Returns today's menu with your selection combined
const today = await getTodayMenu(auth, userId);
// today.foodOptions = all foods for today
// today.selectedFood = what you picked (if any)
// today.hasSelection = quick boolean check

// Helper: Automatically deletes old and creates new
await changeSelection(auth, userId, {
  date: '2025-12-25',
  newMenuScheduleId: 'new-food-id'
});
```

## 📦 Available Helper Functions

### Menu Retrieval
- `getMenuWithSelections(auth, userId, dateFilter?)` - Combined view with filters
- `getTodayMenu(auth, userId)` - Today only
- `getTomorrowMenu(auth, userId)` - Tomorrow only
- `getThisWeekMenu(auth, userId)` - This week (Mon-Sun)
- `getNextWeekMenu(auth, userId)` - Next week
- `getUnselectedDays(auth, userId, filter?)` - Days without selection

### Selection Management
- `selectFoodByDate(auth, userId, date, foodName)` - Select by date and food name
- `changeSelection(auth, userId, options)` - Change existing selection
- `removeSelectionByDate(auth, userId, date)` - Remove selection for a date
- `bulkSelectFoods(auth, userId, selections[])` - Select multiple days at once

### Statistics
- `getSelectionStats(auth, userId)` - Get selection statistics

### Date Filters
All filters work with retrieval functions:
- `'today'` - Today only
- `'tomorrow'` - Tomorrow only
- `'this-week'` - Monday to Sunday of current week
- `'next-week'` - Next week
- `'this-month'` - Current month
- `'next-month'` - Next month
- `'past'` - All past days
- `'future'` - All future days
- `'all'` - Everything
- `{ startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }` - Custom range

## 🎨 Data Structure

### Raw API Returns
```typescript
// getMenuSchedule() - Flat array
[
  { id: '1', date: '2025-12-23', menu_item: { name: 'Chicken' } },
  { id: '2', date: '2025-12-23', menu_item: { name: 'Fish' } },
  { id: '3', date: '2025-12-24', menu_item: { name: 'Beef' } },
  // ... all dates mixed together
]

// getUserMenuSelections() - Your selections only
[
  { id: 's1', user_id: 'you', menu_schedule_id: '1', menu_schedule: {...} },
  // ... only days you selected
]
```

### Helper API Returns
```typescript
// getTodayMenu() - Structured and grouped
{
  date: '2025-12-23',
  foodOptions: [                           // All foods for this day
    { id: '1', menu_item: { name: 'Chicken' } },
    { id: '2', menu_item: { name: 'Fish' } }
  ],
  selectedFood: {                          // What you chose
    id: 's1',
    menu_schedule: { menu_item: { name: 'Chicken' } }
  },
  hasSelection: true                       // Quick check
}

// getThisWeekMenu() - Complete overview
{
  dailyMenus: [
    { date: '2025-12-23', foodOptions: [...], selectedFood: {...}, hasSelection: true },
    { date: '2025-12-24', foodOptions: [...], selectedFood: undefined, hasSelection: false },
    // ... one entry per day
  ],
  totalDays: 7,
  daysWithSelection: 5,
  daysWithoutSelection: 2
}
```

## 🚀 Recommendation

**For most applications, use the Helper APIs!**

They handle:
- ✅ Grouping menu by date
- ✅ Combining selections with available options
- ✅ Date range filtering
- ✅ Multiple food options per day
- ✅ Smart selection/deletion logic
- ✅ Bulk operations
- ✅ Statistics

**Use Raw APIs only when:**
- You need maximum performance
- You're building custom complex logic
- You want direct database structure

## 📚 Documentation Files

- `USAGE_EXAMPLES_HELPERS.md` - Helper API usage examples
- `USAGE_EXAMPLES.md` - Raw API usage examples
- `README.md` - Package overview
- `TESTING_GUIDE.md` - Testing documentation
- `API_SCHEMA_GENERATOR.md` - Schema generation

## ✅ Testing

All functions tested and working:
- ✅ Raw APIs: 6/6 functions
- ✅ Helper APIs: 15+ functions
- ✅ Integration tests: All pass
- ✅ Unit tests: 31 pass
