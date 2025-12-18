export const boardTools = [
  {
    name: 'planka.boards.list',
    description: 'List boards in a project',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'projectId'],
      properties: {
        telegramUserId: { type: 'string' },
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
        telegramUserId: { type: 'string' },
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
        telegramUserId: { type: 'string' },
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
        telegramUserId: { type: 'string' },
        boardId: { type: 'string' },
      },
    },
  },
] as const;
