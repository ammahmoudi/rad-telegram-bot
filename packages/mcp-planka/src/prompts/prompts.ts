export const prompts = [
  {
    name: 'daily-standup',
    description: 'Generate a daily standup report for a user: completed tasks, in-progress, blockers',
    arguments: [
      { name: 'telegramUserId', description: 'Telegram user ID', required: true },
      { name: 'userName', description: 'Name of the user to generate report for', required: true },
    ],
  },
  {
    name: 'create-sprint-card',
    description: 'Template for creating a well-structured sprint card with acceptance criteria',
    arguments: [
      { name: 'telegramUserId', description: 'Telegram user ID', required: true },
      { name: 'cardTitle', description: 'Card title/name', required: true },
      { name: 'cardType', description: 'Type: feature, bug, task, or story', required: false },
    ],
  },
  {
    name: 'weekly-report',
    description: 'Generate a weekly status report for a user or project',
    arguments: [
      { name: 'telegramUserId', description: 'Telegram user ID', required: true },
      { name: 'userName', description: 'User name for personal report (optional)', required: false },
      { name: 'projectId', description: 'Project ID for project report (optional)', required: false },
    ],
  },
  {
    name: 'project-overview',
    description: 'Get comprehensive overview of project status: boards, progress, team members',
    arguments: [
      { name: 'telegramUserId', description: 'Telegram user ID', required: true },
      { name: 'projectId', description: 'Project ID to analyze', required: true },
    ],
  },
  {
    name: 'board-health-check',
    description: 'Analyze board health: overdue cards, unassigned tasks, blocked items',
    arguments: [
      { name: 'telegramUserId', description: 'Telegram user ID', required: true },
      { name: 'boardId', description: 'Board ID to check', required: true },
    ],
  },
] as const;
