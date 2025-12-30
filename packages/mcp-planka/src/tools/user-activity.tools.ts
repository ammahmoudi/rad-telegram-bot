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
          description: 'User ID to get notifications for. OPTIONAL: If omitted, gets notifications for CURRENT user. Only specify when checking someone else\'s notifications.',
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
      'Get actions/activities performed BY a user (things the user DID - cards created, comments posted, tasks completed). Use ONLY when you need actions specifically, without notifications. For complete picture, prefer planka_get_user_activity_summary instead. IMPORTANT: When user mentions ANY time period ("today", "last 2 days", "this week"), you MUST pass startDate. Do NOT call without dates when user specifies a time range.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get actions for. OPTIONAL: If omitted, gets actions for the CURRENT logged-in user. Only specify when asking about someone else (e.g., "what did John do").',
        },
        startDate: {
          type: 'string',
          description: 'REQUIRED when user mentions time period. Examples: For "last 2 days" → "2 days ago", For "today" → "today", For "yesterday" → "yesterday". Supports: ISO format ("2024-01-01"), relative ("2 days ago", "yesterday"), or natural ("today").',
        },
        endDate: {
          type: 'string',
          description: 'End date filter. Supports: ISO format, relative dates, or natural language. LLM should calculate for queries like "this week" as: endDate="today".',
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
      'PREFERRED: Get complete activity summary for a user in ONE efficient call. Includes both actions performed (what they DID) AND notifications received (what happened TO them) plus statistics. Use this instead of calling planka_get_user_actions + planka_get_user_notifications separately. Perfect for: "what did I do today", "my activity this week", "show my work summary", dashboard views.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get summary for. OPTIONAL: If omitted, gets summary for CURRENT user. Only specify when asking about someone else (e.g., "show me what Sarah did").',
        },
        startDate: {
          type: 'string',
          description: 'Start date for actions filter. Supports: ISO ("2024-01-01"), relative ("3 days ago", "yesterday"), natural ("today"). For "last week", use "7 days ago". For "this week", use "monday this week" or calculate Monday date.',
        },
        endDate: {
          type: 'string',
          description: 'End date for actions filter. Supports: ISO, relative, natural. Usually "today" for current period queries.',
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
