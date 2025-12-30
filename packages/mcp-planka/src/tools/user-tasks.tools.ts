import type { PlankaAuth } from '../planka.js';
import { getUserCards, getCardHistory } from '../helpers/index.js';
import type { FilterOptions, SortOptions } from '../helpers/types.js';

export const userTasksTools = [
  {
    name: 'planka_get_user_cards',
    description:
      'Get all cards assigned to a user with filtering and sorting options. If userId is not provided, returns cards for the current logged-in user. Includes project name, board name, list name, labels, members, and due dates. Can optionally include full task items and card history.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to get cards for. If omitted, uses current user.',
        },
        filter: {
          type: 'object',
          description: 'Optional filtering options',
          properties: {
            projectId: { type: 'string', description: 'Filter by project ID' },
            boardId: { type: 'string', description: 'Filter by board ID' },
            listId: { type: 'string', description: 'Filter by list ID' },
            isCompleted: { type: 'boolean', description: 'Filter by completion status' },
            hasDescription: { type: 'boolean', description: 'Filter cards with description' },
            hasAttachments: { type: 'boolean', description: 'Filter cards with attachments' },
            hasTasks: { type: 'boolean', description: 'Filter cards with tasks' },
            dueDate: {
              type: 'object',
              description: 'Filter by due date',
              properties: {
                before: { type: 'string', description: 'ISO date string' },
                after: { type: 'string', description: 'ISO date string' },
              },
            },
            includeTasks: { 
              type: 'boolean', 
              description: 'Include full task items (checklist items) for each card. Default: false (only summary stats)' 
            },
            includeHistory: { 
              type: 'boolean', 
              description: 'Include card action history. Default: false' 
            },
          },
        },
        sort: {
          type: 'object',
          description: 'Optional sorting options',
          properties: {
            by: {
              type: 'string',
              enum: ['name', 'createdAt', 'updatedAt', 'dueDate', 'position'],
              description: 'Field to sort by',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order (default: asc)',
            },
          },
        },
      },
    },
  },
  {
    name: 'planka_get_card_history',
    description:
      'Get the complete history of a card including all actions (creation, updates, comments, member changes, label changes, attachment uploads, task updates).',
    inputSchema: {
      type: 'object',
      properties: {
        cardId: {
          type: 'string',
          description: 'Card ID to get history for',
        },
      },
      required: ['cardId'],
    },
  },
];

export async function handleUserTasksTool(auth: PlankaAuth, toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'planka_get_user_cards': {
      const userId = args.userId || undefined;
      const filter = args.filter as FilterOptions | undefined;
      const sort = args.sort as SortOptions | undefined;
      return await getUserCards(auth, userId, filter, sort);
    }

    case 'planka_get_card_history': {
      if (!args.cardId) {
        throw new Error('cardId is required');
      }
      return await getCardHistory(auth, args.cardId);
    }

    default:
      throw new Error(`Unknown user tasks tool: ${toolName}`);
  }
}
