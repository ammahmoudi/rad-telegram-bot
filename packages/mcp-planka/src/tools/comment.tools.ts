export const commentTools = [
  {
    name: 'planka.comments.list',
    description: 'List comments on a card',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        cardId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.comments.create',
    description: 'Add a comment to a card',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId', 'text'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        cardId: { type: 'string' },
        text: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.comments.update',
    description: 'Update a comment',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'commentId', 'text'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        commentId: { type: 'string' },
        text: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.comments.delete',
    description: 'Delete a comment',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'commentId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        commentId: { type: 'string' },
      },
    },
  },
] as const;
