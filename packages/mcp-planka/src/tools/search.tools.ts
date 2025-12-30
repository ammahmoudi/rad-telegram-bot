import type { PlankaAuth } from '../planka.js';
import {
  searchUsers,
  searchProjects,
  searchBoards,
  searchCards,
  searchTasks,
  globalSearch,
} from '../helpers/index.js';
import type { SearchOptions } from '../helpers/types.js';

export const searchTools = [
  {
    name: 'planka_search_users',
    description:
      'Search for users by name, email, or username. Supports case-sensitive, whole word, and regex patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string',
        },
        options: {
          type: 'object',
          description: 'Search options',
          properties: {
            caseSensitive: {
              type: 'boolean',
              description: 'Case-sensitive search (default: false)',
            },
            wholeWord: {
              type: 'boolean',
              description: 'Match whole words only (default: false)',
            },
            useRegex: {
              type: 'boolean',
              description: 'Treat query as regex pattern (default: false)',
            },
          },
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'planka_search_projects',
    description:
      'Search for projects by name. Returns projects with board counts. Supports case-sensitive, whole word, and regex patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string',
        },
        options: {
          type: 'object',
          description: 'Search options',
          properties: {
            caseSensitive: {
              type: 'boolean',
              description: 'Case-sensitive search (default: false)',
            },
            wholeWord: {
              type: 'boolean',
              description: 'Match whole words only (default: false)',
            },
            useRegex: {
              type: 'boolean',
              description: 'Treat query as regex pattern (default: false)',
            },
          },
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'planka_search_boards',
    description:
      'Search for boards by name across all projects. Returns boards with project information. Supports case-sensitive, whole word, and regex patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string',
        },
        options: {
          type: 'object',
          description: 'Search options',
          properties: {
            caseSensitive: {
              type: 'boolean',
              description: 'Case-sensitive search (default: false)',
            },
            wholeWord: {
              type: 'boolean',
              description: 'Match whole words only (default: false)',
            },
            useRegex: {
              type: 'boolean',
              description: 'Treat query as regex pattern (default: false)',
            },
          },
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'planka_search_cards',
    description:
      'Search for cards by name or description. Returns enriched cards with project, board, list, and matched fields. Supports case-sensitive, whole word, and regex patterns. For current user only.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string',
        },
        userId: {
          type: 'string',
          description: 'User ID to search cards for. If omitted, uses current user.',
        },
        options: {
          type: 'object',
          description: 'Search options',
          properties: {
            caseSensitive: {
              type: 'boolean',
              description: 'Case-sensitive search (default: false)',
            },
            wholeWord: {
              type: 'boolean',
              description: 'Match whole words only (default: false)',
            },
            useRegex: {
              type: 'boolean',
              description: 'Treat query as regex pattern (default: false)',
            },
          },
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'planka_search_tasks',
    description:
      'Search for tasks (checklist items) by name. Returns enriched tasks with card, board, and project context. Supports case-sensitive, whole word, and regex patterns. For current user only.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string',
        },
        userId: {
          type: 'string',
          description: 'User ID to search tasks for. If omitted, uses current user.',
        },
        options: {
          type: 'object',
          description: 'Search options',
          properties: {
            caseSensitive: {
              type: 'boolean',
              description: 'Case-sensitive search (default: false)',
            },
            wholeWord: {
              type: 'boolean',
              description: 'Match whole words only (default: false)',
            },
            useRegex: {
              type: 'boolean',
              description: 'Treat query as regex pattern (default: false)',
            },
          },
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'planka_global_search',
    description:
      'Search across all entity types (users, projects, boards, cards, tasks) simultaneously. Returns comprehensive results from all categories. Supports case-sensitive, whole word, and regex patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string',
        },
        userId: {
          type: 'string',
          description: 'User ID for card/task search. If omitted, uses current user.',
        },
        options: {
          type: 'object',
          description: 'Search options',
          properties: {
            caseSensitive: {
              type: 'boolean',
              description: 'Case-sensitive search (default: false)',
            },
            wholeWord: {
              type: 'boolean',
              description: 'Match whole words only (default: false)',
            },
            useRegex: {
              type: 'boolean',
              description: 'Treat query as regex pattern (default: false)',
            },
          },
        },
      },
      required: ['query'],
    },
  },
];

export async function handleSearchTool(auth: PlankaAuth, toolName: string, args: any): Promise<any> {
  if (!args.query) {
    throw new Error('query is required');
  }

  const options: SearchOptions | undefined = args.options;

  switch (toolName) {
    case 'planka_search_users': {
      return await searchUsers(auth, args.query, options);
    }

    case 'planka_search_projects': {
      return await searchProjects(auth, args.query, options);
    }

    case 'planka_search_boards': {
      return await searchBoards(auth, args.query, options);
    }

    case 'planka_search_cards': {
      // Note: searchCards uses current user's cards only
      return await searchCards(auth, args.query, options);
    }

    case 'planka_search_tasks': {
      // Note: searchTasks uses current user's tasks only
      return await searchTasks(auth, args.query, options);
    }

    case 'planka_global_search': {
      // Note: card/task search uses current user only
      return await globalSearch(auth, args.query, options);
    }

    default:
      throw new Error(`Unknown search tool: ${toolName}`);
  }
}
