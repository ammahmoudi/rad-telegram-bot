import type { PlankaAuth } from '../planka.js';
import { getUserActions, getHistory, getFeed } from '../api-optimized/index.js';

export const activityFeedTools = [
  {
    name: 'planka_get_user_actions_feed',
    description:
      'Get actions performed by a specific user with filtering options. Returns paginated actions with context (boards, cards). Use for: "what did I do", "user activity history", "actions by user".',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get actions for. Use "me" for current user.',
        },
        actionTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by action types (e.g., createCard, moveCard, addMemberToCard)',
        },
        projectIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by project IDs',
        },
        boardIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by board IDs',
        },
        from: {
          type: 'string',
          description: 'Filter actions after this date (ISO 8601)',
        },
        to: {
          type: 'string',
          description: 'Filter actions before this date (ISO 8601)',
        },
        page: {
          type: 'number',
          description: 'Page number (1-based, default: 1)',
        },
        pageSize: {
          type: 'number',
          description: 'Number of actions per page (1-100, default: 50)',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'planka_get_system_history',
    description:
      'Get system-wide history combining project history and actions. Returns all activities across the entire system with filtering options. Use for: "recent system activity", "what happened recently", "activity log".',
    inputSchema: {
      type: 'object',
      properties: {
        types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['project-history', 'action'],
          },
          description: 'Filter by entry types',
        },
        projectIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by project IDs',
        },
        boardIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by board IDs (for actions only)',
        },
        userIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by user IDs (who performed the action)',
        },
        from: {
          type: 'string',
          description: 'Filter history after this date (ISO 8601)',
        },
        to: {
          type: 'string',
          description: 'Filter history before this date (ISO 8601)',
        },
        page: {
          type: 'number',
          description: 'Page number (1-based, default: 1)',
        },
        pageSize: {
          type: 'number',
          description: 'Number of items per page (1-100, default: 50)',
        },
      },
    },
  },
  {
    name: 'planka_get_activity_feed',
    description:
      'Get combined activity feed with actions and notifications. The most comprehensive activity view - shows both what happened (actions) and what users were notified about (notifications). Use for: "activity feed", "recent updates", "what\'s happening", "notification feed".',
    inputSchema: {
      type: 'object',
      properties: {
        types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['action', 'notification'],
          },
          description: 'Filter by entry types (default: both)',
        },
        projectIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by project IDs',
        },
        boardIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by board IDs',
        },
        cardIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by card IDs',
        },
        userIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by user IDs (who performed the action)',
        },
        from: {
          type: 'string',
          description: 'Filter feed after this date (ISO 8601)',
        },
        to: {
          type: 'string',
          description: 'Filter feed before this date (ISO 8601)',
        },
        page: {
          type: 'number',
          description: 'Page number (1-based, default: 1)',
        },
        pageSize: {
          type: 'number',
          description: 'Number of items per page (1-100, default: 50)',
        },
      },
    },
  },
];

export async function handleActivityFeedTool(
  auth: PlankaAuth,
  name: string,
  args: any
): Promise<any> {
  switch (name) {
    case 'planka_get_user_actions_feed':
      return await getUserActions(auth, {
        userId: args.userId || 'me',
        actionTypes: args.actionTypes,
        projectIds: args.projectIds,
        boardIds: args.boardIds,
        from: args.from,
        to: args.to,
        page: args.page,
        pageSize: args.pageSize,
      });

    case 'planka_get_system_history':
      return await getHistory(auth, {
        types: args.types,
        projectIds: args.projectIds,
        boardIds: args.boardIds,
        userIds: args.userIds,
        from: args.from,
        to: args.to,
        page: args.page,
        pageSize: args.pageSize,
      });

    case 'planka_get_activity_feed':
      return await getFeed(auth, {
        types: args.types,
        projectIds: args.projectIds,
        boardIds: args.boardIds,
        cardIds: args.cardIds,
        userIds: args.userIds,
        from: args.from,
        to: args.to,
        page: args.page,
        pageSize: args.pageSize,
      });

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
