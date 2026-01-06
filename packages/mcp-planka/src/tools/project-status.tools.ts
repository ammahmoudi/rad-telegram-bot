import type { PlankaAuth } from '../planka.js';
import {
  getProjectStatus,
  getBoardStatus,
} from '../helpers/index.js';

export const projectStatusTools = [
  {
    name: 'planka_get_project_status',
    description:
      'Get comprehensive status of a project including all boards with card counts, completion rates, and progress tracking. Supports filtering by date range, completion status, and user assignment.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID to get status for',
        },
        startDate: {
          type: 'string',
          description: 'Filter cards updated after this date (ISO format, e.g., "2024-01-01")',
        },
        endDate: {
          type: 'string',
          description: 'Filter cards updated before this date (ISO format, e.g., "2024-01-31")',
        },
        includeCompleted: {
          type: 'boolean',
          description: 'Include completed cards (default: true)',
        },
        includeIncomplete: {
          type: 'boolean',
          description: 'Include incomplete cards (default: true)',
        },
        userId: {
          type: 'string',
          description: 'Filter cards assigned to specific user',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'planka_get_board_status',
    description:
      'Get detailed status of a board including all lists with card counts, completion rates, and task progress. Supports filtering by date range, completion status, user assignment, and specific list.',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'string',
          description: 'Board ID to get status for',
        },
        startDate: {
          type: 'string',
          description: 'Filter cards updated after this date (ISO format)',
        },
        endDate: {
          type: 'string',
          description: 'Filter cards updated before this date (ISO format)',
        },
        includeCompleted: {
          type: 'boolean',
          description: 'Include completed cards (default: true)',
        },
        includeIncomplete: {
          type: 'boolean',
          description: 'Include incomplete cards (default: true)',
        },
        userId: {
          type: 'string',
          description: 'Filter cards assigned to specific user',
        },
        listId: {
          type: 'string',
          description: 'Filter cards in specific list',
        },
      },
      required: ['boardId'],
    },
  },
];

export async function handleProjectStatusTool(auth: PlankaAuth, toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'planka_get_project_status': {
      if (!args.projectId) {
        throw new Error('projectId is required');
      }
      return await getProjectStatus(auth, args.projectId, {
        startDate: args.startDate,
        endDate: args.endDate,
        includeCompleted: args.includeCompleted,
        includeIncomplete: args.includeIncomplete,
        userId: args.userId,
      });
    }

    case 'planka_get_board_status': {
      if (!args.boardId) {
        throw new Error('boardId is required');
      }
      return await getBoardStatus(auth, args.boardId, {
        startDate: args.startDate,
        endDate: args.endDate,
        includeCompleted: args.includeCompleted,
        includeIncomplete: args.includeIncomplete,
        userId: args.userId,
        listId: args.listId,
      });
    }

    default:
      throw new Error(`Unknown project status tool: ${toolName}`);
  }
}
