import type { PlankaAuth } from '../planka.js';
import { filterCards } from '../api-optimized/index.js';

export const cardsFilterTools = [
  {
    name: 'planka_filter_cards',
    description:
      'Search and filter cards across all projects with powerful filtering options. Filter by assignment, status, dates, weight, type, labels, and more. Returns cards with full context (projects, boards, lists, users, labels). Use this for: "show my cards", "cards due this week", "open cards assigned to me", "cards by priority".',
    inputSchema: {
      type: 'object',
      properties: {
        projectIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by specific project IDs',
        },
        userIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by card member IDs (users assigned to cards)',
        },
        labelIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by label IDs',
        },
        cardType: {
          type: 'string',
          enum: ['project', 'story', 'epic', 'other'],
          description: 'Filter by card type',
        },
        status: {
          type: 'string',
          enum: ['open', 'closed', 'all'],
          description: 'Filter by card status (default: all)',
        },
        createdByUserId: {
          type: 'string',
          description: 'Filter by creator user ID. Use "me" for current user.',
        },
        assignedToUserId: {
          type: 'string',
          description: 'Filter by assigned user ID. Use "me" for current user.',
        },
        dueDateFrom: {
          type: 'string',
          description: 'Filter cards with due date after this date (ISO 8601)',
        },
        dueDateTo: {
          type: 'string',
          description: 'Filter cards with due date before this date (ISO 8601)',
        },
        startDateFrom: {
          type: 'string',
          description: 'Filter cards with start date after this date (ISO 8601)',
        },
        startDateTo: {
          type: 'string',
          description: 'Filter cards with start date before this date (ISO 8601)',
        },
        weightFrom: {
          type: 'number',
          description: 'Minimum card weight (1-10)',
        },
        weightTo: {
          type: 'number',
          description: 'Maximum card weight (1-10)',
        },
        sortBy: {
          type: 'string',
          enum: ['createdAt', 'dueDate', 'weight', 'name', 'position'],
          description: 'Sort cards by field (default: createdAt)',
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order (default: desc)',
        },
        page: {
          type: 'number',
          description: 'Page number (1-based, default: 1)',
        },
        pageSize: {
          type: 'number',
          description: 'Number of cards per page (1-500, default: 100)',
        },
      },
    },
  },
];

export async function handleCardsFilterTool(
  auth: PlankaAuth,
  name: string,
  args: any
): Promise<any> {
  if (name === 'planka_filter_cards') {
    return await filterCards(auth, {
      projectIds: args.projectIds,
      userIds: args.userIds,
      labelIds: args.labelIds,
      cardType: args.cardType,
      status: args.status,
      createdByUserId: args.createdByUserId,
      assignedToUserId: args.assignedToUserId,
      dueDateFrom: args.dueDateFrom,
      dueDateTo: args.dueDateTo,
      startDateFrom: args.startDateFrom,
      startDateTo: args.startDateTo,
      weightFrom: args.weightFrom,
      weightTo: args.weightTo,
      sortBy: args.sortBy,
      sortOrder: args.sortOrder,
      page: args.page,
      pageSize: args.pageSize,
    });
  }

  throw new Error(`Unknown tool: ${name}`);
}
