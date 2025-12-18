export const memberTools = [
  {
    name: 'planka.members.list',
    description: 'List members in a project',
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
    name: 'planka.members.assignToCard',
    description: 'Assign a member to a card',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId', 'userId'],
      properties: {
        telegramUserId: { type: 'string' },
        cardId: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.members.removeFromCard',
    description: 'Remove a member from a card',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId', 'userId'],
      properties: {
        telegramUserId: { type: 'string' },
        cardId: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  },
] as const;
