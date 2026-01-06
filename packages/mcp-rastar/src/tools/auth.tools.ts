/**
 * Authentication tools
 */

export const authTools = [
  {
    name: 'rastar_auth_refresh',
    description: 'Refresh access token using refresh token',
    inputSchema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Refresh token from previous authentication',
        },
      },
    },
  },
] as const;
