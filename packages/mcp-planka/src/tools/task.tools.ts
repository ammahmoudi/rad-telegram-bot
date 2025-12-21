export const taskTools = [
  {
    name: 'planka.taskLists.create',
    description: 'Create a task list on a card',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId', 'name'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        cardId: { type: 'string' },
        name: { type: 'string' },
        position: { type: 'number' },
      },
    },
  },
  {
    name: 'planka.taskLists.update',
    description: 'Update a task list (rename, reposition)',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'taskListId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        taskListId: { type: 'string' },
        name: { type: 'string' },
        position: { type: 'number' },
      },
    },
  },
  {
    name: 'planka.taskLists.delete',
    description: 'Delete a task list',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'taskListId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        taskListId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.tasks.create',
    description: 'Create a task in a task list',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'taskListId', 'name'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        taskListId: { type: 'string' },
        name: { type: 'string' },
        position: { type: 'number' },
      },
    },
  },
  {
    name: 'planka.tasks.update',
    description: 'Update a task (rename, toggle completion, reposition)',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'taskId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        taskId: { type: 'string' },
        name: { type: 'string' },
        isCompleted: { type: 'boolean' },
        position: { type: 'number' },
      },
    },
  },
  {
    name: 'planka.tasks.delete',
    description: 'Delete a task',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'taskId'],
      properties: {
        plankaBaseUrl: { type: 'string', description: 'Planka server base URL' },
        plankaToken: { type: 'string', description: 'Planka access token' },
        taskId: { type: 'string' },
      },
    },
  },
] as const;
