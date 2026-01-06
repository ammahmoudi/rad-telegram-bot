import type { PlankaAuth } from '../planka.js';
import {
  searchUsers,
  searchProjects,
  searchBoards,
  searchCards,
  globalSearch,
} from '../api-optimized/index.js';

export const advancedSearchTools = [
  {
    name: 'planka_search_users_advanced',
    description:
      'Search for users by name, username, or email. Returns paginated results with user details.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string (minimum 2 characters)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'planka_search_projects_advanced',
    description:
      'Search for projects by name or description. Returns paginated results with project details.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string (minimum 2 characters)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'planka_search_boards_advanced',
    description:
      'Search for boards by name. Returns paginated results with board details.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string (minimum 2 characters)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'planka_search_cards_advanced',
    description:
      'Search for cards by name, description, or comments. Returns paginated results with card details.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string (minimum 2 characters)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'planka_global_search_advanced',
    description:
      'Search across all entities (users, projects, boards, cards) in one call. Use this for broad searches when you don\'t know which entity type to search.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string (minimum 2 characters)',
        },
        types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['project', 'board', 'card', 'user'],
          },
          description: 'Limit search to specific entity types (default: all types)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results per type (1-50, default: 10)',
        },
      },
      required: ['query'],
    },
  },
];

export async function handleAdvancedSearchTool(
  auth: PlankaAuth,
  name: string,
  args: any
): Promise<any> {
  switch (name) {
    case 'planka_search_users_advanced':
      return await searchUsers(auth, args.query, args.limit);

    case 'planka_search_projects_advanced':
      return await searchProjects(auth, args.query, args.limit);

    case 'planka_search_boards_advanced':
      return await searchBoards(auth, args.query, args.limit);

    case 'planka_search_cards_advanced':
      return await searchCards(auth, args.query, args.limit);

    case 'planka_global_search_advanced':
      return await globalSearch(auth, {
        query: args.query,
        types: args.types,
        limit: args.limit,
      });

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
