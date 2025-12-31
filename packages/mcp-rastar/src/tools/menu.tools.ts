/**
 * Menu tools using helper functions
 * Includes both read operations (list, get selections) and write operations
 */

export const menuTools = [
  // Read operations
  {
    name: 'rastar_menu_get_today',
    description: "Get today's menu with available food options and selection status. Use this when user asks for today's menu.",
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
    name: 'rastar_menu_get_tomorrow',
    description: "Get tomorrow's menu with available food options and selection status. Use this when user asks for tomorrow's menu.",
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
    name: 'rastar_menu_get_this_week',
    description: "Get this week's menu (Saturday-Friday, Iranian calendar) with available food options and selection status. Use when user asks for this week's menu.",
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
    name: 'rastar_menu_get_next_week',
    description: "Get next week's menu with available food options and selection status. Use when user asks for next week's menu.",
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
    name: 'rastar_menu_get_selection_stats',
    description: 'Get comprehensive statistics about food selections including total days, selection rate, upcoming and past unselected days. Use when user asks about selection statistics or progress.',
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
    name: 'rastar_menu_get_unselected_days',
    description: 'Get list of dates where user has not selected food yet. Returns daily menu options for unselected days. Use when user asks about missing selections or days needing selection.',
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
  // Write operations
  {
    name: 'rastar_menu_change_selection',
    description: 'Change food selection for a specific date (atomically deletes old and creates new)',
    inputSchema: {
      type: 'object',
      required: ['accessToken', 'userId', 'date', 'newScheduleId'],
      properties: {
        accessToken: {
          type: 'string',
          description: 'Rastar access token',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        newScheduleId: {
          type: 'string',
          description: 'New menu schedule ID to select',
        },
      },
    },
  },
  {
    name: 'rastar_menu_select_food_by_date',
    description: 'Select a food item for a specific date by searching for the food name',
    inputSchema: {
      type: 'object',
      required: ['accessToken', 'userId', 'date', 'foodName'],
      properties: {
        accessToken: {
          type: 'string',
          description: 'Rastar access token',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
        foodName: {
          type: 'string',
          description: 'Name of the food to select (will search for partial match)',
        },
      },
    },
  },
  {
    name: 'rastar_menu_remove_selection_by_date',
    description: 'Remove food selection for a specific date',
    inputSchema: {
      type: 'object',
      required: ['accessToken', 'userId', 'date'],
      properties: {
        accessToken: {
          type: 'string',
          description: 'Rastar access token',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
      },
    },
  },
  {
    name: 'rastar_menu_bulk_select_foods',
    description: 'Select multiple food items at once (batch operation) by searching for food names',
    inputSchema: {
      type: 'object',
      required: ['accessToken', 'userId', 'selections'],
      properties: {
        accessToken: {
          type: 'string',
          description: 'Rastar access token',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
        selections: {
          type: 'array',
          description: 'Array of selections with date and foodName',
          items: {
            type: 'object',
            required: ['date', 'foodName'],
            properties: {
              date: {
                type: 'string',
                description: 'Date in YYYY-MM-DD format',
              },
              foodName: {
                type: 'string',
                description: 'Name of the food to select',
              },
            },
          },
        },
      },
    },
  },
] as const;
