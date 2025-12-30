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
      'Get daily report entries for a user. Extracts content from card name, description, and comments. Optionally includes summary with missing dates.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get reports for. If omitted, uses current user.',
        },
        startDate: {
          type: 'string',
          description: 'Filter reports from this date (ISO format, e.g., "2024-01-01")',
        },
        endDate: {
          type: 'string',
          description: 'Filter reports to this date (ISO format)',
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
          description: 'Start date (ISO format, e.g., "2024-01-01")',
        },
        endDate: {
          type: 'string',
          description: 'End date (ISO format, e.g., "2024-01-31")',
        },
        userId: {
          type: 'string',
          description: 'User ID to check for. If omitted, checks ALL users.',
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
