export const commentTools = [
  {
    name: 'planka.comments.list',
    description: 'List comments on a card',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId'],
      properties: {
        telegramUserId: { type: 'string' },
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
        telegramUserId: { type: 'string' },
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
        telegramUserId: { type: 'string' },
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
        telegramUserId: { type: 'string' },
        commentId: { type: 'string' },
      },
    },
  },
] as const;
