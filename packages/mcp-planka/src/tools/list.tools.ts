export const listTools = [
  {
    name: 'planka.lists.list',
    description: 'List lists (columns) in a board',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'boardId'],
      properties: {
        telegramUserId: { type: 'string' },
        boardId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.lists.create',
    description: 'Create a new list (column) in a board',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'boardId', 'name'],
      properties: {
        telegramUserId: { type: 'string' },
        boardId: { type: 'string' },
        name: { type: 'string' },
        position: { type: 'number' },
        color: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.lists.update',
    description: 'Update a list (rename, reposition, change color)',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'listId'],
      properties: {
        telegramUserId: { type: 'string' },
        listId: { type: 'string' },
        name: { type: 'string' },
        position: { type: 'number' },
        color: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.lists.archive',
    description: 'Archive a list',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'listId'],
      properties: {
        telegramUserId: { type: 'string' },
        listId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.lists.delete',
    description: 'Delete a list and all its cards',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'listId'],
      properties: {
        telegramUserId: { type: 'string' },
        listId: { type: 'string' },
      },
    },
  },
] as const;
