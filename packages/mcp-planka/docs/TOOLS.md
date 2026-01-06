# 🛠️ Planka MCP Tools Reference

Complete reference for all 16 MCP tools provided by the Planka MCP server.

---

## 📋 Table of Contents

- [Overview](#overview)
- [User Cards (2 tools)](#-user-cards)
- [User Activity (3 tools)](#-user-activity)
- [Project Status (2 tools)](#-project-status)
- [Daily Reports (3 tools)](#-daily-reports)
- [Search (6 tools)](#-search)
- [Common Parameters](#common-parameters)
- [Error Handling](#error-handling)

---

## Overview

All tools require **authentication** via `PlankaAuth` object:
```typescript
{
  plankaUrl: string;     // e.g., "https://planka.yourdomain.com"
  accessToken: string;   // User's Planka access token
}
```

Tools follow naming convention: `planka_<category>_<action>`

---

## 📊 User Cards

### `planka_get_user_cards`

Get all cards assigned to a user with advanced filtering and sorting.

**Description:**
Returns enriched card data including project context, board name, list name, labels, members, due dates, and task statistics. Can optionally include full task items and action history.

**Parameters:**
```typescript
{
  userId?: string;           // User ID (omit for current user)
  filter?: {
    projectId?: string;      // Filter by project
    boardId?: string;        // Filter by board
    listId?: string;         // Filter by list
    isCompleted?: boolean;   // Filter by completion status
    hasDescription?: boolean; // Filter cards with description
    hasAttachments?: boolean; // Filter cards with attachments
    hasTasks?: boolean;      // Filter cards with tasks
    dueDate?: {
      before?: string;       // ISO date string
      after?: string;        // ISO date string
    };
    includeTasks?: boolean;  // Include full task items (default: false)
    includeHistory?: boolean; // Include action history (default: false)
  };
  sort?: {
    by: 'name' | 'createdAt' | 'updatedAt' | 'dueDate' | 'position';
    order: 'asc' | 'desc';   // Default: 'asc'
  };
}
```

**Returns:**
```typescript
Array<{
  id: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  position: number;
  
  // Context
  projectId: string;
  projectName: string;
  boardId: string;
  boardName: string;
  listId: string;
  listName: string;
  
  // Metadata
  labels: Array<{ id: string; name: string; color: string }>;
  members: Array<{ id: string; name: string; username: string }>;
  attachmentCount: number;
  commentCount: number;
  
  // Task statistics (always included)
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  
  // Optional extended data
  taskItems?: Array<{          // If includeTasks: true
    id: string;
    name: string;
    isCompleted: boolean;
    position: number;
    taskListId: string;
    taskListName: string;
  }>;
  
  history?: Array<{            // If includeHistory: true
    id: string;
    type: string;
    data: any;
    userId: string;
    createdAt: string;
  }>;
  
  createdAt: string;
  updatedAt: string;
}>
```

**Example:**
```typescript
// Get all incomplete cards with due dates
const urgentCards = await mcp.callTool('planka_get_user_cards', {
  filter: {
    isCompleted: false,
    dueDate: { before: '2025-12-31' }
  },
  sort: { by: 'dueDate', order: 'asc' }
});

// Get cards with full task items and history
const detailedCards = await mcp.callTool('planka_get_user_cards', {
  userId: 'user-123',
  filter: {
    projectId: 'proj-456',
    includeTasks: true,
    includeHistory: true
  }
});
```

---

### `planka_get_card_history`

Get complete action history for a specific card.

**Parameters:**
```typescript
{
  cardId: string;  // Required: Card ID
}
```

**Returns:**
```typescript
Array<{
  id: string;
  type: string;  // e.g., 'createCard', 'updateCard', 'commentCard', 'moveCard'
  data: any;     // Action-specific data
  userId: string;
  userName: string;
  createdAt: string;
}>
```

**Example:**
```typescript
const history = await mcp.callTool('planka_get_card_history', {
  cardId: 'card-abc-123'
});
```

---

## 👤 User Activity

### `planka_get_user_notifications`

Get all notifications for a user.

**Parameters:**
```typescript
{
  userId?: string;     // User ID (omit for current user)
  unreadOnly?: boolean; // Filter unread notifications (default: false)
}
```

**Returns:**
```typescript
Array<{
  id: string;
  cardId: string;
  cardName: string;
  actionType: string;
  actorId: string;
  actorName: string;
  isRead: boolean;
  createdAt: string;
}>
```

**Example:**
```typescript
const unreadNotifs = await mcp.callTool('planka_get_user_notifications', {
  unreadOnly: true
});
```

---

### `planka_get_user_actions`

Get all actions/activities performed BY a user (things the user DID - cards created, comments posted, tasks completed, etc.). Supports filtering by date range, project, and board.

**Parameters:**
```typescript
{
  userId?: string;    // User ID (omit for current user)
  startDate?: string; // Start date filter (ISO format, e.g., "2024-01-01")
  endDate?: string;   // End date filter (ISO format, e.g., "2024-01-31")
  projectId?: string; // Filter by specific project ID
  boardId?: string;   // Filter by specific board ID
  limit?: number;     // Maximum number of actions to return
}
```

**Returns:**
```typescript
Array<{
  id: string;
  type: string;
  data: any;
  cardId: string;
  cardName: string;
  boardId: string;
  boardName: string;
  projectId: string;
  projectName: string;
  actorId: string;
  actorName: string;
  createdAt: string;
}>
```

**Example:**
```typescript
// Get all actions for a user
const actions = await mcp.callTool('planka_get_user_actions', {
  userId: 'user-123'
});

// Get actions for current user this week
const weekActions = await mcp.callTool('planka_get_user_actions', {
  startDate: '2025-01-20',
  endDate: '2025-01-26'
});

// Get actions for specific project
const projectActions = await mcp.callTool('planka_get_user_actions', {
  projectId: 'proj-456',
  limit: 50
});
```

---

### `planka_get_user_activity_summary`

Get complete activity summary for a user - includes both actions they performed (what they DID) AND notifications they received (what happened TO them) in one call. Returns activity, notifications, and summary statistics. Perfect for dashboard views.

**Parameters:**
```typescript
{
  userId?: string;               // User ID (omit for current user)
  startDate?: string;            // Start date for actions filter (ISO format)
  endDate?: string;              // End date for actions filter (ISO format)
  unreadNotificationsOnly?: boolean; // Only return unread notifications (default: false)
  includeActivity?: boolean;     // Include action items (default: true)
  includeNotifications?: boolean; // Include notifications (default: true)
}
```

**Returns:**
```typescript
{
  userId: string;
  userName: string;
  activity: Array<{
    id: string;
    type: string;
    data: any;
    cardId: string;
    cardName: string;
    boardId: string;
    boardName: string;
    projectId: string;
    projectName: string;
    actorId: string;
    actorName: string;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    activityId: string;
    cardId: string;
    cardName: string;
    isRead: boolean;
    createdAt: string;
  }>;
  summary: {
    totalActions: number;
    totalNotifications: number;
    unreadNotifications: number;
    periodStart?: string;
    periodEnd?: string;
  };
}
```

**Example:**
```typescript
// Get complete summary for current user
const summary = await mcp.callTool('planka_get_user_activity_summary');

// Get summary for specific period with only unread notifications
const summary = await mcp.callTool('planka_get_user_activity_summary', {
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  unreadNotificationsOnly: true
});

// Get only actions (skip notifications)
const actionsOnly = await mcp.callTool('planka_get_user_activity_summary', {
  includeNotifications: false
});
```

---

## 📈 Project Status

### `planka_get_project_status`

Get comprehensive status of a project including all boards with statistics. Supports filtering by date range, completion status, and user assignment.

**Parameters:**
```typescript
{
  projectId: string;         // Required: Project ID
  startDate?: string;        // Filter cards updated after this date (ISO format)
  endDate?: string;          // Filter cards updated before this date (ISO format)
  includeCompleted?: boolean; // Include completed cards (default: true)
  includeIncomplete?: boolean; // Include incomplete cards (default: true)
  userId?: string;           // Filter cards assigned to specific user
}
```

**Returns:**
```typescript
{
  projectId: string;
  projectName: string;
  boards: Array<{
    boardId: string;
    boardName: string;
    totalCards: number;
    doneCards: number;
    inProgressCards: number;
    overdueCards: number;
    completionPercentage: number;
    lists: Array<{
      listId: string;
      listName: string;
      cardCount: number;
      doneCardCount: number;
    }>;
  }>;
  totalCards: number;
  doneCards: number;
  completionPercentage: number;
  lastActivity?: string;
}
```

**Examples:**
```typescript
// Get full project status
const status = await mcp.callTool('planka_get_project_status', {
  projectId: 'proj-456'
});

// Iterate through boards and their lists
status.boards.forEach(board => {
  console.log(`${board.boardName}: ${board.completionPercentage}%`);
  board.lists.forEach(list => {
    console.log(`  - ${list.listName}: ${list.cardCount} cards (${list.doneCardCount} done)`);
  });
});

// Get only incomplete cards
const incomplete = await mcp.callTool('planka_get_project_status', {
  projectId: 'proj-456',
  includeCompleted: false
});

// Get status for specific user this month
const userStatus = await mcp.callTool('planka_get_project_status', {
  projectId: 'proj-456',
  userId: 'user-123',
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});
```

---

### `planka_get_board_status`

Get detailed status of a board including all lists with card counts. Supports filtering by date range, completion status, user assignment, and specific list.

**Parameters:**
```typescript
{
  boardId: string;           // Required: Board ID
  startDate?: string;        // Filter cards updated after this date (ISO format)
  endDate?: string;          // Filter cards updated before this date (ISO format)
  includeCompleted?: boolean; // Include completed cards (default: true)
  includeIncomplete?: boolean; // Include incomplete cards (default: true)
  userId?: string;           // Filter cards assigned to specific user
  listId?: string;           // Filter cards in specific list
}
```

**Returns:**
```typescript
{
  boardId: string;
  boardName: string;
  projectId: string;
  projectName: string;
  lists: Array<{
    listId: string;
    listName: string;
    cardCount: number;
    doneCardCount: number;
  }>;
  totalCards: number;
  doneCards: number;
  completionPercentage: number;
  lastActivity?: string;
}
```

**Examples:**
```typescript
// Get full board status
const boardStatus = await mcp.callTool('planka_get_board_status', {
  boardId: 'board-789'
});

// Get only incomplete tasks in specific list
const listIncomplete = await mcp.callTool('planka_get_board_status', {
  boardId: 'board-789',
  listId: 'list-123',
  includeCompleted: false
});

// Get user's work this week
const weekStatus = await mcp.callTool('planka_get_board_status', {
  boardId: 'board-789',
  userId: 'user-456',
  startDate: '2025-01-20',
  endDate: '2025-01-26'
});
```

---

## 📝 Daily Reports (3 tools)

**Structure:**
- Projects named: "Daily report - {team}" (e.g., "Daily report - R&D")
- Boards represent individual people (e.g., "امیرحسین محمودی")
- Lists represent seasons/periods (e.g., "پاییز ۱۴۰۴" - Autumn 1404)
- Cards contain report content in name, description, and/or comments

### `planka_get_daily_report_projects`

Get all projects configured for daily reporting (projects starting with "Daily report") along with their boards.

**Parameters:** None

**Returns:**
```typescript
Array<{
  id: string;
  name: string;
  boards: Array<{
    id: string;
    name: string;  // Person's name (e.g., "امیرحسین محمودی")
  }>;
}>
```

**Example:**
```typescript
const reportProjects = await mcp.callTool('planka_get_daily_report_projects');
console.log(`Found ${reportProjects.length} daily report projects`);
reportProjects.forEach(project => {
  console.log(`\n${project.name}:`);
  project.boards.forEach(board => {
    console.log(`  - ${board.name}`);
  });
});
```

---

### `planka_get_user_daily_reports`

Get all daily report entries for a user. Extracts content from card name, description, and comments. Optionally includes summary with missing dates.

**Parameters:**
```typescript
{
  userId?: string;         // User ID (omit for current user)
  startDate?: string;      // Filter from this date (ISO format)
  endDate?: string;        // Filter to this date (ISO format)
  projectId?: string;      // Filter to specific daily report project
  includeSummary?: boolean; // Include summary with missing dates (default: false)
}
```

**Returns:**
```typescript
// When includeSummary is false or omitted:
Array<{
  date: string;          // Extracted or inferred date (YYYY-MM-DD)
  cardId: string;
  cardName: string;
  content: string;       // Combined from description and comments
  userId: string;
  userName: string;
  boardId: string;
  boardName: string;     // Person's name
  listId: string;
  listName: string;      // Season name (e.g., "پاییز ۱۴۰۴")
  projectId: string;
  projectName: string;
  createdAt: string;
}>

// When includeSummary is true:
{
  entries: Array<{...}>;  // Same as above
  summary: {
    totalReports: number;
    missingDates: string[];      // Dates without reports
    reportedDates: string[];     // Dates with reports
  };
}
```

**Examples:**
```typescript
// Get reports only
const reports = await mcp.callTool('planka_get_user_daily_reports', {
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});

// Get reports with summary and missing dates
const result = await mcp.callTool('planka_get_user_daily_reports', {
  userId: 'user-123',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  includeSummary: true
});

console.log(`Total: ${result.summary.totalReports}`);
console.log(`Missing: ${result.summary.missingDates.length} dates`);
```

---

### `planka_get_missing_daily_reports`

Check who is missing daily reports within a date range. **Checks ALL users by default** - you can optionally filter to a specific user.

**How it checks:**
- Generates list of dates between startDate and endDate
- Excludes weekends by default (Thursday/Friday)
- For each user's board, extracts dates from all cards
- Compares extracted dates against expected dates
- Returns users with their missing dates

**Parameters:**
```typescript
{
  startDate: string;       // Required: ISO format (YYYY-MM-DD)
  endDate: string;         // Required: ISO format
  userId?: string;         // Optional: Check specific user only (default: all users)
  includeWeekends?: boolean; // Optional: Include weekends (default: false)
}
```

**Returns:**
```typescript
Array<{
  userId: string;
  userName: string;
  boardId?: string;
  missingDates: string[];  // ISO dates where reports are missing
}>
```

**Examples:**
```typescript
// Check ALL users for this week
const allMissing = await mcp.callTool('planka_get_missing_daily_reports', {
  startDate: '2025-12-23',
  endDate: '2025-12-30'
});

console.log(`${allMissing.length} users have missing reports`);
allMissing.forEach(user => {
  console.log(`${user.userName}: missing ${user.missingDates.length} days`);
  console.log(`  Dates: ${user.missingDates.join(', ')}`);
});

// Check specific user for a month (including weekends)
const userMissing = await mcp.callTool('planka_get_missing_daily_reports', {
  userId: 'user-123',
  startDate: '2025-12-01',
  endDate: '2025-12-31',
  includeWeekends: true
});

// Check who didn't write today's report
const today = new Date().toISOString().split('T')[0];
const todayMissing = await mcp.callTool('planka_get_missing_daily_reports', {
  startDate: today,
  endDate: today
});

if (todayMissing.length > 0) {
  console.log(`${todayMissing.length} people haven't written today's report:`);
  todayMissing.forEach(u => console.log(`  - ${u.userName}`));
}
```

**Parameters:**
```typescript
{
  startDate: string;       // Required: ISO format
  endDate: string;         // Required: ISO format
  userId?: string;         // User ID (omit for current user)
  includeWeekends?: boolean; // Include weekends (default: false)
}
```

**Returns:**
```typescript
{
  userId: string;
  userName: string;
  missingDates: Array<{
    date: string;        // ISO format
    dayOfWeek: string;   // e.g., "Monday"
    isWeekend: boolean;
  }>;
  totalMissing: number;
}
```

**Example:**
```typescript
const missing = await mcp.callTool('planka_get_missing_daily_reports', {
  startDate: '2025-12-01',
  endDate: '2025-12-31',
  includeWeekends: false
});
```

---

## 🔍 Search

All search tools support advanced options:
```typescript
{
  caseSensitive?: boolean;  // Default: false
  wholeWord?: boolean;      // Default: false
  useRegex?: boolean;       // Default: false
}
```

### `planka_search_users`

Search for users by name, email, or username.

**Parameters:**
```typescript
{
  query: string;      // Required: Search query
  options?: SearchOptions;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  matchedField: 'name' | 'email' | 'username';
}>
```

**Example:**
```typescript
const users = await mcp.callTool('planka_search_users', {
  query: 'john',
  options: { caseSensitive: false }
});
```

---

### `planka_search_projects`

Search for projects by name.

**Parameters:**
```typescript
{
  query: string;      // Required: Search query
  options?: SearchOptions;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  name: string;
  background: any;
  boardCount: number;
  matchedField: 'name';
}>
```

**Example:**
```typescript
const projects = await mcp.callTool('planka_search_projects', {
  query: 'Q4 Sprint'
});
```

---

### `planka_search_boards`

Search for boards by name across all projects.

**Parameters:**
```typescript
{
  query: string;      // Required: Search query
  options?: SearchOptions;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  matchedField: 'name';
}>
```

**Example:**
```typescript
const boards = await mcp.callTool('planka_search_boards', {
  query: 'Backend Development'
});
```

---

### `planka_search_cards`

Search for cards by name or description (current user's cards only).

**Parameters:**
```typescript
{
  query: string;       // Required: Search query
  userId?: string;     // User ID (omit for current user)
  options?: SearchOptions;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  name: string;
  description: string | null;
  
  projectId: string;
  projectName: string;
  boardId: string;
  boardName: string;
  listId: string;
  listName: string;
  
  matchedField: 'name' | 'description';
  isCompleted: boolean;
  dueDate: string | null;
}>
```

**Example:**
```typescript
const cards = await mcp.callTool('planka_search_cards', {
  query: 'bug fix',
  options: { caseSensitive: false }
});
```

---

### `planka_search_tasks`

Search for tasks (checklist items) by name (current user's cards only).

**Parameters:**
```typescript
{
  query: string;       // Required: Search query
  userId?: string;     // User ID (omit for current user)
  options?: SearchOptions;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  name: string;
  isCompleted: boolean;
  position: number;
  
  taskListId: string;
  taskListName: string;
  cardId: string;
  cardName: string;
  boardId: string;
  boardName: string;
  projectId: string;
  projectName: string;
  
  matchedField: 'name';
}>
```

**Example:**
```typescript
const tasks = await mcp.callTool('planka_search_tasks', {
  query: 'review',
  options: { wholeWord: true }
});
```

---

### `planka_global_search`

Search across all entity types (users, projects, boards, cards, tasks) simultaneously.

**Parameters:**
```typescript
{
  query: string;       // Required: Search query
  userId?: string;     // User ID for card/task search (omit for current user)
  options?: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    useRegex?: boolean;
    
    // Entity filters
    searchUsers?: boolean;     // Default: true
    searchProjects?: boolean;  // Default: true
    searchBoards?: boolean;    // Default: true
    searchCards?: boolean;     // Default: true
    searchTasks?: boolean;     // Default: true
  };
}
```

**Returns:**
```typescript
{
  query: string;
  totalResults: number;
  
  users: UserSearchResult[];
  projects: ProjectSearchResult[];
  boards: BoardSearchResult[];
  cards: CardSearchResult[];
  tasks: TaskSearchResult[];
}
```

**Example:**
```typescript
// Search everything
const results = await mcp.callTool('planka_global_search', {
  query: 'urgent',
  options: {
    searchCards: true,
    searchTasks: true
  }
});

console.log(`Found ${results.totalResults} results`);
console.log(`Cards: ${results.cards.length}`);
console.log(`Tasks: ${results.tasks.length}`);
```

---

## Common Parameters

### User ID
Most tools accept optional `userId` parameter:
- If **omitted** or `undefined`: Uses current authenticated user
- If **provided**: Uses specified user (requires permission)

### Date Formats
All dates use **ISO 8601 format**:
- Date only: `"2025-12-30"`
- DateTime: `"2025-12-30T14:30:00Z"`

### Filtering Options
Common filter parameters across tools:
- `projectId` - Filter by specific project
- `boardId` - Filter by specific board
- `listId` - Filter by specific list
- `isCompleted` - Filter by completion status
- `dueDate.before` / `dueDate.after` - Filter by due date range

### Sorting Options
Common sort parameters:
```typescript
{
  by: 'name' | 'createdAt' | 'updatedAt' | 'dueDate' | 'position';
  order: 'asc' | 'desc';  // Default: 'asc'
}
```

---

## Error Handling

All tools throw errors with descriptive messages:

```typescript
try {
  const cards = await mcp.callTool('planka_get_user_cards', {
    filter: { projectId: 'invalid-id' }
  });
} catch (error) {
  if (error.message.includes('not found')) {
    // Handle not found
  } else if (error.message.includes('authentication')) {
    // Handle auth error
  } else {
    // Handle other errors
  }
}
```

**Common Error Types:**
- `Authentication failed` - Invalid or expired access token
- `{Entity} not found` - Requested entity doesn't exist
- `Permission denied` - User lacks access to resource
- `{Parameter} is required` - Missing required parameter
- `Invalid {parameter}` - Malformed parameter value

---

## Best Practices

### 1. **Use Filtering Early**
```typescript
// ❌ Bad: Fetch all then filter in code
const allCards = await getUserCards(auth);
const projectCards = allCards.filter(c => c.projectId === 'proj-123');

// ✅ Good: Filter at source
const projectCards = await getUserCards(auth, undefined, {
  projectId: 'proj-123'
});
```

### 2. **Request Only What You Need**
```typescript
// ❌ Bad: Always include everything
const cards = await getUserCards(auth, undefined, {
  includeTasks: true,
  includeHistory: true
});

// ✅ Good: Include extended data only when needed
const cards = await getUserCards(auth);  // Just summary stats
```

### 3. **Use Specific Tools Over Global Search**
```typescript
// ❌ Bad: Global search when you know entity type
const results = await globalSearch(auth, 'Sprint Board');
const boards = results.boards;

// ✅ Good: Use specific search
const boards = await searchBoards(auth, 'Sprint Board');
```

### 4. **Batch Related Operations**
```typescript
// ❌ Bad: Multiple separate calls
const cards = await getUserCards(auth);
const activity = await getUserActivity(auth);
const notifications = await getUserNotifications(auth);

// ✅ Good: Use single call with extended data when possible
const cards = await getUserCards(auth, undefined, {
  includeTasks: true,
  includeHistory: true  // Includes activity inline
});
```

---

**Last Updated:** December 30, 2025  
**Version:** 1.0.0
