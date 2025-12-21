export const authTools = [
  {
    name: 'planka.auth.status',
    description: 'Check Planka authentication status with provided credentials',
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
