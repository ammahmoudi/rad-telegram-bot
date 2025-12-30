# 🔥 Legendary getUserCards Refactoring

**Date:** 2025-12-30  
**Status:** ✅ Complete

## Summary

Refactored the Planka MCP user tasks module to make `getUserCards()` a **legendary all-in-one function** that can optionally include full task items and card history, eliminating the need for separate tool calls.

---

## Changes Made

### 1. **Enhanced `getUserCards()` Helper**
📍 `packages/mcp-planka/src/helpers/user-tasks.ts`

**New Capabilities:**
- ✅ **`includeTasks: boolean`** - Include full task items (checklist items) for each card
- ✅ **`includeHistory: boolean`** - Include complete action history for each card

**Type Updates:**
```typescript
// FilterOptions extended with:
includeTasks?: boolean;      // Default: false (only summary)
includeHistory?: boolean;    // Default: false

// EnrichedCard extended with:
taskItems?: Array<{          // Full task items when requested
  id: string;
  name: string;
  isCompleted: boolean;
  position: number;
  taskListId: string;
  taskListName: string;
}>;
history?: Array<{            // Action history when requested
  id: string;
  type: string;
  data: any;
  userId: string;
  createdAt: string;
}>;
```

### 2. **Deprecated `getUserTasks()`**
- ❌ Removed from active helpers
- 📦 Backed up to `src/helpers/backup/user-tasks-standalone.ts`
- ℹ️ Marked as deprecated with migration instructions

### 3. **Removed `planka_get_user_tasks` Tool**
**Before:** 22 tools (3 user-tasks tools)
- `planka_get_user_cards`
- ~~`planka_get_user_tasks`~~ ← **REMOVED**
- `planka_get_card_history`

**After:** 21 tools (2 user-tasks tools)
- `planka_get_user_cards` ← **Now legendary!**
- `planka_get_card_history` ← Still standalone

### 4. **Updated Search Module**
📍 `packages/mcp-planka/src/helpers/search.ts`

`searchTasks()` now uses:
```typescript
// OLD: const tasks = await getUserTasks(auth);
// NEW: 
const cards = await getUserCards(auth, undefined, { includeTasks: true });
const tasks = cards.flatMap(card => card.taskItems || []);
```

### 5. **Updated Old Tool Backup**
📍 `packages/mcp-planka/src/tools-backup-20251229-182742/tool-handlers.ts`

Old `planka.helper.getUserTasks` now proxies to `getUserCards()` with `includeTasks: true` for backward compatibility.

---

## Migration Guide

### For AI Tool Calls

**Before:**
```javascript
// Separate calls needed
const cards = await planka_get_user_cards({ userId: "123" });
const tasks = await planka_get_user_tasks({ userId: "123" });
const history = await planka_get_card_history({ cardId: "card_456" });
```

**After:**
```javascript
// Single legendary call
const cards = await planka_get_user_cards({ 
  userId: "123",
  filter: {
    includeTasks: true,      // ← Get full task items
    includeHistory: true     // ← Get action history
  }
});

// Each card now has taskItems[] and history[]
```

### For Direct Code Usage

**Before:**
```typescript
import { getUserCards, getUserTasks } from './helpers';

const cards = await getUserCards(auth);
const tasks = await getUserTasks(auth);
```

**After:**
```typescript
import { getUserCards } from './helpers';

const cards = await getUserCards(auth, undefined, { 
  includeTasks: true,
  includeHistory: true 
});

// Access: cards[0].taskItems, cards[0].history
```

---

## Benefits

### 🚀 **Performance**
- Fewer API calls (single call vs multiple calls)
- Optional features - only fetch what you need

### 🎯 **Developer Experience**
- One function to rule them all
- Cleaner API surface (22 → 21 tools)
- Better discoverability

### 🤖 **AI Efficiency**
- Fewer tool calls = faster responses
- Less context switching
- More complete data in single response

### 📦 **Maintainability**
- Centralized card logic
- Backward compatible (backup preserved)
- Clear deprecation path

---

## Example Use Cases

### 1. Get Cards with Task Details
```typescript
const cards = await getUserCards(auth, "user_123", {
  includeTasks: true,
  projectId: "proj_456",
  done: false  // Only incomplete cards
});

// Result:
cards[0].taskItems = [
  { id: "t1", name: "Write tests", isCompleted: false },
  { id: "t2", name: "Code review", isCompleted: true }
];
```

### 2. Get Cards with Full History
```typescript
const cards = await getUserCards(auth, "me", {
  includeHistory: true,
  boardId: "board_789"
});

// Result:
cards[0].history = [
  { type: "createCard", userId: "...", createdAt: "..." },
  { type: "moveCard", data: {...}, createdAt: "..." }
];
```

### 3. Get Everything (Legendary Mode!)
```typescript
const cards = await getUserCards(auth, undefined, {
  includeTasks: true,
  includeHistory: true,
  search: "urgent"
});

// Full card data + tasks + history in one call!
```

---

## Files Changed

### Created
- `src/helpers/backup/user-tasks-standalone.ts` - Backup of deprecated function

### Modified
- `src/helpers/user-tasks.ts` - Enhanced getUserCards, removed getUserTasks
- `src/helpers/types.ts` - Added optional fields to FilterOptions and EnrichedCard
- `src/helpers/search.ts` - Updated to use getUserCards with includeTasks
- `src/tools/user-tasks.tools.ts` - Removed getUserTasks tool, updated descriptions
- `src/tools-backup-20251229-182742/tool-handlers.ts` - Updated for compatibility

### Unchanged
- `getCardHistory()` - Still available as standalone function
- All other helper modules work as before

---

## Tool Count

**Total Planka MCP Tools:**
- Before: 22 tools
- After: 21 tools

**User Tasks Category:**
- Before: 3 tools (getUserCards, getUserTasks, getCardHistory)
- After: 2 tools (getUserCards 🔥, getCardHistory)

---

## Testing

✅ **Build:** Successful  
✅ **TypeScript:** No errors  
✅ **Backward Compatibility:** Old backup tools still work  
✅ **Runtime:** Ready for testing

---

## Next Steps

1. ✅ Build successful
2. ⏳ Test with live bot
3. ⏳ Monitor AI usage patterns
4. ⏳ Update documentation if needed

---

## Rollback Plan

If needed, restore from backup:
1. Copy `src/helpers/backup/user-tasks-standalone.ts` → `src/helpers/user-tasks.ts`
2. Restore `getUserTasks` export in `src/helpers/index.ts`
3. Restore `planka_get_user_tasks` tool in `src/tools/user-tasks.tools.ts`
4. Rebuild

---

**Made with ❤️ by Amirhossein - Making Planka MCP legendary, one function at a time!** 🚀
