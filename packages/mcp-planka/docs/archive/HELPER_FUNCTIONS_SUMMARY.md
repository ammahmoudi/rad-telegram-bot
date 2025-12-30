# Planka MCP Helper Functions - Implementation Summary

## Overview

Created high-level helper functions that wrap raw Planka API calls with user-friendly interfaces. These helpers provide better filtering, sorting, data aggregation, and context enrichment.

## Key Features

### 1. **Current User Support** ✨
All helper functions now support getting data for the currently authenticated user:
- Pass `undefined` or `"me"` as `userId` parameter
- Automatically resolves to current user via `getCurrentUser()` API
- No need to know your own user ID!

### 2. **Enriched Data**
Helper functions return data with full context:
- Cards include: project name, board name, list name, assignees, labels, task completion
- Tasks include: card name, board name, project name
- Activities include: human-readable descriptions, card/board/project context
- Notifications include: card details, related actions

### 3. **Advanced Filtering & Sorting**
- Filter by: done/undone, date ranges, projects, boards, lists, labels, search text
- Sort by: createdAt, updatedAt, dueDate, name, position
- Ascending or descending order

## Helper Modules

### 📋 `user-tasks.ts`
Functions for managing user cards and tasks:

- **`getUserCards(auth, userId?, options, sort)`**
  - Get all cards assigned to a user
  - Filter by completion, project, board, list, due dates, search text
  - Returns enriched cards with full context
  
- **`getUserTasks(auth, userId?, options, sort)`**
  - Get all checklist tasks across user's cards
  - Filter by completion status
  - Returns tasks with card/board/project context

- **`getCardHistory(auth, cardId)`**
  - Get action history for a card

### 🔔 `user-activity.ts`
Functions for activity tracking and notifications:

- **`getUserNotifications(auth, userId?, options)`**
  - Get notifications with enriched context
  - Filter by read status, limit results

- **`getUserActivity(auth, userId?, options)`**
  - Get user activity history with date range filtering
  - Human-readable action descriptions
  
- **`getUserTodayActivity(auth, userId?)`**
  - Shortcut for today's activities

- **`getUserWeekActivity(auth, userId?)`**
  - Shortcut for this week's activities

- **`getUserActivityInPeriod(auth, userId?, startDate, endDate)`**
  - Get activities in specific date range

### 📊 `project-status.ts`
Functions for project and board status:

- **`getProjectStatus(auth, projectId)`**
  - Comprehensive project status
  - Board summaries, completion percentages
  - Done/in-progress/overdue counts
  - Last activity timestamp

- **`getBoardStatus(auth, boardId)`**
  - Comprehensive board status
  - List summaries, completion percentages

- **`getProjectUndoneTasks(auth, projectId, userId?)`**
  - All undone cards in a project
  - Optionally filter by user

- **`getBoardUndoneTasks(auth, boardId, userId?)`**
  - All undone cards in a board
  - Optionally filter by user

### 📝 `daily-reports.ts`
Special functions for daily report projects:

- **`getDailyReportProjects(auth)`**
  - List all "Daily report - xxx" projects

- **`getUserDailyReports(auth, userId?, options)`**
  - Get daily report entries for a user
  - Filter by date range, project

- **`getUserDailyReportSummary(auth, userId?, startDate, endDate)`**
  - Summary with missing dates

- **`getMissingDailyReports(auth, date, projectId?)`**
  - Check who hasn't written their report

- **`generateDailyReportFromTasks(auth, userId?, date)`**
  - Auto-generate report from activities and tasks

- **`getTodayDate()`** / **`getYesterdayDate()`**
  - Utility functions for date handling

## Usage Examples

```typescript
import { getUserCards, getUserTasks, getUserTodayActivity } from './helpers';

const auth = {
  plankaBaseUrl: 'https://pm.example.com',
  accessToken: 'your-token',
};

// Get MY undone cards
const myUndoneTasks = await getUserCards(auth, undefined, { done: false });

// Or explicitly use "me"
const myCards = await getUserCards(auth, 'me');

// Get another user's tasks
const theirTasks = await getUserCards(auth, 'user-id-123');

// What have I done today?
const todayActivity = await getUserTodayActivity(auth);

// Get project status
const status = await getProjectStatus(auth, 'project-id');
console.log(`${status.projectName}: ${status.completionPercentage}% complete`);
```

## Query Support

These helpers enable answering questions like:

✅ "What are my undone tasks?"
✅ "What have I done today?"
✅ "What has X done in current week?"
✅ "What are the undone tasks for humaani project?"
✅ "What are the undone tasks for design board of humaani?"
✅ "Give me the status of project humaani"
✅ "What is the status of release 1 of humaani?"
✅ "Who hasn't written their daily report today?"
✅ "Generate my daily report from today's tasks"

## Testing

Run the test file to verify all helpers work:

```bash
cd packages/mcp-planka
export PLANKA_BASE_URL="https://pm-dev.rastar.dev"
export PLANKA_TOKEN="your-token"
npx tsx test-helpers.ts
```

The test will:
1. Get your cards and tasks
2. Check today's activity
3. Check notifications
4. Get daily report projects
5. Get project/board status

## Next Steps

1. ✅ Test helper functions with real data
2. ⏳ Update MCP tools to use helpers instead of raw APIs
3. ⏳ Update tool descriptions to reflect new capabilities
4. ⏳ Wire up helper tools in MCP server

## Files Created/Modified

### New Files:
- `src/helpers/index.ts` - Main export
- `src/helpers/types.ts` - TypeScript types
- `src/helpers/user-tasks.ts` - Card and task helpers
- `src/helpers/user-activity.ts` - Activity and notification helpers
- `src/helpers/project-status.ts` - Project/board status helpers
- `src/helpers/daily-reports.ts` - Daily report helpers
- `src/tools/helper.tools.ts` - MCP tool definitions
- `test-helpers.ts` - Test file

### Modified Files:
- `src/api/access-tokens.ts` - Added `getCurrentUser()`
- `src/tools/index.ts` - Export helper tools
- `src/tools/tool-handlers.ts` - Added helper tool handlers (prepared but not active yet)

## Benefits

1. **Better UX**: Users can work without knowing IDs
2. **Rich Context**: All data includes human-readable names and relationships
3. **Modular**: Each helper focuses on specific use cases
4. **Testable**: Easy to test and verify behavior
5. **Maintainable**: Clean separation from raw APIs
6. **Extensible**: Easy to add new helpers as needed
