export const menuTools = [
  {
    name: 'rastar.menu.list',
    description: 'Get the available food menu schedule',
    inputSchema: {
      type: 'object',
      required: ['accessToken'],
      properties: {
        accessToken: {
          type: 'string',
          description: 'Rastar access token',
        },
      },
    },
  },
  {
    name: 'rastar.menu.get_selections',
    description: "Get user's food menu selections",
    inputSchema: {
      type: 'object',
      required: ['accessToken', 'userId'],
      properties: {
        accessToken: {
          type: 'string',
          description: 'Rastar access token',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
    },
  },
  {
    name: 'rastar.menu.select_item',
    description: 'Select a food item from the menu',
    inputSchema: {
      type: 'object',
      required: ['accessToken', 'userId', 'menuScheduleId'],
      properties: {
        accessToken: {
          type: 'string',
          description: 'Rastar access token',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
        menuScheduleId: {
          type: 'string',
          description: 'Menu schedule ID to select',
        },
      },
    },
  },
  {
    name: 'rastar.menu.delete_selection',
    description: 'Delete a food menu selection',
    inputSchema: {
      type: 'object',
      required: ['accessToken', 'selectionId'],
      properties: {
        accessToken: {
          type: 'string',
          description: 'Rastar access token',
        },
        selectionId: {
          type: 'string',
          description: 'Selection ID to delete',
        },
      },
    },
  },
] as const;
