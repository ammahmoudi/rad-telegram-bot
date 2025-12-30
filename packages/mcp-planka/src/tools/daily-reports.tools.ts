import type { PlankaAuth } from '../planka.js';
import {
  getDailyReportProjects,
  getUserDailyReports,
  getMissingDailyReports,
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
      'PREFERRED: Get user\'s daily report entries in ONE efficient call. Use this when user asks: "my daily report", "today\'s report", "this week\'s reports", "what did I report". Automatically finds reports from Daily Report projects. DON\'T use multiple planka_search_* calls instead. IMPORTANT: When user mentions ANY time period ("today", "last 2 days", "this week"), you MUST pass startDate (and optionally endDate). Do NOT call without dates when user asks for reports from a specific time range.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get reports for. OPTIONAL: If omitted, gets reports for CURRENT user. Only specify when checking someone else\'s reports.',
        },
        startDate: {
          type: 'string',
          description: 'REQUIRED when user mentions time period. Examples: For "last 2 days" → "2 days ago", For "today" → "today", For "this week" → "monday this week". Supports: ISO ("2024-01-01"), relative ("7 days ago", "last monday"), natural ("yesterday", "today").',
        },
        endDate: {
          type: 'string',
          description: 'End date filter. Usually "today" for current queries. Supports same formats as startDate.',
        },
        projectId: {
          type: 'string',
          description: 'Filter to specific daily report project',
        },
        includeSummary: {
          type: 'boolean',
          description: 'Include summary with missing dates (requires startDate and endDate)',
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

    default:
      throw new Error(`Unknown daily reports tool: ${toolName}`);
  }
}
