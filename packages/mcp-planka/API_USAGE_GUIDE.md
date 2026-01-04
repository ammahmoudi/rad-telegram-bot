# API Usage Guide - Optimized → Helpers → Raw

## Quick Decision Tree

```
Need to do something?
│
├─> Check Optimized API first (src/api-optimized/)
│   ├─> ✅ Available? Use it! (1 API call)
│   └─> ❌ Not available? → Next step
│
├─> Check Helpers (src/helpers/)
│   ├─> ✅ Function exists? Use it! (handles complexity)
│   └─> ❌ Not covered? → Next step
│
└─> Use Raw API (src/api/)
    └─> ✅ Direct control (may need multiple calls)
```

## Layer 1: Optimized API (PREFERRED - When Available)

**Status**: ⚠️ Backend not implemented yet (as of Jan 2026)
**Check availability**: `checkOptimizedEndpointsAvailable(auth)`

### What It Covers

| Use Case | Function | Replaces |
|----------|----------|----------|
| **Filter cards across projects** | `filterCards(auth, options)` | 21+ API calls |
| **Get user actions/activity** | `getUserActions(auth, {userId, ...})` | 10+ API calls |
| **Get system history** | `getHistory(auth, options)` | 15+ API calls |
| **Get combined feed** | `getFeed(auth, options)` | 40+ API calls |
| **Search users** | `searchUsers(auth, query, limit)` | Multiple queries |
| **Search projects** | `searchProjects(auth, query, limit)` | Multiple queries |
| **Search boards** | `searchBoards(auth, query, limit)` | Multiple queries |
| **Search lists** | `searchLists(auth, query, limit)` | Multiple queries |
| **Search cards** | `searchCards(auth, query, limit)` | Multiple queries |
| **Global search** | `globalSearch(auth, {query, types, limit})` | All searches |

### When to Use

```typescript
import { checkOptimizedEndpointsAvailable, filterCards } from '@rad/mcp-planka/api-optimized';

// Always check first!
const optimizedAvailable = await checkOptimizedEndpointsAvailable(auth);

if (optimizedAvailable) {
  // ✅ Use optimized - MUCH faster!
  const cards = await filterCards(auth, {
    projectIds: ['proj1', 'proj2'],
    assignedToUserId: 'user123',
    status: 'open',
    dueDateFrom: '2026-01-01',
    dueDateTo: '2026-12-31',
    sortBy: 'dueDate',
    sortOrder: 'asc',
    page: 1,
    pageSize: 50
  });
} else {
  // ❌ Fall back to helper
  const cards = await getUserCards(auth, { userId: 'user123', status: 'not_done' });
}
```

### Benefits

- ⚡ **10-40x faster** (1 API call vs 10-40 calls)
- 🔍 **Rich filtering** (17+ parameters for cards)
- 📄 **Built-in pagination**
- 🎯 **Server-side filtering** (not client-side)

---

## Layer 2: Helpers (RECOMMENDED - Use Now)

**Status**: ✅ Production-ready, works today
**Location**: `src/helpers/`

### What It Covers

#### 🎯 User Tasks & Cards

```typescript
import { getUserCards } from '@rad/mcp-planka/helpers';

// Get all user's cards with full context (projects, boards, lists)
const cards = await getUserCards(auth, {
  userId: 'me',
  status: 'not_done', // 'not_done', 'done', 'all'
  sortBy: 'dueDate', // 'dueDate', 'createdAt', 'name'
  includeProjects: true,
  includeBoards: true
});
```

**Functions:**
- `getUserCards(auth, options)` - Get user's cards with context
- `getCardHistory(auth, cardId)` - Card's action history

#### 📅 Daily Reports

```typescript
import { getUserDailyReports, getMissingDailyReports } from '@rad/mcp-planka/helpers';

// Get daily report cards for date range
const reports = await getUserDailyReports(auth, {
  userId: 'me',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  includeCompleted: true
});

// Find missing daily reports
const missing = await getMissingDailyReports(auth, {
  userId: 'me',
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});
```

