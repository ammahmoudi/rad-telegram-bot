export const attachmentTools = [
  {
    name: 'planka.attachments.list',
    description: 'List attachments on a card',
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
    name: 'planka.attachments.delete',
    description: 'Delete an attachment',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'attachmentId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        attachmentId: { type: 'string' },
      },
    },
  },
] as const;
