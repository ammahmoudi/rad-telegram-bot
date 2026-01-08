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
    name: 'write-daily-report',
    description: 'Assist user in writing their daily report by analyzing their actions and suggesting content based on what they actually did',
    arguments: [
      { name: 'telegramUserId', description: 'Telegram user ID', required: true },
      { name: 'userName', description: 'User name for the report', required: true },
      { name: 'date', description: 'Date for the report (default: today)', required: false },
    ],
  },
  {
    name: 'check-person-status',
    description: 'Get comprehensive status of a team member: recent activity, daily reports, assigned tasks, and work progress',
    arguments: [
      { name: 'telegramUserId', description: 'Telegram user ID', required: true },
      { name: 'targetUserName', description: 'Name of the person to check', required: true },
    ],
  },
  {
    name: 'find-incomplete-tasks',
    description: 'Find all not-done/incomplete tasks for a user, organized by urgency (overdue, due today, due soon, others)',
    arguments: [
      { name: 'telegramUserId', description: 'Telegram user ID', required: true },
      { name: 'userName', description: 'User name to find tasks for (optional - defaults to current user)', required: false },
    ],
  },
  {
    name: 'my-work-today',
    description: 'Show comprehensive summary of what the user did today: actions performed, notifications received, cards worked on',
    arguments: [
      { name: 'telegramUserId', description: 'Telegram user ID', required: true },
      { name: 'includeNotifications', description: 'Include notifications (default: true)', required: false },
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
  {
    name: 'team-status-overview',
    description: 'Get overview of entire team status: who is working on what, recent activity, daily reports compliance',
    arguments: [
      { name: 'telegramUserId', description: 'Telegram user ID', required: true },
      { name: 'projectId', description: 'Project ID to check team for (optional)', required: false },
    ],
  },
] as const;