**Functions:**
- `getUserDailyReports(auth, options)` - Get daily reports
- `getMissingDailyReports(auth, options)` - Find gaps
- `generateDailyReportFromTasks(auth, options)` - Auto-generate from tasks
- `createDailyReportCard(auth, options)` - Create new report

#### 👤 User Activity

```typescript
import { getUserNotifications, getUserActions, getUserActivitySummary } from '@rad/mcp-planka/helpers';

// Get filtered notifications
const notifications = await getUserNotifications(auth, {
  userId: 'me',
  unreadOnly: true,
  limit: 10
});

// Get user actions with filters
const actions = await getUserActions(auth, {
  userId: 'me',
  actionTypes: ['createCard', 'moveCard'],
  fromDate: '2026-01-01',
  limit: 50
});

// Get combined summary
const summary = await getUserActivitySummary(auth, {
  userId: 'me',
  includeNotifications: true,
  includeActions: true,
  limit: 20
});
```

**Functions:**
- `getUserNotifications(auth, options)` - Filtered notifications
- `getUserActions(auth, options)` - User actions with filters
- `getUserActivitySummary(auth, options)` - Combined view

#### 🔍 Search

```typescript
import { searchUsers, searchProjects, searchCards, globalSearch } from '@rad/mcp-planka/helpers';

// Search specific entity
const users = await searchUsers(auth, { query: 'john', limit: 10 });
const projects = await searchProjects(auth, { query: 'website', limit: 5 });
const cards = await searchCards(auth, { 
  query: 'bug',
  projectId: 'proj123',
  boardId: 'board456',
  limit: 20
});

// Global search across everything
const results = await globalSearch(auth, {
  query: 'payment',
  searchIn: ['users', 'projects', 'boards', 'cards', 'tasks'],
  limit: 10
});
```

**Functions:**
- `searchUsers(auth, options)` - Find users
- `searchProjects(auth, options)` - Find projects
- `searchBoards(auth, options)` - Find boards
- `searchCards(auth, options)` - Find cards
- `searchTasks(auth, options)` - Find tasks
- `globalSearch(auth, options)` - Search everything

#### 📊 Project & Board Status

```typescript
import { getProjectStatus, getBoardStatus } from '@rad/mcp-planka/helpers';

// Get full project overview
const projectStatus = await getProjectStatus(auth, {
  projectId: 'proj123',
  includeMembers: true,
  includeStats: true
});

// Get board status with metrics
const boardStatus = await getBoardStatus(auth, {
  boardId: 'board456',
  includeCards: true,
  includeStats: true
});
```

**Functions:**
- `getProjectStatus(auth, options)` - Project overview
- `getBoardStatus(auth, options)` - Board metrics

#### 📝 Card Management

```typescript
import { 
  createNewCard,
  updateCardDetails,
  moveCardToList,
  assignUserToCard,
  createMultipleCards
} from '@rad/mcp-planka/helpers';

// Create card with full details
const card = await createNewCard(auth, {
  listId: 'list123',
  name: 'New Task',
  description: 'Description',
  dueDate: '2026-01-15',
  assignedUserIds: ['user1', 'user2'],
  labelIds: ['label1'],
  position: 0
});

// Bulk create
const cards = await createMultipleCards(auth, [
  { listId: 'list123', name: 'Task 1' },
  { listId: 'list123', name: 'Task 2' }
]);
```

**Functions:**
- `createNewCard(auth, options)` - Create with details
- `updateCardDetails(auth, cardId, updates)` - Update card
- `moveCardToList(auth, cardId, listId, position)` - Move card
- `assignUserToCard(auth, cardId, userId)` - Assign user
- `unassignUserFromCard(auth, cardId, userId)` - Remove user
- `copyCard(auth, cardId)` - Duplicate card
- `createMultipleCards(auth, cards)` - Bulk create
- `getCardsInList(auth, listId)` - List all cards

