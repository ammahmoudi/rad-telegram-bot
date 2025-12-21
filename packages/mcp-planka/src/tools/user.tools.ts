export const userTools = [
  {
    name: 'planka.users.listAll',
    description: 'List all unique users across all accessible projects and boards. Returns user ID, name, username, and email. Useful for debugging search queries - shows exact user names in Planka.',
    inputSchema: {
      type: 'object',
      required: ['plankaBaseUrl', 'plankaToken'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
      },
    },
  },
] as const;
