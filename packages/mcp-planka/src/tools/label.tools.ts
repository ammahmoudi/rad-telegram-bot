export const labelTools = [
  {
    name: 'planka.labels.list',
    description: 'List labels in a board',
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
    name: 'planka.labels.create',
    description: 'Create a new label in a board',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'boardId', 'name', 'color'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        boardId: { type: 'string' },
        name: { type: 'string' },
        color: { type: 'string' },
        position: { type: 'number' },
      },
    },
  },
  {
    name: 'planka.labels.update',
    description: 'Update a label (rename, change color, reposition)',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'labelId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        labelId: { type: 'string' },
        name: { type: 'string' },
        color: { type: 'string' },
        position: { type: 'number' },
      },
    },
  },
  {
    name: 'planka.labels.delete',
    description: 'Delete a label',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'labelId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        labelId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.labels.assignToCard',
    description: 'Assign a label to a card',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId', 'labelId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        cardId: { type: 'string' },
        labelId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.labels.removeFromCard',
    description: 'Remove a label from a card',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId', 'labelId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        cardId: { type: 'string' },
        labelId: { type: 'string' },
      },
    },
  },
] as const;
