import type { PlankaAuth } from '../planka.js';
import {
  getDailyReportProjects,
  getUserDailyReports,
  getMissingDailyReports,
  createDailyReportCard,
} from '../helpers/index.js';

export const dailyReportsTools = [
  {
    name: 'planka_get_daily_report_projects',
    description:
      'Get all projects configured for daily reporting (projects starting with "Daily report"). Returns projects with their boards (each board represents a person).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'planka_get_user_daily_reports',
    description:
      'PREFERRED: Get user\'s daily report entries in ONE efficient call. Use this when user asks: "my daily report", "today\'s report", "this week\'s reports", "what did I report", "show my daily reports". Searches in Daily Report projects and returns existing report cards. Returns report content from card descriptions and comments. CRITICAL: When user mentions ANY time period ("today", "last 2 days", "this week", "yesterday"), you MUST pass startDate (and optionally endDate). If user asks "what have I done today" or similar, use planka_get_user_activity_summary instead as it shows actual work done, not just reports written.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get reports for. OPTIONAL: If omitted, gets reports for CURRENT user. Only specify when checking someone else\'s reports.',
        },
        startDate: {
          type: 'string',
          description: 'REQUIRED when user mentions time period. Start date to filter reports. Examples: For "last 2 days" → "2 days ago", For "today" → "today", For "this week" → "monday this week", For "yesterday" → "yesterday". Supports: ISO ("2024-01-01"), relative ("7 days ago", "last monday"), natural ("yesterday", "today").',
        },
        endDate: {
          type: 'string',
          description: 'End date filter. Usually "today" or "now" for current queries. Supports same formats as startDate. If omitted, defaults to current time.',
        },
        projectId: {
          type: 'string',
          description: 'Filter to specific daily report project ID',
        },
        includeSummary: {
          type: 'boolean',
          description: 'Include summary with missing dates (requires startDate and endDate). Shows which dates have reports and which are missing.',
        },
      },
    },
  },
  {
    name: 'planka_get_missing_daily_reports',
    description:
      'Check who is missing daily reports within a date range. By default checks ALL users in daily report projects. Optionally filter to specific user. Excludes weekends by default.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date (supports: ISO "2024-01-01", relative "7 days ago", natural "last monday"). For "this week", calculate Monday date.',
        },
        endDate: {
          type: 'string',
          description: 'End date (supports: ISO, relative, natural). Usually "today" for current queries.',
        },
        userId: {
          type: 'string',
          description: 'User ID to check for. OPTIONAL: If omitted, checks ALL users. Specify to check only one person.',
        },
        includeWeekends: {
          type: 'boolean',
          description: 'If true, includes weekends in the check (default: false)',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'planka_create_daily_report_card',
    description:
      'Create a daily report card with provided content. Use when user asks: "create my daily report", "write my daily report", "add today\'s report". IMPORTANT: This tool does NOT fetch activity data - you must first use planka_get_user_activity_summary or planka_get_user_actions to get what the user did, then call this tool with the formatted content. This tool only creates the card in the correct daily report project/board/list.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Card title/name. Example: "Daily Report", "Work Summary". This will be enriched with dates automatically.',
        },
        description: {
          type: 'string',
          description: 'REQUIRED: The report content (markdown formatted). This is what the user did today. You should gather this from activity tools first, then format it nicely before calling this tool.',
        },
        date: {
          type: 'string',
          description: 'Date for the report. Examples: "today", "yesterday", "2024-01-15". Defaults to "today" if omitted.',
        },
        userId: {
          type: 'string',
          description: 'User ID to create report for. OPTIONAL: If omitted, creates for CURRENT user.',
        },
      },
      required: ['name', 'description'],
    },
  },
];

export async function handleDailyReportsTool(auth: PlankaAuth, toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'planka_get_daily_report_projects': {
      return await getDailyReportProjects(auth);
    }

    case 'planka_get_user_daily_reports': {
      const userId = args.userId || undefined;
      return await getUserDailyReports(auth, userId, {
        startDate: args.startDate,
        endDate: args.endDate,
        projectId: args.projectId,
        includeSummary: args.includeSummary || false,
      });
    }

    case 'planka_get_missing_daily_reports': {
      if (!args.startDate || !args.endDate) {
        throw new Error('startDate and endDate are required');
      }
      return await getMissingDailyReports(auth, args.startDate, args.endDate, {
        userId: args.userId,
        includeWeekends: args.includeWeekends || false,
      });
    }

    case 'planka_create_daily_report_card': {
      if (!args.name || !args.description) {
        throw new Error('name and description are required');
      }
      return await createDailyReportCard(auth, args.userId, args.name, args.description, args.date || 'today');
    }

    default:
      throw new Error(`Unknown daily reports tool: ${toolName}`);
  }
}
