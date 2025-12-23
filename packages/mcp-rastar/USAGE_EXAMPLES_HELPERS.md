# High-Level Menu API Usage Examples

This guide shows how to use the user-friendly API functions instead of raw API calls.

## Quick Start

```typescript
import { 
  login,
  // High-level functions (recommended)
  getMenuWithSelections,
  changeSelection,
  selectFoodByDate,
  getTodayMenu,
  getSelectionStats,
  getUnselectedDays,
  // Raw functions (for advanced use)
  getMenuSchedule,
  getUserMenuSelections,
} from '@rastar/mcp-rastar';

// 1. Login
const tokenResponse = await login('your-email@example.com', 'your-password');
const auth = { accessToken: tokenResponse.access_token };
const userId = tokenResponse.user.id;
```

## Common Use Cases

### 1. See Today's Menu with Your Selection

```typescript
const todayMenu = await getTodayMenu(auth, userId);

if (todayMenu) {
  console.log(`📅 ${todayMenu.date}`);
  console.log(`Available foods:`);
  todayMenu.foodOptions.forEach(food => {
    console.log(`  - ${food.menu_item.name}`);
  });
  
  if (todayMenu.hasSelection) {
    console.log(`✅ You selected: ${todayMenu.selectedFood!.menu_schedule!.menu_item.name}`);
  } else {
    console.log(`⚠️  You haven't selected food for today yet!`);
  }
}
```

### 2. See This Week's Menu with Selections

```typescript
import { getThisWeekMenu } from '@rastar/mcp-rastar';

const weekMenu = await getThisWeekMenu(auth, userId);

console.log(`📊 This Week: ${weekMenu.totalDays} days`);
console.log(`✅ Selected: ${weekMenu.daysWithSelection} days`);
console.log(`⚠️  Not selected: ${weekMenu.daysWithoutSelection} days\n`);

weekMenu.dailyMenus.forEach(day => {
  console.log(`\n📅 ${day.date}`);
  console.log(`Foods available: ${day.foodOptions.map(f => f.menu_item.name).join(', ')}`);
  
  if (day.hasSelection) {
    console.log(`✅ Selected: ${day.selectedFood!.menu_schedule!.menu_item.name}`);
  } else {
    console.log(`⚠️  Not selected yet`);
  }
});
```

### 3. Select Food for a Specific Date

```typescript
import { selectFoodByDate } from '@rastar/mcp-rastar';

// Simple: just provide date and food name (fuzzy match)
const selection = await selectFoodByDate(auth, userId, '2025-12-25', 'chicken');
console.log(`✅ Selected: ${selection.menu_schedule!.menu_item.name}`);
```

### 4. Change Your Selection for a Day

```typescript
import { changeSelection, getMenuSchedule } from '@rastar/mcp-rastar';

// Option 1: Change by date
const schedule = await getMenuSchedule(auth);
const newFood = schedule.find(s => s.date === '2025-12-25' && s.menu_item.name.includes('Fish'));

const result = await changeSelection(auth, userId, {
  date: '2025-12-25',
  newMenuScheduleId: newFood!.id,
});

console.log(`✅ Changed from selection ${result.deleted.id} to ${result.created.id}`);

// Option 2: Change by selection ID
const result2 = await changeSelection(auth, userId, {
  oldSelectionId: 'abc-123',
  newMenuScheduleId: newFood!.id,
});
```

### 5. Get Days Where You Haven't Selected Food

```typescript
import { getUnselectedDays } from '@rastar/mcp-rastar';

// Get all future days without selection
const unselected = await getUnselectedDays(auth, userId, 'future');

console.log(`⚠️  You need to select food for ${unselected.length} upcoming days:\n`);

unselected.forEach(day => {
  console.log(`📅 ${day.date}`);
  console.log(`   Options: ${day.foodOptions.map(f => f.menu_item.name).join(', ')}`);
});
```

### 6. Get Your Selection Statistics

```typescript
import { getSelectionStats } from '@rastar/mcp-rastar';

const stats = await getSelectionStats(auth, userId);

console.log(`📊 Your Selection Stats:`);
console.log(`   Total days available: ${stats.totalDaysAvailable}`);
console.log(`   Days selected: ${stats.totalDaysSelected}`);
console.log(`   Days not selected: ${stats.totalDaysUnselected}`);
console.log(`   Selection rate: ${stats.selectionRate.toFixed(1)}%`);
console.log(`   Upcoming days to select: ${stats.upcomingUnselectedDays}`);
console.log(`   Missed past days: ${stats.pastUnselectedDays}`);
```

### 7. Bulk Select Foods for Multiple Days

```typescript
import { bulkSelectFoods } from '@rastar/mcp-rastar';

const result = await bulkSelectFoods(auth, userId, [
  { date: '2025-12-23', foodName: 'chicken' },
  { date: '2025-12-24', foodName: 'beef' },
  { date: '2025-12-25', foodName: 'fish' },
]);

console.log(`✅ Successfully selected: ${result.successful.length} days`);
console.log(`❌ Failed: ${result.failed.length} days`);

result.failed.forEach(fail => {
  console.log(`   ${fail.date} - ${fail.foodName}: ${fail.error}`);
});
```

### 8. Advanced: Custom Date Range

```typescript
import { getMenuWithSelections } from '@rastar/mcp-rastar';

