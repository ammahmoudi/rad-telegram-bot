import type { PlankaAuth } from '../planka.js';
import {
  getUserNotifications,
  getUserActions,
  getUserActivitySummary,
} from '../helpers/index.js';

export const userActivityTools = [
  {
    name: 'planka_get_user_notifications',
    description:
      'Get all notifications for a user (things that happened TO/FOR the user - assignments, comments on their cards, etc.). If userId is not provided, returns notifications for the current logged-in user. Includes read/unread status.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get notifications for. If omitted, uses current user.',
        },
        unreadOnly: {
          type: 'boolean',
          description: 'If true, only return unread notifications',
        },
      },
    },
  },
  {
    name: 'planka_get_user_actions',
    description:
      'Get all actions/activities performed BY a user (things the user DID - cards created, comments posted, tasks completed, etc.). Supports filtering by date range, project, and board. If userId is not provided, returns actions for the current logged-in user.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get actions for. If omitted, uses current user.',
        },
        startDate: {
          type: 'string',
          description: 'Start date filter (ISO format, e.g., "2024-01-01")',
        },
        endDate: {
          type: 'string',
          description: 'End date filter (ISO format, e.g., "2024-01-31")',
        },
        projectId: {
          type: 'string',
          description: 'Filter by specific project ID',
        },
        boardId: {
          type: 'string',
          description: 'Filter by specific board ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of actions to return',
        },
      },
    },
  },
  {
    name: 'planka_get_user_activity_summary',
    description:
      'Get complete activity summary for a user - includes both actions they performed (what they DID) AND notifications they received (what happened TO them) in one call. Returns activity, notifications, and summary statistics. Perfect for dashboard views or getting the complete picture.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get summary for. If omitted, uses current user.',
        },
        startDate: {
          type: 'string',
          description: 'Start date for actions filter (ISO format, e.g., "2024-01-01")',
        },
        endDate: {
          type: 'string',
          description: 'End date for actions filter (ISO format, e.g., "2024-01-31")',
        },
        unreadNotificationsOnly: {
          type: 'boolean',
          description: 'If true, only return unread notifications (default: false)',
        },
        includeActivity: {
          type: 'boolean',
          description: 'Include action items (default: true)',
        },
        includeNotifications: {
          type: 'boolean',
          description: 'Include notifications (default: true)',
        },
      },
    },
  },
];

export async function handleUserActivityTool(auth: PlankaAuth, toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'planka_get_user_notifications': {
      const userId = args.userId || undefined;
      const unreadOnly = args.unreadOnly || false;
      return await getUserNotifications(auth, userId, { unreadOnly });
    }

    case 'planka_get_user_actions': {
      const userId = args.userId || undefined;
      return await getUserActions(auth, userId, {
        startDate: args.startDate,
        endDate: args.endDate,
        projectId: args.projectId,
        boardId: args.boardId,
        limit: args.limit,
      });
    }

    case 'planka_get_user_activity_summary': {
      const userId = args.userId || undefined;
      return await getUserActivitySummary(auth, userId, {
        startDate: args.startDate,
        endDate: args.endDate,
        unreadNotificationsOnly: args.unreadNotificationsOnly,
        includeActivity: args.includeActivity,
        includeNotifications: args.includeNotifications,
      });
    }

    default:
      throw new Error(`Unknown user activity tool: ${toolName}`);
  }
}