#### 📋 List Management

```typescript
import { 
  createBoardList,
  getBoardLists,
  moveAllCards,
  clearListCards 
} from '@rad/mcp-planka/helpers';

// Create list
const list = await createBoardList(auth, {
  boardId: 'board123',
  name: 'In Progress',
  position: 1
});

// Move all cards between lists
await moveAllCards(auth, {
  fromListId: 'list1',
  toListId: 'list2'
});
```

**Functions:**
- `createBoardList(auth, options)` - Create list
- `getBoardLists(auth, boardId)` - Get all lists
- `updateBoardList(auth, listId, updates)` - Update list
- `archiveBoardList(auth, listId)` - Archive list
- `deleteBoardList(auth, listId)` - Delete list
- `moveAllCards(auth, options)` - Bulk move
- `clearListCards(auth, listId)` - Clear all cards
- `sortListCards(auth, listId)` - Sort cards
- `createMultipleLists(auth, lists)` - Bulk create

#### 👥 Board Membership

```typescript
import { 
  getBoardMembers,
  addUserToBoard,
  addMultipleUsersToBoard 
} from '@rad/mcp-planka/helpers';

// Get board members
const members = await getBoardMembers(auth, 'board123');

// Add multiple users at once
await addMultipleUsersToBoard(auth, {
  boardId: 'board123',
  userIds: ['user1', 'user2', 'user3'],
  role: 'editor'
});
```

**Functions:**
- `getBoardMembers(auth, boardId)` - List members
- `addUserToBoard(auth, boardId, userId, role)` - Add member
- `removeUserFromBoard(auth, boardId, userId)` - Remove member
- `updateBoardMemberPermissions(auth, membershipId, updates)` - Change permissions
- `getAvailableUsersForBoard(auth, boardId)` - Available users
- `addMultipleUsersToBoard(auth, options)` - Bulk add
- `getUserBoardMembership(auth, userId, boardId)` - Check membership

### When to Use Helpers

✅ **Use helpers when:**
- You need common workflows (user cards, daily reports, search)
- You want enriched data (cards with project/board info)
- You need filtering/sorting client-side
- Optimized endpoints aren't available yet

❌ **Don't use helpers when:**
- You need a very specific API call not covered
- You need raw response data without processing
- You're implementing new helper functions

---

## Layer 3: Raw API (DIRECT CONTROL)

**Status**: ✅ Production-ready
**Location**: `src/api/`
**Coverage**: 145+ endpoints (93% of Planka API)

### When to Use Raw API

Use raw API when:
1. **No helper exists** for your use case
2. **No optimized endpoint** available yet
3. Need **direct control** over API calls
4. Building **new helpers** on top of raw API

### Example Use Cases

#### Authentication

```typescript
import { login, refreshToken } from '@rad/mcp-planka/api';

const tokens = await login(auth, email, password);
```

#### Project Management

```typescript
import { listProjects, createProject, updateProject, deleteProject } from '@rad/mcp-planka/api';

const projects = await listProjects(auth);
const project = await createProject(auth, { name: 'New Project' });
await updateProject(auth, projectId, { name: 'Updated' });
await deleteProject(auth, projectId);
```

#### Board Operations

```typescript
import { getBoard, createBoard, updateBoard, duplicateBoard } from '@rad/mcp-planka/api';

const board = await getBoard(auth, boardId);
const newBoard = await createBoard(auth, projectId, { name: 'Sprint 1' });
const duplicate = await duplicateBoard(auth, boardId, 'Sprint 2');
```

#### List Operations

```typescript
import { createList, updateList, deleteList, clearList } from '@rad/mcp-planka/api';

const list = await createList(auth, { boardId, name: 'Todo', position: 0 });
await updateList(auth, listId, { name: 'Updated' });
await clearList(auth, listId); // Remove all cards
await deleteList(auth, listId);
```