// Get menu for specific date range
const menu = await getMenuWithSelections(auth, userId, {
  startDate: '2025-12-20',
  endDate: '2025-12-31',
});

console.log(`📅 Menu from Dec 20 to Dec 31:`);
console.log(`   Total: ${menu.totalDays} days`);
console.log(`   Selected: ${menu.daysWithSelection} days`);
```

### 9. Filter by Different Time Periods

```typescript
import { getMenuWithSelections } from '@rastar/mcp-rastar';

// Today only
const today = await getMenuWithSelections(auth, userId, 'today');

// Tomorrow only
const tomorrow = await getMenuWithSelections(auth, userId, 'tomorrow');

// This week (Monday - Sunday)
const thisWeek = await getMenuWithSelections(auth, userId, 'this-week');

// Next week
const nextWeek = await getMenuWithSelections(auth, userId, 'next-week');

// This month
const thisMonth = await getMenuWithSelections(auth, userId, 'this-month');

// Next month
const nextMonth = await getMenuWithSelections(auth, userId, 'next-month');

// All past days
const past = await getMenuWithSelections(auth, userId, 'past');

// All future days
const future = await getMenuWithSelections(auth, userId, 'future');

// Everything
const all = await getMenuWithSelections(auth, userId, 'all');
```

## Understanding the Data Structure

### DailyMenuOptions
```typescript
{
  date: "2025-12-25",                    // The date
  foodOptions: [                          // All foods available for this day
    {
      id: "schedule-id-1",
      date: "2025-12-25",
      menu_item: {
        id: "item-1",
        name: "Chicken Rice",
        description: "Grilled chicken..."
      }
    },
    {
      id: "schedule-id-2",
      date: "2025-12-25",
      menu_item: {
        id: "item-2",
        name: "Fish Fillet",
        description: "Pan-seared fish..."
      }
    }
  ],
  selectedFood: {                         // What you selected (if any)
    id: "selection-id",
    user_id: "your-id",
    menu_schedule_id: "schedule-id-1",
    menu_schedule: {
      date: "2025-12-25",
      menu_item: {
        name: "Chicken Rice"
      }
    }
  },
  hasSelection: true                      // Quick check
}
```

## When to Use Raw APIs vs Helper Functions

### Use Helper Functions (Recommended)
- When you want dates grouped by day
- When you want selections combined with available options
- When you need to filter by time periods
- When you want to change a selection
- For most user-facing features

### Use Raw APIs
- When you need maximum performance
- When you're building your own custom logic
- When you need the exact database structure
- For bulk operations where you want full control

## Raw API Examples (For Reference)

```typescript
import { 
  getMenuSchedule,           // Get all available foods
  getUserMenuSelections,     // Get your selections
  createMenuSelection,       // Select a food
  deleteMenuSelection,       // Remove selection
} from '@rastar/mcp-rastar';

// Raw: Get all menu (not grouped by date)
const schedule = await getMenuSchedule(auth);
// Returns: Array of all menu items across all dates

// Raw: Get your selections (not grouped)
const selections = await getUserMenuSelections(auth, userId);
// Returns: Array of your selections

// Raw: Create selection (need to find schedule ID first)
const scheduleItem = schedule.find(s => s.date === '2025-12-25');
await createMenuSelection(auth, userId, scheduleItem.id);

// Raw: Delete selection (need selection ID)
await deleteMenuSelection(auth, 'selection-id');
```

## Complete Example: Weekly Menu Management

```typescript
import { 
  login,
  getThisWeekMenu,
  getUnselectedDays,
  selectFoodByDate,
} from '@rastar/mcp-rastar';

async function manageWeeklyMenu() {
  // Login
  const tokenResponse = await login('user@example.com', 'password');
  const auth = { accessToken: tokenResponse.access_token };
  const userId = tokenResponse.user.id;
  
  // Check this week's menu
  const weekMenu = await getThisWeekMenu(auth, userId);
  
  console.log(`📊 This Week Overview:`);
  console.log(`   ${weekMenu.daysWithSelection}/${weekMenu.totalDays} days selected\n`);
  
  // Find days without selection
  const unselected = await getUnselectedDays(auth, userId, 'this-week');
  
  if (unselected.length === 0) {
    console.log(`✅ All set! You've selected food for every day this week.`);
    return;
  }
  
  console.log(`⚠️  You still need to select food for ${unselected.length} days:\n`);
  
  // Show unselected days
  for (const day of unselected) {
    console.log(`📅 ${day.date}`);
    console.log(`   Available:`);
    day.foodOptions.forEach((food, i) => {
      console.log(`   ${i + 1}. ${food.menu_item.name}`);
    });
    console.log();
  }
  
  // Example: Auto-select first option for remaining days
  // (In real app, you'd ask user to choose)
  for (const day of unselected) {
    const firstOption = day.foodOptions[0];
    await selectFoodByDate(auth, userId, day.date, firstOption.menu_item.name);
    console.log(`✅ Selected ${firstOption.menu_item.name} for ${day.date}`);
  }
}

manageWeeklyMenu().catch(console.error);
```
