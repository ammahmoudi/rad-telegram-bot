# 🤖 Planka Helper Functions Reference

Complete guide to helper functions in the Planka MCP server. These provide high-level, intelligent APIs over the raw Planka API.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Date & Time System](#-date--time-system-with-dual-calendar)
- [User Tasks & Cards](#-user-tasks--cards)
- [User Activity](#-user-activity)
- [Project Status](#-project-status)
- [Daily Reports](#-daily-reports)
- [List Management](#-list-management)
- [Card Management](#-card-management)
- [Board Membership](#-board-membership)
- [Search Functions](#-search-functions)
- [Type Definitions](#-type-definitions)

---

## Overview

Helper functions are located in `src/helpers/` and provide:
- **Data enrichment** - Add project/board/list context to entities
- **Smart filtering** - Advanced filtering and sorting options
- **Aggregation** - Statistics, summaries, and analytics
- **Type safety** - Full TypeScript type definitions

### Authentication

All functions require `PlankaAuth`:
```typescript
import type { PlankaAuth } from '@rastar/mcp-planka';

const auth: PlankaAuth = {
  plankaUrl: 'https://planka.yourdomain.com',
  accessToken: 'your-access-token'
};
```

### Import

```typescript
// Import specific helpers
import {
  getUserCards,
  getUserActions,
  getUserActivitySummary,
  getProjectStatus,
  searchCards
} from '@rastar/mcp-planka/helpers';

// Or import all
import * as helpers from '@rastar/mcp-planka/helpers';
```

---

## � Date & Time System with Dual Calendar

The Planka MCP includes a comprehensive date/time system that automatically handles timezone conversion and provides dual calendar output (Gregorian + Persian). This removes the burden of calendar/timezone calculations from AI reasoning.

### Key Features

- **🌍 Automatic Timezone Conversion**: Default Tehran (Asia/Tehran) ↔ UTC
- **📆 Dual Calendar Output**: Every date provided in BOTH Gregorian and Persian (Jalali)
- **🎯 Flexible Input Parsing**: Natural language, ISO dates, Persian dates
- **🤖 AI-Friendly**: Code handles conversion, AI just picks which calendar to show

### DualDate Type

```typescript
interface DualDate {
  iso: string;              // "2025-12-30T10:30:00.000Z" (UTC for API)
  timestamp: number;        // Unix timestamp
  
  gregorian: {
    date: string;           // "2025-12-30"
    dateTime: string;       // "2025-12-30 14:00:00"
    time: string;           // "14:00:00"
    timezone: string;       // "Asia/Tehran"
    formatted: string;      // "December 30, 2025 14:00"
  };
  
  persian: {
    date: string;           // "1404-10-10"
    dateTime: string;       // "1404-10-10 14:00:00"
    formatted: string;      // "۱۴۰۴/۱۰/۱۰ ساعت ۱۴:۰۰"
    year: number;           // 1404
    month: number;          // 10
    day: number;            // 10
  };
}
```

### Quick Examples

```typescript
import { parseDate, now, today, fromUTC } from '@rastar/mcp-planka/helpers';

// Parse flexible inputs
const date1 = parseDate('today');
const date2 = parseDate('yesterday');
const date3 = parseDate('in 3 days');
const date4 = parseDate('2025-12-30');
const date5 = parseDate('1404/10/10');  // Persian date

// Get current date/time
const currentMoment = now();
const todayStart = today();

// Convert API dates (UTC → Tehran + dual calendar)
const apiDate = "2025-12-30T10:30:00.000Z";
const local = fromUTC(apiDate);
console.log(local.gregorian.formatted);  // "December 30, 2025 14:00"
console.log(local.persian.formatted);    // "۱۴۰۴/۱۰/۱۰ ساعت ۱۴:۰۰"
```

**📖 Full Documentation**: See [DATE_TIME.md](./DATE_TIME.md) for comprehensive guide, examples, and best practices.

---

## �📊 User Tasks & Cards

### `getUserCards()`

**🔥 LEGENDARY FUNCTION** - Get enriched cards for a user with optional extended data.

```typescript
async function getUserCards(
  auth: PlankaAuth,
  userId?: string,
  options?: FilterOptions,
  sort?: SortOptions
): Promise<EnrichedCard[]>
```

**Parameters:**
- `auth` - Planka authentication
- `userId` - User ID (omit for current user, or use `"me"`)
- `options` - Filtering options (see [FilterOptions](#filteroptions))
- `sort` - Sorting options (see [SortOptions](#sortoptions))

**Returns:** Array of enriched cards with full context

**Features:**
- ✅ Enriched with project/board/list names
- ✅ Includes assignees and labels
- ✅ Task completion statistics
- ✅ Optional full task items (`includeTasks: true`)
- ✅ Optional action history (`includeHistory: true`)
- ✅ Advanced filtering (project, board, list, completion, due date)
- ✅ Flexible sorting

**Examples:**

```typescript
// Get all cards for current user
const myCards = await getUserCards(auth);

// Get incomplete cards with due dates
const urgent = await getUserCards(auth, undefined, {
  done: false,
  dueDate: { before: '2025-12-31' }
}, {
  by: 'dueDate',
  order: 'asc'
});

// Get cards with full task items
const detailed = await getUserCards(auth, 'user-123', {
  projectId: 'proj-456',
  includeTasks: true,
  includeHistory: true
});

// Search cards by name/description
const bugCards = await getUserCards(auth, undefined, {
  search: 'bug fix',
  boardId: 'board-789'
});
```

---

### `getCardHistory()`

Get complete action history for a card.

```typescript
async function getCardHistory(
  auth: PlankaAuth,
  cardId: string
): Promise<any[]>
```

**Parameters:**
- `auth` - Planka authentication
- `cardId` - Card ID

**Returns:** Array of action objects

**Example:**
```typescript
const history = await getCardHistory(auth, 'card-abc-123');

history.forEach(action => {
  console.log(`${action.type} by ${action.userId} at ${action.createdAt}`);
});
```

---

## 👤 User Activity

### `getUserNotifications()`

Get all notifications for a user (things that happened TO the user - assignments, comments on their cards, mentions, etc.).

```typescript
async function getUserNotifications(
  auth: PlankaAuth,
  userId?: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
  }
): Promise<NotificationItem[]>
```

**Parameters:**
- `auth` - Planka authentication
- `userId` - User ID (omit for current user)
- `options` - Filtering options:
  - `unreadOnly` - Only return unread notifications (default: false)
  - `limit` - Maximum number of notifications to return

**Returns:** Array of notification items

**Example:**
```typescript
const unread = await getUserNotifications(auth, undefined, { unreadOnly: true });
console.log(`You have ${unread.length} unread notifications`);
```

---

### `getUserActions()`

Get all actions/activities performed BY a user (things the user DID - cards created, comments posted, tasks completed, etc.). This returns actions performed BY the user, distinct from notifications (things that happened TO the user).

```typescript
async function getUserActions(
  auth: PlankaAuth,
  userId?: string,
  options?: {
    startDate?: string;
    endDate?: string;
    projectId?: string;
    boardId?: string;
    limit?: number;
  }
): Promise<ActivityItem[]>
```

**Parameters:**
- `auth` - Planka authentication
- `userId` - User ID (omit for current user)
- `options` - Filtering options:
  - `startDate` - Filter from this date (ISO format)
  - `endDate` - Filter to this date (ISO format)
  - `projectId` - Filter by specific project
  - `boardId` - Filter by specific board
  - `limit` - Maximum number of actions to return

**Returns:** Array of activity items with enriched context

**Examples:**
```typescript
// Get all actions for a user
const actions = await getUserActions(auth, 'user-123');

// Get actions from this week
const weekActions = await getUserActions(auth, undefined, {
  startDate: '2025-01-20',
  endDate: '2025-01-26'
});

// Get actions for specific project
const projectActions = await getUserActions(auth, undefined, {
  projectId: 'proj-456',
  limit: 50
});

const cardCreations = actions.filter(a => a.type === 'createCard');
console.log(`Created ${cardCreations.length} cards`);
```

---

### `getUserActivitySummary()`

Get complete activity summary for a user - includes both actions they performed (what they DID) AND notifications they received (what happened TO them) in one call. Perfect for dashboard views or getting the complete picture.

```typescript
async function getUserActivitySummary(
  auth: PlankaAuth,
  userId?: string,
  options?: {
    startDate?: string;
    endDate?: string;
    unreadNotificationsOnly?: boolean;
    includeActivity?: boolean;
    includeNotifications?: boolean;
  }
): Promise<{
  userId: string;
  userName: string;
  activity: ActivityItem[];
  notifications: NotificationItem[];
  summary: {
    totalActions: number;
    totalNotifications: number;
    unreadNotifications: number;
    periodStart?: string;
    periodEnd?: string;
  };
}>
```

**Parameters:**
- `auth` - Planka authentication
- `userId` - User ID (omit for current user)
- `options` - Filtering options:
  - `startDate` - Filter actions from this date
  - `endDate` - Filter actions to this date
  - `unreadNotificationsOnly` - Only return unread notifications (default: false)
  - `includeActivity` - Include action items (default: true)
  - `includeNotifications` - Include notifications (default: true)

**Returns:** Object with activity, notifications, and summary statistics

**Examples:**
```typescript
// Get complete summary for current user
const summary = await getUserActivitySummary(auth);
console.log(`Total actions: ${summary.summary.totalActions}`);
console.log(`Unread notifications: ${summary.summary.unreadNotifications}`);

// Get summary for specific period with only unread notifications
const summary = await getUserActivitySummary(auth, 'user-123', {
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  unreadNotificationsOnly: true
});

// Get only actions (skip notifications)
const actionsOnly = await getUserActivitySummary(auth, undefined, {
  includeNotifications: false
});
```

---

## 📈 Project Status

### `getProjectStatus()`

Get comprehensive status of a project including all boards. Supports filtering by date range, completion status, and user assignment.

```typescript
async function getProjectStatus(
  auth: PlankaAuth,
  projectId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    includeCompleted?: boolean;
    includeIncomplete?: boolean;
    userId?: string;
  }
): Promise<ProjectStatus>
```

**Parameters:**
- `auth` - Planka authentication
- `projectId` - Project ID
- `options` - Filtering options:
  - `startDate` - Filter cards updated after this date (ISO format)
  - `endDate` - Filter cards updated before this date (ISO format)
  - `includeCompleted` - Include completed cards (default: true)
  - `includeIncomplete` - Include incomplete cards (default: true)
  - `userId` - Filter cards assigned to specific user

**Returns:** Project status object with summary and board breakdowns including lists

**Examples:**
```typescript
// Get full project status
const status = await getProjectStatus(auth, 'proj-456');
console.log(`Project: ${status.projectName}`);
console.log(`Completion: ${status.completionPercentage.toFixed(1)}%`);

// Show boards and their lists
status.boards.forEach(board => {
  console.log(`\n${board.boardName}: ${board.completionPercentage.toFixed(1)}%`);
  board.lists.forEach(list => {
    console.log(`  - ${list.listName}: ${list.cardCount} cards (${list.doneCardCount} done)`);
  });
});

// Get only incomplete cards
const incomplete = await getProjectStatus(auth, 'proj-456', {
  includeCompleted: false
});
console.log(`${incomplete.totalCards} incomplete cards across ${incomplete.boards.length} boards`);

// Get user's work this month
const userStatus = await getProjectStatus(auth, 'proj-456', {
  userId: 'user-123',
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});
```

---

### `getBoardStatus()`

Get detailed status of a board including all lists. Supports filtering by date range, completion status, user assignment, and specific list.

```typescript
async function getBoardStatus(
  auth: PlankaAuth,
  boardId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    includeCompleted?: boolean;
    includeIncomplete?: boolean;
    userId?: string;
    listId?: string;
  }
): Promise<BoardStatus>
```

**Parameters:**
- `auth` - Planka authentication
- `boardId` - Board ID
- `options` - Filtering options:
  - `startDate` - Filter cards updated after this date
  - `endDate` - Filter cards updated before this date
  - `includeCompleted` - Include completed cards (default: true)
  - `includeIncomplete` - Include incomplete cards (default: true)
  - `userId` - Filter cards assigned to specific user
  - `listId` - Filter cards in specific list

**Returns:** Board status object with list breakdowns

**Examples:**
```typescript
// Get full board status
const board = await getBoardStatus(auth, 'board-789');
console.log(`Board: ${board.boardName}`);
board.lists.forEach(list => {
  console.log(`  ${list.listName}: ${list.cardCount} cards`);
});

// Get only incomplete tasks in specific list
const listIncomplete = await getBoardStatus(auth, 'board-789', {
  listId: 'list-123',
  includeCompleted: false
});

// Get user's work this week
const weekStatus = await getBoardStatus(auth, 'board-789', {
  userId: 'user-456',
  startDate: '2025-01-20',
  endDate: '2025-01-26'
});
```

---

## 📝 Daily Reports

**Company Structure:**
- Projects: "Daily report - {team}" (e.g., "Daily report - R&D")
- Boards: Individual people (e.g., "امیرحسین محمودی")
- Lists: Seasons/periods (e.g., "پاییز ۱۴۰۴" - Autumn 1404)
- Cards: Report content in name, description, and/or comments

### `getDailyReportProjects()`

Get all projects configured for daily reporting (projects starting with "Daily report") with their boards.

```typescript
async function getDailyReportProjects(
  auth: PlankaAuth
): Promise<Array<{
  id: string;
  name: string;
  boards: Array<{
    id: string;
    name: string;  // Person's name
  }>;
}>>
```

**Example:**
```typescript
const reportProjects = await getDailyReportProjects(auth);
console.log(`${reportProjects.length} daily report projects`);
reportProjects.forEach(project => {
  console.log(`\n${project.name}: ${project.boards.length} people`);
  project.boards.forEach(board => console.log(`  - ${board.name}`));
});
```

---

### `getUserDailyReports()`

Get all daily report entries for a user. Extracts content from card name, description, and comments. Optionally includes summary with missing dates.

```typescript
async function getUserDailyReports(
  auth: PlankaAuth,
  userId?: string,
  options?: {
    startDate?: string;       // Filter from this date (ISO format)
    endDate?: string;         // Filter to this date (ISO format)
    projectId?: string;       // Filter to specific project
    includeSummary?: boolean; // Include summary with missing dates
  }
): Promise<DailyReportEntry[] | {
  entries: DailyReportEntry[];
  summary: {
    totalReports: number;
    missingDates: string[];
    reportedDates: string[];
  };
}>
```

**Parameters:**
- `auth` - Planka authentication
- `userId` - User ID (omit for current user)
- `options` - Filtering options:
  - `startDate` - Filter reports from this date
  - `endDate` - Filter reports to this date
  - `projectId` - Filter to specific daily report project
  - `includeSummary` - Include summary with missing dates (default: false)

**Returns:** 
- Array of entries when `includeSummary` is false
- Object with entries and summary when `includeSummary` is true

**Examples:**
```typescript
// Get reports only
const reports = await getUserDailyReports(auth, undefined, {
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});

console.log(`Submitted ${reports.length} reports`);
reports.forEach(r => {
  console.log(`${r.date}: ${r.content.substring(0, 50)}...`);
});

// Get reports with summary
const result = await getUserDailyReports(auth, undefined, {
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  includeSummary: true
});

console.log(`Total: ${result.summary.totalReports}`);
console.log(`Missing: ${result.summary.missingDates.length} dates`);
console.log(`Missing dates: ${result.summary.missingDates.join(', ')}`);

// Get all reports (no date filter)
const allReports = await getUserDailyReports(auth);
```

---

### `getMissingDailyReports()`

Check who is missing daily reports within a date range. Checks all users by default.

```typescript
async function getMissingDailyReports(
  auth: PlankaAuth,
  startDate: string,
  endDate: string,
  options?: {
    userId?: string;         // Check specific user only (undefined = all users)
    projectId?: string;      // Filter to specific project
    includeWeekends?: boolean; // Include weekends (default: false)
  }
): Promise<Array<{
  userId: string;
  userName: string;
  boardId?: string;
  missingDates: string[];  // Array of ISO dates
}>>
```

**How it checks for missing dates:**
1. Generates list of dates between startDate and endDate
2. Excludes weekends (Thu/Fri) unless `includeWeekends: true`
3. For each user's board, extracts dates from all cards (using name or createdAt)
4. Compares extracted dates against expected dates
5. Returns users with their list of missing dates

**Parameters:**
- `auth` - Planka authentication
- `startDate` - Start date (ISO format: YYYY-MM-DD)
- `endDate` - End date (ISO format)
- `options` - Optional filters:
  - `userId` - Check specific user only (default: all users)
  - `projectId` - Filter to specific daily report project
  - `includeWeekends` - Include Thu/Fri in check (default: false)

**Returns:** Array of users with their missing dates

**Examples:**
```typescript
// Check all users this week
const missing = await getMissingDailyReports(
  auth,
  '2025-12-23',
  '2025-12-30'
);

console.log(`${missing.length} users have missing reports`);
missing.forEach(user => {
  console.log(`\n${user.userName}:`);
  user.missingDates.forEach(date => console.log(`  - ${date}`));
});

// Check specific user for a month
const userMissing = await getMissingDailyReports(
  auth,
  '2025-12-01',
  '2025-12-31',
  { userId: 'user-123' }
);

// Check including weekends
const allDays = await getMissingDailyReports(
  auth,
  '2025-12-01',
  '2025-12-31',
  { includeWeekends: true }
);
```

```typescript
async function getMissingDailyReports(
  auth: PlankaAuth,
  date: string,
  includeWeekends?: boolean
): Promise<{
  userId: string;
  userName: string;
  missingDates: Array<{
    date: string;
    dayOfWeek: string;
    isWeekend: boolean;
  }>;
  totalMissing: number;
}>
```

**Example:**
```typescript
const missing = await getMissingDailyReports(auth, '2025-12-01', false);

if (missing.totalMissing > 0) {
  console.log(`⚠️ Missing ${missing.totalMissing} reports (weekdays only)`);
}
```

---

## � List Management

High-level functions for managing lists within boards.

### `createBoardList()`

Create a new list in a board.

```typescript
async function createBoardList(
  auth: PlankaAuth,
  boardId: string,
  name: string,
  options?: {
    position?: number;
    color?: string;
  }
): Promise<{
  id: string;
  name: string;
  boardId: string;
  position: number;
  color?: string;
}>
```

**Example:**
```typescript
const list = await createBoardList(auth, 'board-123', 'To Do', {
  color: 'blue',
  position: 65535
});
```

### `getBoardLists()`

Get all lists in a board with card counts.

```typescript
async function getBoardLists(
  auth: PlankaAuth,
  boardId: string
): Promise<Array<{
  id: string;
  name: string;
  position: number;
  color?: string;
  cardCount: number;
}>>
```

**Example:**
```typescript
const lists = await getBoardLists(auth, 'board-123');
lists.forEach(list => {
  console.log(`${list.name}: ${list.cardCount} cards`);
});
```

### `updateBoardList()`

Update list properties (name, position, color).

```typescript
async function updateBoardList(
  auth: PlankaAuth,
  listId: string,
  updates: {
    name?: string;
    position?: number;
    color?: string;
  }
): Promise<void>
```

**Example:**
```typescript
// Rename list
await updateBoardList(auth, 'list-123', { name: 'In Progress' });

// Reorder list
await updateBoardList(auth, 'list-123', { position: 100 });

// Change color
await updateBoardList(auth, 'list-123', { color: 'green' });
```

### List Operations

```typescript
// Archive a list
await archiveBoardList(auth, 'list-123');

// Delete a list permanently
await deleteBoardList(auth, 'list-123');

// Move all cards from one list to another
await moveAllCards(auth, 'source-list', 'target-list');

// Clear all cards from a list (archives them)
await clearListCards(auth, 'list-123');

// Sort cards in a list by name
await sortListCards(auth, 'list-123');
```

### `createMultipleLists()`

Create multiple lists at once.

```typescript
async function createMultipleLists(
  auth: PlankaAuth,
  boardId: string,
  names: string[]
): Promise<Array<{ id: string; name: string; position: number }>>
```

**Example:**
```typescript
const lists = await createMultipleLists(auth, 'board-123', [
  'Backlog',
  'To Do',
  'In Progress',
  'Done'
]);
```

---

## 🎴 Card Management

High-level functions for creating and managing cards.

### `createNewCard()`

Create a new card with optional details and auto-assignment.

```typescript
async function createNewCard(
  auth: PlankaAuth,
  listId: string,
  name: string,
  options?: {
    description?: string;
    dueDate?: string;
    position?: number;
    assignToMe?: boolean;
  }
): Promise<{
  id: string;
  name: string;
  listId: string;
  description?: string;
  dueDate?: string;
}>
```

**Example:**
```typescript
// Simple card
const card = await createNewCard(auth, 'list-123', 'Fix bug');

// Card with details and auto-assign
const task = await createNewCard(auth, 'list-123', 'New feature', {
  description: 'Implement user authentication',
  dueDate: '2025-12-31',
  assignToMe: true
});
```

### `updateCardDetails()`

Update card properties.

```typescript
async function updateCardDetails(
  auth: PlankaAuth,
  cardId: string,
  updates: {
    name?: string;
    description?: string;
    dueDate?: string;
  }
): Promise<void>
```

**Example:**
```typescript
await updateCardDetails(auth, 'card-123', {
  name: 'Updated task name',
  description: 'New requirements added',
  dueDate: '2025-12-25'
});
```

### `moveCardToList()`

Move a card to a different list.

```typescript
async function moveCardToList(
  auth: PlankaAuth,
  cardId: string,
  targetListId: string,
  position?: number
): Promise<void>
```

**Example:**
```typescript
// Move to "Done" list
await moveCardToList(auth, 'card-123', 'done-list-id');

// Move and place at specific position
await moveCardToList(auth, 'card-123', 'list-456', 0);
```

### `reorderCard()`

Reorder a card within its current list.

```typescript
async function reorderCard(
  auth: PlankaAuth,
  cardId: string,
  position: number
): Promise<void>
```

**Example:**
```typescript
// Move to top (position 0)
await reorderCard(auth, 'card-123', 0);

// Move to specific position
await reorderCard(auth, 'card-123', 5);
```

### Card Operations

```typescript
// Delete a card
await removeCard(auth, 'card-123');

// Duplicate a card
const duplicate = await copyCard(auth, 'card-123');

// Assign user to card
await assignUserToCard(auth, 'card-123', 'user-456');

// Remove user from card
await unassignUserFromCard(auth, 'card-123', 'user-456');
```

### `createMultipleCards()`

Create multiple cards at once.

```typescript
async function createMultipleCards(
  auth: PlankaAuth,
  listId: string,
  cardNames: string[]
): Promise<Array<{ id: string; name: string }>>
```

**Example:**
```typescript
const cards = await createMultipleCards(auth, 'list-123', [
  'Task 1',
  'Task 2',
  'Task 3'
]);
```

### `getCardsInList()`

Get all cards in a list with assignee details.

```typescript
async function getCardsInList(
  auth: PlankaAuth,
  boardId: string,
  listId: string
): Promise<Array<{
  id: string;
  name: string;
  description?: string;
  position: number;
  dueDate?: string;
  assignees: Array<{ id: string; name: string }>;
}>>
```

**Example:**
```typescript
const cards = await getCardsInList(auth, 'board-123', 'list-456');
cards.forEach(card => {
  console.log(`${card.name} - Assigned to: ${card.assignees.map(a => a.name).join(', ')}`);
});
```

---

## 👥 Board Membership

Manage board members and their permissions.

### `getBoardMembers()`

Get all members of a board with their roles.

```typescript
async function getBoardMembers(
  auth: PlankaAuth,
  boardId: string
): Promise<Array<{
  userId: string;
  userName: string;
  email: string;
  membershipId: string;
  role: string;
  canComment: boolean;
}>>
```

**Example:**
```typescript
const members = await getBoardMembers(auth, 'board-123');
members.forEach(member => {
  console.log(`${member.userName} (${member.role})`);
});
```

### `addUserToBoard()`

Add a user to a board with a specific role.

```typescript
async function addUserToBoard(
  auth: PlankaAuth,
  boardId: string,
  userId: string,
  role?: 'editor' | 'viewer'
): Promise<{
  membershipId: string;
  userId: string;
  role: string;
}>
```

**Example:**
```typescript
// Add as editor (default)
await addUserToBoard(auth, 'board-123', 'user-456');

// Add as viewer
await addUserToBoard(auth, 'board-123', 'user-789', 'viewer');
```

### `removeUserFromBoard()`

Remove a user from a board.

```typescript
async function removeUserFromBoard(
  auth: PlankaAuth,
  membershipId: string
): Promise<void>
```

**Example:**
```typescript
await removeUserFromBoard(auth, 'membership-123');
```

### `updateBoardMemberPermissions()`

Update a board member's role or comment permission.

```typescript
async function updateBoardMemberPermissions(
  auth: PlankaAuth,
  membershipId: string,
  updates: {
    role?: 'editor' | 'viewer';
    canComment?: boolean;
  }
): Promise<void>
```

**Example:**
```typescript
// Change to viewer
await updateBoardMemberPermissions(auth, 'membership-123', {
  role: 'viewer'
});

// Disable comments
await updateBoardMemberPermissions(auth, 'membership-123', {
  canComment: false
});

// Update both
await updateBoardMemberPermissions(auth, 'membership-123', {
  role: 'viewer',
  canComment: false
});
```

### `getAvailableUsersForBoard()`

Find users not yet in a board.

```typescript
async function getAvailableUsersForBoard(
  auth: PlankaAuth,
  boardId: string
): Promise<Array<{
  id: string;
  name: string;
  email: string;
}>>
```

**Example:**
```typescript
const availableUsers = await getAvailableUsersForBoard(auth, 'board-123');
console.log(`${availableUsers.length} users can be added`);
```

### `addMultipleUsersToBoard()`

Add multiple users to a board at once.

```typescript
async function addMultipleUsersToBoard(
  auth: PlankaAuth,
  boardId: string,
  userIds: string[],
  role?: 'editor' | 'viewer'
): Promise<Array<{ userId: string; membershipId: string }>>
```

**Example:**
```typescript
const added = await addMultipleUsersToBoard(
  auth,
  'board-123',
  ['user-1', 'user-2', 'user-3'],
  'viewer'
);
```

### `getUserBoardMembership()`

Get a user's membership info (returns null if not a member).

```typescript
async function getUserBoardMembership(
  auth: PlankaAuth,
  boardId: string,
  userId: string
): Promise<{
  membershipId: string;
  role: string;
  canComment: boolean;
} | null>
```

**Example:**
```typescript
const membership = await getUserBoardMembership(auth, 'board-123', 'user-456');
if (membership) {
  console.log(`User is ${membership.role}`);
} else {
  console.log('User is not a member');
}
```

---

## �🔍 Search Functions

All search functions support `SearchOptions` for advanced matching.

### `searchUsers()`

Search for users by name, email, or username.

```typescript
async function searchUsers(
  auth: PlankaAuth,
  query: string,
  options?: SearchOptions
): Promise<UserSearchResult[]>
```

**Example:**
```typescript
const users = await searchUsers(auth, 'john', { 
  caseSensitive: false 
});
```

---

### `searchProjects()`

Search for projects by name.

```typescript
async function searchProjects(
  auth: PlankaAuth,
  query: string,
  options?: SearchOptions
): Promise<ProjectSearchResult[]>
```

---

### `searchBoards()`

Search for boards by name across all projects.

```typescript
async function searchBoards(
  auth: PlankaAuth,
  query: string,
  options?: SearchOptions
): Promise<BoardSearchResult[]>
```

---

### `searchCards()`

Search for cards by name or description (current user's cards).

```typescript
async function searchCards(
  auth: PlankaAuth,
  query: string,
  userId?: string,
  options?: SearchOptions
): Promise<CardSearchResult[]>
```

**Example:**
```typescript
const bugCards = await searchCards(auth, 'bug', undefined, {
  caseSensitive: false,
  wholeWord: false
});

bugCards.forEach(card => {
  console.log(`${card.name} (${card.boardName}/${card.listName})`);
});
```

---

### `searchTasks()`

Search for tasks (checklist items) by name.

```typescript
async function searchTasks(
  auth: PlankaAuth,
  query: string,
  userId?: string,
  options?: SearchOptions
): Promise<TaskSearchResult[]>
```

---

### `globalSearch()`

Search across all entity types simultaneously.

```typescript
async function globalSearch(
  auth: PlankaAuth,
  query: string,
  options?: SearchOptions & {
    searchUsers?: boolean;
    searchProjects?: boolean;
    searchBoards?: boolean;
    searchCards?: boolean;
    searchTasks?: boolean;
  }
): Promise<{
  query: string;
  totalResults: number;
  users: UserSearchResult[];
  projects: ProjectSearchResult[];
  boards: BoardSearchResult[];
  cards: CardSearchResult[];
  tasks: TaskSearchResult[];
}>
```

**Example:**
```typescript
const results = await globalSearch(auth, 'urgent', {
  caseSensitive: false,
  searchCards: true,
  searchTasks: true
});

console.log(`Found ${results.totalResults} results`);
console.log(`- Cards: ${results.cards.length}`);
console.log(`- Tasks: ${results.tasks.length}`);
```

---

## 📘 Type Definitions

### `FilterOptions`

Options for filtering cards:

```typescript
type FilterOptions = {
  done?: boolean;              // true = completed only, false = incomplete only
  dueDate?: {
    before?: string;          // ISO date string
    after?: string;           // ISO date string
    on?: string;              // ISO date string
  };
  assignedTo?: string[];      // Array of user IDs
  projectId?: string;
  boardId?: string;
  listId?: string;
  hasLabels?: string[];       // Array of label IDs
  search?: string;            // Search in title/description
  
  // Extended data options
  includeTasks?: boolean;     // Include full task items (default: false)
  includeHistory?: boolean;   // Include action history (default: false)
};
```

---

### `SortOptions`

Options for sorting cards:

```typescript
type SortOptions = {
  by: 'createdAt' | 'updatedAt' | 'dueDate' | 'name' | 'position';
  order: 'asc' | 'desc';
};
```

---

### `EnrichedCard`

Enriched card with full context:

```typescript
type EnrichedCard = {
  // Core card data
  id: string;
  name: string;
  description?: string;
  position: number;
  listId: string;
  boardId: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  
  // Enriched context
  projectName: string;
  projectId: string;
  boardName: string;
  listName: string;
  
  // Related entities
  assignees: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  
  // Task statistics (always included)
  tasks: {
    total: number;
    completed: number;
    percentage: number;
  };
  isDone: boolean;
  
  // Optional extended data (when requested)
  taskItems?: Array<{
    id: string;
    name: string;
    isCompleted: boolean;
    position: number;
    taskListId: string;
    taskListName: string;
  }>;
  history?: Array<{
    id: string;
    type: string;
    data: any;
    userId: string;
    createdAt: string;
  }>;
};
```

---

### `SearchOptions`

Options for search functions:

```typescript
type SearchOptions = {
  caseSensitive?: boolean;   // Default: false
  wholeWord?: boolean;       // Default: false
  useRegex?: boolean;        // Default: false
};
```

---

### `ActivityItem`

User activity item:

```typescript
type ActivityItem = {
  id: string;
  type: string;              // e.g., 'createCard', 'commentCard'
  timestamp: string;
  userId: string;
  userName: string;
  
  // Card context (if applicable)
  cardId?: string;
  cardName?: string;
  boardId?: string;
  boardName?: string;
  projectId?: string;
  projectName?: string;
  
  // Action details
  data: any;
  description: string;       // Human-readable description
};
```

---

### `ProjectStatus`

Project status summary:

```typescript
type ProjectStatus = {
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
  }>;
  
  totalCards: number;
  doneCards: number;
  completionPercentage: number;
  lastActivity?: string;
};
```

---

### `DailyReportSummary`

Daily report summary:

```typescript
type DailyReportSummary = {
  userId: string;
  userName: string;
  
  period: {
    start: string;
    end: string;
  };
  
  entries: DailyReportEntry[];
  missingDates: string[];    // ISO date strings
  totalReports: number;
};
```

---

## 🎯 Best Practices

### 1. **Use Type Imports**

```typescript
import type { 
  FilterOptions, 
  SortOptions, 
  EnrichedCard 
} from '@rastar/mcp-planka/helpers';
```

### 2. **Leverage Optional Extended Data**

```typescript
// ❌ Bad: Always fetch everything
const cards = await getUserCards(auth, undefined, {
  includeTasks: true,
  includeHistory: true
});

// ✅ Good: Only fetch what you need
const cards = await getUserCards(auth);  // Just summary stats

// When you need details:
const detailedCard = await getUserCards(auth, undefined, {
  listId: 'specific-card-list',
  includeTasks: true
});
```

### 3. **Filter Early**

```typescript
// ❌ Bad: Fetch all then filter
const allCards = await getUserCards(auth);
const projectCards = allCards.filter(c => c.projectId === 'proj-123');

// ✅ Good: Filter at source
const projectCards = await getUserCards(auth, undefined, {
  projectId: 'proj-123'
});
```

### 4. **Combine Filters for Precision**

```typescript
const urgentCards = await getUserCards(auth, undefined, {
  done: false,
  dueDate: { before: new Date().toISOString() },
  hasLabels: ['label-urgent'],
  boardId: 'board-active-sprint'
}, {
  by: 'dueDate',
  order: 'asc'
});
```

### 5. **Handle Errors Gracefully**

```typescript
try {
  const cards = await getUserCards(auth, 'user-123');
} catch (error) {
  if (error.message.includes('not found')) {
    console.log('User not found');
  } else {
    throw error;
  }
}
```

---

## 📚 API Coverage

### Raw APIs Used by Helpers

The helpers use the following raw API modules:

**Core Resources:**
- ✅ **projects.ts** - `listProjects()`, `getProject()`
- ✅ **boards.ts** - `getBoard()`
- ✅ **cards.ts** - Card CRUD, members, duplication
- ✅ **lists.ts** - List CRUD, sorting, moving cards
- ✅ **users.ts** - `getCurrentUser()`, `listUsers()`
- ✅ **actions.ts** - `getBoardActions()`, `getCardActions()`
- ✅ **notifications.ts** - `getNotifications()`
- ✅ **comments.ts** - `getComments()`
- ✅ **board-memberships.ts** - Add/remove/update board members

**Total: 10 API modules actively used**

### Raw APIs NOT Yet Covered by Helpers

These API modules exist but have NO helper functions yet:

**Content & Structure:**
- ❌ **labels.ts** - Label management (create, assign, remove)
- ❌ **tasks.ts** - Task CRUD operations (create, update, delete)
- ❌ **attachments.ts** - File attachments (upload, download, delete)
- ❌ **teams.ts** - Team management
- ❌ **board-teams.ts** - Board team assignments
- ❌ **project-teams.ts** - Project team assignments
- ❌ **permissions.ts** - Permission management

**Organization:**
- ❌ **spaces.ts** - Workspace spaces
- ❌ **folders.ts** - Project folders
- ❌ **files.ts** - File management
- ❌ **project-categories.ts** - Project categorization

**Advanced Features:**
- ❌ **card-dependencies.ts** - Card dependencies/relationships
- ❌ **board-links.ts** - Cross-board links
- ❌ **custom-fields.ts** - Custom field definitions
- ❌ **custom-field-groups.ts** - Custom field grouping
- ❌ **custom-field-values.ts** - Custom field data
- ❌ **webhooks.ts** - Webhook configuration
- ❌ **notification-services.ts** - Notification integrations

**Total: 36 API modules without helpers**

- ❌ **releases.ts** - Release management
- ❌ **board-releases.ts** - Board release tracking
- ❌ **board-versions.ts** - Board versioning
- ❌ **project-releases.ts** - Project releases
- ❌ **project-versions.ts** - Project versioning
- ❌ **project-profiles.ts** - Project profiles
- ❌ **project-managers.ts** - Project manager assignments

**Customization:**
- ❌ **background-images.ts** - Board backgrounds
- ❌ **board-templates.ts** - Board templates
- ❌ **base-custom-field-groups.ts** - Base custom fields

**Reporting & Access:**
- ❌ **reports.ts** - Report generation
- ❌ **public-access.ts** - Public sharing
- ❌ **share-links.ts** - Share link management
- ❌ **terms.ts** - Terms and conditions

**Authentication:**
- ❌ **access-tokens.ts** - Token management
- ❌ **config.ts** - Configuration
- ❌ **document-activities.ts** - Document tracking
---

### Potential Helper Functions to Add

Based on uncovered APIs, these would be useful:

**High Priority:**
1. **Label Management** - Create labels, assign to cards, search by label
2. **Task CRUD** - Create/update/complete tasks directly
3. **Aabel Management** - Create labels, assign to cards, search by label
2. **Task CRUD** - Create/update/complete tasks directly
3. **Attachments** - Upload files, list attachments, download
4. **Card Dependencies** - Track blocked/blocking relationships

**Medium Priority:**
5
**Customization:**
- ❌ **background-images.ts** - Board backgrounds
- ❌ **board-templates.ts** - Board templates
- ❌ **base-custom-field-groups.ts** - Base custom fields

**Reporting & Access:**
- ❌ **reports.ts** - Report generation
- ❌ **public-access.ts** - Public sharing
- ❌ **share-links.ts** - Share link management
- ❌ **terms.ts** - Terms and conditions

5. **Custom Fields** - Define and use custom card fields
6. **Webhooks** - Set up integrations
7. **Teams** - Manage team memberships
8. **Spaces/Folders** - Organize projects hierarchically

**Low Priority:**
9-

### Potential Helper Functions to Add

Based on uncovered APIs, these would be useful:

**High Priority:**
1. **List Management** - Create/reorder lists, move cards between lists
2. **Label Management** - Create labels, assign to cards, search by label
3. **Task CRUD** - Create/update/complete tasks directly
4. **Attachments** - Upload files, list attachments, download
5. **Board Members** - Add/remove users from boards
6. **Card Dependencies** - Track blocked/blocking relationships

**Medium Priority:**
7. **Custom Fields** - Define and use custom card fields
8. **Webhooks** - Set up integrations
9. **Teams** - Manage team memberships
10. **Spaces/Folders** - Organize projects hierarchically

**Low Priority:**
11. **Releases/Versions** - Track releases across projects
12. **Templates** - Create boards from templates
13. **Public Sharing** - Generate public links
14. **Reports** - Generate usage/progress reports

---

### Direct API Access

For functionality not yet in helpers, use raw API directly:

```typescript
import { createList, updateList } from '@rad/mcp-planka/api';

// Create a new list
const list = await createList(auth, {
  boardId: 'board-123',
  name: 'New List',
  position: 1
});

// All raw APIs follow the same pattern:
// - First param: PlankaAuth
// - Second param: ID or options object
// - Returns: Typed response
```

---

## 🔄 Migration from Raw API

### Before (Raw API):
```typescript
import { listProjects, getProject, getBoard } from '@rastar/mcp-planka/api';

const projects = await listProjects(auth);
for (const project of projects) {
  const details = await getProject(auth, project.id);
  for (const board of details.included.boards) {
    const boardDetails = await getBoard(auth, board.id);
    // ... manually process cards, tasks, etc.
  }
}
```

### After (Helper):
```typescript
import { getUserCards } from '@rastar/mcp-planka/helpers';

const cards = await getUserCards(auth, undefined, {
  includeTasks: true
});
// Done! Enriched cards with full context
```

---

**Last Updated:** December 30, 2025  
**Version:** 1.0.0