#### Card Operations

```typescript
import { createCard, updateCard, getCard, moveCard, deleteCard } from '@rad/mcp-planka/api';

const card = await createCard(auth, { listId, name: 'Task', position: 0 });
await updateCard(auth, cardId, { description: 'Details' });
await moveCard(auth, cardId, newListId, position);
await deleteCard(auth, cardId);
```

#### Labels

```typescript
import { getLabels, createLabel, assignLabelToCard } from '@rad/mcp-planka/api';

const labels = await getLabels(auth, boardId);
const label = await createLabel(auth, { boardId, name: 'Bug', color: 'red' });
await assignLabelToCard(auth, cardId, labelId);
```

#### Tasks

```typescript
import { createTaskList, createTask, updateTask } from '@rad/mcp-planka/api';

const taskList = await createTaskList(auth, { cardId, name: 'Checklist' });
const task = await createTask(auth, { taskListId, name: 'Step 1' });
await updateTask(auth, taskId, { isCompleted: true });
```

#### Comments

```typescript
import { getComments, createComment, updateComment } from '@rad/mcp-planka/api';

const comments = await getComments(auth, cardId);
const comment = await createComment(auth, cardId, 'Great work!');
await updateComment(auth, commentId, 'Updated comment');
```

#### Users & Teams

```typescript
import { listUsers, createUser, listTeams, createTeam } from '@rad/mcp-planka/api';

const users = await listUsers(auth);
const user = await createUser(auth, { email, name, username, password });

const teams = await listTeams(auth);
const team = await createTeam(auth, name, description);
```

#### Notifications

```typescript
import { getNotifications, markAllNotificationsAsRead } from '@rad/mcp-planka/api';

const notifications = await getNotifications(auth);
await markAllNotificationsAsRead(auth);
```

#### Actions & Activity

```typescript
import { getBoardActions, getCardActions } from '@rad/mcp-planka/api';

const boardActions = await getBoardActions(auth, boardId);
const cardActions = await getCardActions(auth, cardId);
```

---

## Complete Usage Example

```typescript
import { PlankaAuth } from '@rad/mcp-planka';
import { checkOptimizedEndpointsAvailable, filterCards } from '@rad/mcp-planka/api-optimized';
import { getUserCards } from '@rad/mcp-planka/helpers';
import { listProjects, getBoard } from '@rad/mcp-planka/api';

const auth: PlankaAuth = {
  plankaBaseUrl: 'https://planka.example.com',
  accessToken: 'your-token'
};

// Example: Get user's overdue cards

async function getOverdueCards(userId: string) {
  const today = new Date().toISOString();
  
  // Step 1: Try optimized API first
  const optimizedAvailable = await checkOptimizedEndpointsAvailable(auth);
  
  if (optimizedAvailable) {
    console.log('✅ Using optimized API (1 call)');
    return await filterCards(auth, {
      assignedToUserId: userId,
      status: 'open',
      dueDateTo: today,
      isDueCompleted: false,
      sortBy: 'dueDate',
      sortOrder: 'asc',
      pageSize: 100
    });
  }
  
  // Step 2: Fall back to helper
  console.log('⚠️ Using helper (10+ calls)');
  const cards = await getUserCards(auth, {
    userId,
    status: 'not_done'
  });
  
  // Client-side filter for overdue
  return cards.filter(card => 
    card.dueDate && 
    new Date(card.dueDate) < new Date() &&
    !card.isDueCompleted
  );
}

// Example: Custom operation needing raw API

async function createProjectWithBoards(name: string, boardNames: string[]) {
  // No helper for this, use raw API
  const project = await createProject(auth, { name });
  
  const boards = [];
  for (const boardName of boardNames) {
    const board = await createBoard(auth, project.id, { 
      name: boardName,
      position: boards.length 
    });
    boards.push(board);
  }
  
  return { project, boards };
}
```

---

## Decision Matrix

