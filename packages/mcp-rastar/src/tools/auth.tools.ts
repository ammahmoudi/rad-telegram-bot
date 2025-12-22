export const authTools = [
  {
    name: 'rastar.auth.refresh',
    description: 'Refresh access token using refresh token',
    inputSchema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Refresh token from previous login',
        },
      },
    },
  },
] as const;
