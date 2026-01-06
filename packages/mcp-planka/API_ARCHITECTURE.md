# API Architecture Guide

## Overview

The MCP Planka package has three API layers:

### 1. **Raw API (`src/api/`)** - Direct Planka API Calls
- **Purpose**: 1:1 mapping to Planka REST API endpoints
- **Use when**: You need direct control over API calls
- **Examples**: `getProjects()`, `getBoards()`, `getCards()`, `createCard()`
- **Pros**: Full control, matches Planka docs exactly
- **Cons**: Requires multiple calls for complex operations

### 2. **Helpers (`src/helpers/`)** - High-Level Business Logic
- **Purpose**: Combine multiple raw API calls into useful operations
- **Use when**: You want common workflows without managing multiple calls
- **Examples**:
  - `getUserCards()` - Gets user's cards with full context (21+ API calls internally)
  - `getUserDailyReports()` - Fetch daily report cards with dates/tasks
  - `getUserActivitySummary()` - Get user's actions and notifications
  - `getProjectStatus()` - Full project status with boards/lists/cards
  - `searchCards()` - Search across all cards with enriched data
- **Pros**: Easy to use, handles complexity for you, production-ready
- **Cons**: Less flexible than raw API

### 3. **Optimized API (`src/api-optimized/`)** - NEW Backend Endpoints
- **Purpose**: Use optimized Planka endpoints from api-docs.json
- **Status**: ⚠️ **NOT YET AVAILABLE** - endpoints documented in api-docs.json but NOT implemented on backend
- **Backend Status**: Tested against `https://pm-dev.rastar.dev` - returns 404
- **Examples**:
  - `filterCards()` - GET /cards/filter (would replace 21+ calls with 1)
  - `getFeed()` - GET /feed (would replace 40+ calls with 1)
  - `getUserActions()` - GET /users/{id}/actions
  - `getHistory()` - GET /history
  - Search endpoints: `/users/search`, `/projects/search`, `/boards/search`, `/cards/search`, `/search`
- **Pros**: Will be extremely efficient when available, single API calls instead of dozens
- **Cons**: ❌ Not implemented on backend yet - use Helpers instead
- **Availability Check**: Use `checkOptimizedEndpointsAvailable(auth)` to test your backend

## Which Should You Use?

### For **Production Use Now** → Use **Helpers**
```typescript
import { getUserCards, getUserDailyReports, getProjectStatus } from '@rad/mcp-planka';

// Get all user's cards with full context (handles 21+ API calls internally)
const cards = await getUserCards(auth, { userId: 'me', status: 'not_done' });

// Get daily reports for a date range
const reports = await getUserDailyReports(auth, { userId: 'me', startDate: '2026-01-01' });
```

### For **Future Optimization** → Use **api-optimized**
```typescript
import { filterCards, getFeed } from '@rad/mcp-planka/api-optimized';

// Once backend implements GET /cards/filter, this will replace 21+ calls with 1
const cards = await filterCards(auth, { 
  assignedToUserId: 'me', 
  status: 'open',
  sortBy: 'dueDate' 
});

// Once backend implements GET /feed
const feed = await getFeed(auth, { types: ['action', 'notification'] });
```

### For **Custom Workflows** → Use **Raw API**
```typescript
import { getProjects, getBoards, getCards } from '@rad/mcp-planka';

// Build your own custom logic
const projects = await getProjects(auth);
for (const project of projects) {
  const boards = await getBoards(auth, project.id);
  // ... custom logic
}
```

## Migration Path

### Current State (Today)
```typescript
// Use helpers - they work with current Planka backend
import { getUserCards } from '@rad/mcp-planka';
const cards = await getUserCards(auth, { userId: 'me' });
// Makes 21+ API calls internally but handles it for you
```

### Future State (When optimized endpoints are deployed)
```typescript
// Helpers will automatically detect and use optimized endpoints
import { getUserCards } from '@rad/mcp-planka';
const cards = await getUserCards(auth, { userId: 'me' });
// Will check if GET /cards/filter exists
// If yes: makes 1 API call
// If no: falls back to 21+ calls (backward compatible)
```

### Direct Use (When endpoints are ready)
```typescript
// Or use optimized API directly for maximum control
import { filterCards, checkOptimizedEndpointsAvailable } from '@rad/mcp-planka/api-optimized';

if (await checkOptimizedEndpointsAvailable(auth)) {
  const cards = await filterCards(auth, { assignedToUserId: 'me' });
} else {
  // Fallback to helpers
  const cards = await getUserCards(auth, { userId: 'me' });
}
```

## Testing Optimized APIs

The optimized APIs have tests that:
1. **Unit tests** - Verify correct parameter building
2. **Integration tests** - Check against live backend (may fail until endpoints are deployed)

To test if optimized endpoints are available on your backend:
```typescript
import { checkOptimizedEndpointsAvailable } from '@rad/mcp-planka/api-optimized';

const available = await checkOptimizedEndpointsAvailable(auth);
console.log('Optimized endpoints available:', available);
// false = not implemented yet, use helpers
// true = implemented, can use api-optimized directly
```

## Recommendation

**Use Helpers for everything right now.** They provide:
- ✅ Full functionality today
- ✅ Automatic optimization when backend is ready
- ✅ Battle-tested, production-ready code
- ✅ Backward compatible

The optimized API endpoints are documented and ready in the code, but your Planka backend needs to implement them first. Once deployed, helpers can be updated to use them automatically.
