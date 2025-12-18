export const cardTools = [
  {
    name: 'planka.cards.searchGlobal',
    description: 'Search for cards across ALL projects and boards accessible to the user. Very efficient for finding a person\'s tasks or cards mentioning specific keywords. Returns cards with project/board context.',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'query'],
      properties: {
        telegramUserId: { type: 'string' },
        query: { type: 'string', description: 'Search term (person name, keyword, etc.)' },
      },
    },
  },
  {
    name: 'planka.cards.list',
    description: 'List all cards in a board or specific list. Returns cards with member assignments (memberIds array). Use this to see all cards without filtering.',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'boardId'],
      properties: {
        telegramUserId: { type: 'string' },
        boardId: { type: 'string' },
        listId: { type: 'string', description: 'Optional: filter cards by list ID' },
      },
    },
  },
  {
    name: 'planka.cards.search',
    description: 'Search cards by substring match in name/description within a board. Returns cards with member assignments (memberIds array). Good for finding cards mentioning a person\'s name.',
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
