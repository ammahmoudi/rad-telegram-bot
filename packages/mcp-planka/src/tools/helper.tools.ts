/**
 * High-level helper-based tools for Planka MCP
 * These tools use the helper functions to provide better user experience
 */

export const helperTools = [
  // User tasks and cards
  {
    name: 'planka.helper.getUserCards',
    description: 'Get all cards/tasks for a user with advanced filtering and sorting. Supports filters: done/undone, due dates, projects, boards, labels, search text. Returns enriched cards with full context (project, board, list names, assignees, labels, task completion).',
    inputSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        userId: { type: 'string', description: 'User ID to get cards for' },
        done: { type: 'boolean', description: 'Filter by completion status: true=completed only, false=incomplete only, omit=all' },
        projectId: { type: 'string', description: 'Filter by specific project ID' },
        boardId: { type: 'string', description: 'Filter by specific board ID' },
        listId: { type: 'string', description: 'Filter by specific list ID' },
        dueDateBefore: { type: 'string', description: 'Filter cards due before this date (ISO format)' },
        dueDateAfter: { type: 'string', description: 'Filter cards due after this date (ISO format)' },
        dueDateOn: { type: 'string', description: 'Filter cards due on this date (ISO format)' },
        search: { type: 'string', description: 'Search in card title and description' },
        sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'dueDate', 'name', 'position'], description: 'Sort field (default: updatedAt)' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order (default: desc)' },
      },
    },
  },
  {
    name: 'planka.helper.getUserTasks',
    description: 'Get all checklist tasks for a user across all their assigned cards. Returns task items with full context (card, board, project). Perfect for "what are my undone tasks" queries.',
    inputSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        userId: { type: 'string', description: 'User ID to get tasks for' },
        done: { type: 'boolean', description: 'Filter by completion: true=completed, false=incomplete, omit=all' },
        includeCompleted: { type: 'boolean', description: 'Include completed tasks (default: false)' },
        projectId: { type: 'string', description: 'Filter by specific project' },
        boardId: { type: 'string', description: 'Filter by specific board' },
        sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'name', 'position'], description: 'Sort field' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
      },
    },
  },

  // User activity and notifications
  {
    name: 'planka.helper.getUserActivity',
    description: 'Get user activity history with enriched context. Shows what a user has done with full details (card names, projects, descriptions). Supports date range filtering.',
    inputSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        userId: { type: 'string', description: 'User ID to get activity for' },
        startDate: { type: 'string', description: 'Start date (ISO format, e.g., 2024-12-29)' },
        endDate: { type: 'string', description: 'End date (ISO format)' },
        projectId: { type: 'string', description: 'Filter by specific project' },
        boardId: { type: 'string', description: 'Filter by specific board' },
        limit: { type: 'number', description: 'Maximum number of activities to return' },
      },
    },
  },
  {
    name: 'planka.helper.getUserTodayActivity',
    description: 'Get what a user has done today. Perfect for "what have I done today" queries. Returns all activities from today with full context.',
    inputSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        userId: { type: 'string', description: 'User ID to get today\'s activity for' },
      },
    },
  },
  {
    name: 'planka.helper.getUserWeekActivity',
    description: 'Get what a user has done this week. Perfect for "what has X done in current week" queries. Returns activities from the start of this week.',
    inputSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        userId: { type: 'string', description: 'User ID to get this week\'s activity for' },
      },
    },
  },
  {
    name: 'planka.helper.getUserNotifications',
    description: 'Get user notifications with enriched context (card names, projects, related actions). Supports filtering by read status.',
    inputSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        userId: { type: 'string', description: 'User ID to get notifications for' },
        unreadOnly: { type: 'boolean', description: 'Only return unread notifications' },
        limit: { type: 'number', description: 'Maximum number of notifications to return' },
      },
    },
  },

  // Project and board status
  {
    name: 'planka.helper.getProjectStatus',
    description: 'Get comprehensive project status including completion percentage, board summaries, done/in-progress/overdue counts, and last activity. Perfect for "status of project X" queries.',
    inputSchema: {
      type: 'object',
      required: ['projectId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        projectId: { type: 'string', description: 'Project ID to get status for' },
      },
    },
  },
  {
    name: 'planka.helper.getBoardStatus',
    description: 'Get comprehensive board status including completion percentage, list summaries, done card counts, and last activity. Perfect for "status of board X" queries.',
    inputSchema: {
      type: 'object',
      required: ['boardId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        boardId: { type: 'string', description: 'Board ID to get status for' },
      },
    },
  },
  {
    name: 'planka.helper.getProjectUndoneTasks',
    description: 'Get all undone cards/tasks in a project. Optionally filter by user. Perfect for "undone tasks for project X" queries.',
    inputSchema: {
      type: 'object',
      required: ['projectId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        projectId: { type: 'string', description: 'Project ID to get undone tasks for' },
        userId: { type: 'string', description: 'Optional: filter by specific user' },
      },
    },
  },
  {
    name: 'planka.helper.getBoardUndoneTasks',
    description: 'Get all undone cards/tasks in a board. Optionally filter by user. Perfect for "undone tasks for design board" queries.',
    inputSchema: {
      type: 'object',
      required: ['boardId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        boardId: { type: 'string', description: 'Board ID to get undone tasks for' },
        userId: { type: 'string', description: 'Optional: filter by specific user' },
      },
    },
  },

  // Daily reports
  {
    name: 'planka.helper.getUserDailyReports',
    description: 'Get daily report entries for a user from "Daily report" projects. Returns report cards with dates and content. Supports date range filtering and optional summary with missing dates.',
    inputSchema: {
      type: 'object',
      required: ['userId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        userId: { type: 'string', description: 'User ID to get daily reports for' },
        startDate: { type: 'string', description: 'Start date (ISO format, e.g., 2024-12-29)' },
        endDate: { type: 'string', description: 'End date (ISO format)' },
        projectId: { type: 'string', description: 'Specific daily report project ID' },
        includeSummary: { type: 'boolean', description: 'Include summary with missing dates (requires startDate and endDate)' },
      },
    },
  },
  {
    name: 'planka.helper.getMissingDailyReports',
    description: 'Check who hasn\'t written their daily report for a specific date. Perfect for "who hasn\'t written today\'s report" queries.',
    inputSchema: {
      type: 'object',
      required: ['date'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        date: { type: 'string', description: 'Date to check (ISO format, e.g., 2024-12-29)' },
        projectId: { type: 'string', description: 'Optional: specific daily report project' },
      },
    },
  },
  {
    name: 'planka.helper.generateDailyReportFromTasks',
    description: 'Generate a daily report draft from user\'s tasks and activities for a specific date. Shows completed tasks, created/updated cards, and comments.',
    inputSchema: {
      type: 'object',
      required: ['userId', 'date'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        userId: { type: 'string', description: 'User ID to generate report for' },
        date: { type: 'string', description: 'Date for the report (ISO format, e.g., 2024-12-29)' },
      },
    },
  },
  {
    name: 'planka.helper.getDailyReportProjects',
    description: 'List all daily report projects (projects named "Daily report - ...").',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
      },
    },
  },
];
