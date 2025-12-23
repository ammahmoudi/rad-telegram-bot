# Menu Helper Functions - Usage Examples

## 🚀 Quick Start

```typescript
import { login } from './api/auth.js';
import {
  getCombinedDailyMenu,
  getTodayMenu,
  getCurrentWeekMenu,
  changeMenuSelection,
  getDaysWithoutSelection,
  getSelectionStats,
} from './api/menu-helpers.js';

// Login first
const tokenResponse = await login('your-email@example.com', 'password');
const auth = { accessToken: tokenResponse.access_token };
const userId = tokenResponse.user.id;
```

## 📋 Get Combined Menu (All Foods + Your Selections)

### Get all available menu with your selections

```typescript
const menu = await getCombinedDailyMenu(auth, userId);

// Output example:
[
  {
    date: "2025-12-23",
    foods: [
      {
        scheduleId: "abc123",
        menuItem: { id: "m1", name: "Chicken Rice", description: "..." },
        isSelected: true  // ← You selected this!
      },
      {
        scheduleId: "def456",
        menuItem: { id: "m2", name: "Beef Stew", description: "..." },
        isSelected: false
      },
      {
        scheduleId: "ghi789",
        menuItem: { id: "m3", name: "Fish", description: "..." },
        isSelected: false
      }
    ],
    selectedFood: {  // ← Your current selection for this day
      selectionId: "sel-001",
      scheduleId: "abc123",
      menuItem: { id: "m1", name: "Chicken Rice" }
    }
  },
  {
    date: "2025-12-24",
    foods: [
      {
        scheduleId: "jkl012",
        menuItem: { id: "m4", name: "Pizza", description: "..." },
        isSelected: false
      },
      {
        scheduleId: "mno345",
        menuItem: { id: "m5", name: "Pasta", description: "..." },
        isSelected: false
      }
    ],
    selectedFood: undefined  // ← No selection for this day yet
  }
]
```

## 🗓️ Filter by Date Range

### Get today's menu only

```typescript
const today = await getTodayMenu(auth, userId);

if (today) {
  console.log(`Today (${today.date}) has ${today.foods.length} food options`);
  if (today.selectedFood) {
    console.log(`You selected: ${today.selectedFood.menuItem.name}`);
  } else {
    console.log('You haven\'t selected food for today yet!');
  }
}
```

### Get current week (Monday to Sunday)

```typescript
const thisWeek = await getCurrentWeekMenu(auth, userId);

console.log(`This week has ${thisWeek.length} days with food`);
```

### Get current month

```typescript
const thisMonth = await getCurrentMonthMenu(auth, userId);

console.log(`This month has ${thisMonth.length} days with food`);
```

### Get only future dates (today onwards)

```typescript
const futureMenu = await getFutureMenu(auth, userId);

console.log(`Upcoming meals: ${futureMenu.length} days`);
```

### Get only past dates

```typescript
const pastMenu = await getPastMenu(auth, userId);

console.log(`Past meals: ${pastMenu.length} days`);
```

### Custom date range

```typescript
const customRange = await getCombinedDailyMenu(auth, userId, {
  startDate: '2025-12-20',
  endDate: '2025-12-31'
});
```

## 🔄 Change Your Food Selection

### Method 1: Change by date (automatic delete + create)

```typescript
// Change your selection for Dec 23
// It automatically deletes old selection and creates new one
const newSelection = await changeMenuSelection(
  auth,
  userId,
  '2025-12-23',
  'new-schedule-id'  // The new food's schedule ID
);

console.log('Selection changed!', newSelection);
```

### Method 2: Change by selection ID (more efficient)

```typescript
// If you already know the old selection ID
const newSelection = await changeMenuSelectionById(
  auth,
  userId,
  'old-selection-id',  // Your current selection ID
  'new-schedule-id'    // The new food's schedule ID
);
```

### Complete example: Change today's selection

