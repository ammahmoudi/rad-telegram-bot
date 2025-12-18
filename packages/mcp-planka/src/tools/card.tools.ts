export const cardTools = [
  {
    name: 'planka.cards.search',
    description: 'Search cards by substring match in name/description within a board',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'boardId', 'query'],
      properties: {
        telegramUserId: { type: 'string' },
        boardId: { type: 'string' },
        query: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.cards.create',
    description: 'Create a new card in a list',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'listId', 'name'],
      properties: {
        telegramUserId: { type: 'string' },
        listId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        position: { type: 'number' },
        dueDate: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.cards.update',
    description: 'Update a card (name, description, due date, position)',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId'],
      properties: {
        telegramUserId: { type: 'string' },
        cardId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        dueDate: { type: 'string' },
        position: { type: 'number' },
      },
    },
  },
  {
    name: 'planka.cards.move',
    description: 'Move a card to another list (optionally set position)',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId', 'listId'],
      properties: {
        telegramUserId: { type: 'string' },
        cardId: { type: 'string' },
        listId: { type: 'string' },
        position: { type: 'number' },
      },
    },
  },
  {
    name: 'planka.cards.delete',
    description: 'Delete a card',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId'],
      properties: {
        telegramUserId: { type: 'string' },
        cardId: { type: 'string' },
      },
    },
  },
] as const;
