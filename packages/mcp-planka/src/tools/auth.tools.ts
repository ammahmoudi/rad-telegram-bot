export const authTools = [
  {
    name: 'planka.auth.status',
    description: 'Check whether a Telegram user has linked Planka',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId'],
      properties: {
        telegramUserId: { type: 'string' },
      },
    },
  },
] as const;
