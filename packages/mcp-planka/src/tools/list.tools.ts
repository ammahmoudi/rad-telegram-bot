export const listTools = [
  {
    name: 'planka.lists.list',
    description: 'List lists (columns) in a board',
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
  {
    name: 'planka.lists.create',
    description: 'Create a new list (column) in a board',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'boardId', 'name'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
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
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
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
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
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
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        listId: { type: 'string' },
      },
    },
  },
] as const;