| Task | Use Optimized? | Use Helper? | Use Raw? |
|------|----------------|-------------|----------|
| Filter cards across projects | ✅ YES (when available) | ⚠️ Fallback | ❌ |
| Get user's daily reports | ❌ | ✅ YES | ❌ |
| Get user's cards with context | ✅ Try first | ✅ YES (fallback) | ❌ |
| Search users/projects/cards | ✅ YES (when available) | ✅ YES (fallback) | ❌ |
| Get activity feed | ✅ YES (when available) | ✅ YES (fallback) | ❌ |
| Create project | ❌ | ❌ | ✅ YES |
| Create board | ❌ | ❌ | ✅ YES |
| Create card | ❌ | ⚠️ createNewCard | ✅ YES |
| Update card | ❌ | ⚠️ updateCardDetails | ✅ YES |
| Add board member | ❌ | ✅ addUserToBoard | ⚠️ Fallback |
| Create multiple cards | ❌ | ✅ createMultipleCards | ❌ |
| Get project status | ❌ | ✅ getProjectStatus | ❌ |
| Get missing daily reports | ❌ | ✅ getMissingDailyReports | ❌ |
| Complex custom workflow | ❌ | ❌ | ✅ YES |

---

## Best Practices

### 1. Always Check Optimized Availability

```typescript
// Cache the result at app startup
let optimizedAPIAvailable: boolean | null = null;

async function isOptimizedAPIAvailable(auth: PlankaAuth): Promise<boolean> {
  if (optimizedAPIAvailable === null) {
    optimizedAPIAvailable = await checkOptimizedEndpointsAvailable(auth);
    console.log(`Optimized API: ${optimizedAPIAvailable ? '✅ Available' : '❌ Not available'}`);
  }
  return optimizedAPIAvailable;
}
```

### 2. Prefer Helpers Over Raw API

```typescript
// ❌ DON'T do this
const projects = await listProjects(auth);
const boards = await Promise.all(projects.map(p => getBoard(auth, p.id)));
const cards = await Promise.all(boards.map(b => getCardsInBoard(auth, b.id)));
// ... 50+ API calls

// ✅ DO this
const cards = await getUserCards(auth, { userId: 'me' });
// Helper handles all the complexity
```

### 3. Build New Helpers from Raw API

```typescript
// When creating new functionality, use raw API
export async function getProjectTeamMembers(
  auth: PlankaAuth,
  projectId: string
): Promise<PlankaUser[]> {
  // Use raw API to build higher-level function
  const project = await getProject(auth, projectId);
  const boards = await listBoards(auth, projectId);
  const allMembers = new Map<string, PlankaUser>();
  
  for (const board of boards) {
    const members = await getBoardMembers(auth, board.id);
    members.forEach(m => allMembers.set(m.id, m));
  }
  
  return Array.from(allMembers.values());
}
```

### 4. Handle Errors Gracefully

```typescript
async function getSafeUserCards(userId: string) {
  try {
    if (await isOptimizedAPIAvailable(auth)) {
      return await filterCards(auth, { assignedToUserId: userId });
    }
  } catch (error) {
    console.warn('Optimized API failed, falling back to helper', error);
  }
  
  try {
    return await getUserCards(auth, { userId });
  } catch (error) {
    console.error('Helper failed, cannot retrieve cards', error);
    throw error;
  }
}
```

---

## Summary

**Your Strategy:**
1. ⚡ **Try Optimized API** → Fastest, fewest calls (when available)
2. 🎯 **Use Helpers** → Easy, production-ready (use now)
3. 🔧 **Fall back to Raw** → Direct control, build new features

**Current Reality (Jan 2026):**
- Optimized API: ❌ Not available on backend yet
- Helpers: ✅ Use these now!
- Raw API: ✅ For everything else

**Future (when optimized endpoints available):**
- Check `checkOptimizedEndpointsAvailable()` at startup
- Use optimized endpoints for covered operations
- Keep helpers as fallback for compatibility