```typescript
// 1. Get today's menu
const today = await getTodayMenu(auth, userId);

if (!today) {
  console.log('No menu available for today');
} else if (today.foods.length === 0) {
  console.log('No food options for today');
} else {
  // 2. Show current selection
  if (today.selectedFood) {
    console.log(`Current: ${today.selectedFood.menuItem.name}`);
  } else {
    console.log('No selection for today yet');
  }
  
  // 3. Show available options
  console.log('Available foods:');
  today.foods.forEach((food, i) => {
    console.log(`${i + 1}. ${food.menuItem.name} ${food.isSelected ? '✓' : ''}`);
  });
  
  // 4. Change to a different food
  const newFood = today.foods.find(f => f.menuItem.name === 'Fish');
  if (newFood && !newFood.isSelected) {
    await changeMenuSelection(auth, userId, today.date, newFood.scheduleId);
    console.log('Changed to Fish!');
  }
}
```

## 📊 Get Days Without Selection

```typescript
// Get all future days where you haven't selected food yet
const needSelection = await getDaysWithoutSelection(auth, userId, {
  includePast: false
});

console.log(`You need to select food for ${needSelection.length} days:`);
needSelection.forEach(day => {
  console.log(`- ${day.date}: ${day.foods.length} options available`);
});
```

## ✅ Get Days With Selection

```typescript
const withSelection = await getDaysWithSelection(auth, userId, {
  currentMonth: true
});

console.log('Your selections this month:');
withSelection.forEach(day => {
  console.log(`${day.date}: ${day.selectedFood?.menuItem.name}`);
});
```

## 📈 Get Selection Statistics

```typescript
// Get stats for current month
const stats = await getSelectionStats(auth, userId, { currentMonth: true });

console.log(`
Total days with food: ${stats.totalDays}
Selected: ${stats.selectedDays}
Not selected: ${stats.unselectedDays}
Selection rate: ${stats.selectionRate.toFixed(1)}%
`);
```

## 🎯 Real-World Workflow Example

```typescript
async function reviewAndCompleteSelections() {
  // 1. Login
  const tokenResponse = await login('user@example.com', 'password');
  const auth = { accessToken: tokenResponse.access_token };
  const userId = tokenResponse.user.id;
  
  // 2. Get this week's menu
  const thisWeek = await getCurrentWeekMenu(auth, userId);
  
  console.log('=== THIS WEEK\'S MENU ===\n');
  
  for (const day of thisWeek) {
    console.log(`📅 ${day.date}`);
    
    // Show what you selected
    if (day.selectedFood) {
      console.log(`   ✅ Selected: ${day.selectedFood.menuItem.name}`);
    } else {
      console.log(`   ⚠️  No selection yet!`);
    }
    
    // Show all available options
    console.log('   Available:');
    day.foods.forEach((food, i) => {
      const marker = food.isSelected ? '→' : ' ';
      console.log(`   ${marker} ${i + 1}. ${food.menuItem.name}`);
    });
    
    console.log('');
  }
  
  // 3. Check completion status
  const stats = await getSelectionStats(auth, userId, { currentWeek: true });
  console.log(`\n📊 Completion: ${stats.selectionRate.toFixed(0)}%`);
  
  if (stats.unselectedDays > 0) {
    console.log(`⚠️  You still need to select food for ${stats.unselectedDays} days`);
  } else {
    console.log('✅ All selections complete!');
  }
}
```

## 🔍 Check If Selection Exists for a Date

```typescript
const hasSelection = await hasSelectionForDate(auth, userId, '2025-12-25');

if (hasSelection) {
  console.log('You already selected food for Dec 25');
} else {
  console.log('Please select food for Dec 25');
}
```

## 💡 Best Practices

1. **Always check if `selectedFood` exists** before accessing it
2. **Use filters** to reduce API calls and get only what you need
3. **Use `changeMenuSelection()`** instead of manually delete + create
4. **Check `isSelected`** flag to highlight the selected food in UI
5. **Group by date** is already done for you - each day has multiple foods together
