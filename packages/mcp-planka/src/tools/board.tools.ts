export const boardTools = [
  {
    name: 'planka.boards.list',
    description: 'List boards in a project',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'projectId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        projectId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.boards.create',
    description: 'Create a new board in a project',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'projectId', 'name'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        projectId: { type: 'string' },
        name: { type: 'string' },
        position: { type: 'number' },
      },
    },
  },
  {
    name: 'planka.boards.update',
    description: 'Update a board (rename, reposition)',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'boardId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        boardId: { type: 'string' },
        name: { type: 'string' },
        position: { type: 'number' },
      },
    },
  },
  {
    name: 'planka.boards.delete',
    description: 'Delete a board',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'boardId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        boardId: { type: 'string' },
      },
    },
  },
] as const;
