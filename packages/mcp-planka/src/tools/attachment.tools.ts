export const attachmentTools = [
  {
    name: 'planka.attachments.list',
    description: 'List attachments on a card',
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
    name: 'planka.attachments.delete',
    description: 'Delete an attachment',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'attachmentId'],
      properties: {
        telegramUserId: { type: 'string' },
        attachmentId: { type: 'string' },
      },
    },
  },
] as const;
