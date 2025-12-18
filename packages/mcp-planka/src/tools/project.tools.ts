export const projectTools = [
  {
    name: 'planka.projects.list',
    description: 'List projects available to the user',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId'],
      properties: {
        telegramUserId: { type: 'string' },
      },
    },
  },
] as const;
