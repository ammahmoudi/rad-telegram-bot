/**
 * Prompt templates for Rastar menu operations
 */

export const prompts = [
  {
    name: 'weekly-menu-planner',
    description: 'Plan food selections for the entire week with preferences',
    arguments: [
      { name: 'accessToken', description: 'Rastar access token', required: true },
      { name: 'userId', description: 'User ID', required: true },
      { name: 'preferences', description: 'Food preferences (e.g., "vegetarian", "no rice")', required: false },
    ],
  },
  {
    name: 'today-menu-selector',
    description: 'Smart food selection for today based on preferences and history',
    arguments: [
      { name: 'accessToken', description: 'Rastar access token', required: true },
      { name: 'userId', description: 'User ID', required: true },
      { name: 'preferences', description: 'Food preferences or dietary restrictions', required: false },
    ],
  },
  {
    name: 'selection-reminder',
    description: 'Generate reminder for unselected days that need food selection',
    arguments: [
      { name: 'accessToken', description: 'Rastar access token', required: true },
      { name: 'userId', description: 'User ID', required: true },
      { name: 'daysAhead', description: 'Number of days to check ahead (default: 7)', required: false },
    ],
  },
  {
    name: 'menu-report',
    description: 'Generate comprehensive report of selections: stats, upcoming meals, unselected days',
    arguments: [
      { name: 'accessToken', description: 'Rastar access token', required: true },
      { name: 'userId', description: 'User ID', required: true },
      { name: 'period', description: 'Time period: "week", "month", or "all" (default: week)', required: false },
    ],
  },
  {
    name: 'auto-select-week',
    description: 'Automatically select meals for the week based on variety and preferences',
    arguments: [
      { name: 'accessToken', description: 'Rastar access token', required: true },
      { name: 'userId', description: 'User ID', required: true },
      { name: 'avoidDuplicates', description: 'Avoid selecting same food multiple times (default: true)', required: false },
      { name: 'preferences', description: 'Food preferences to prioritize', required: false },
    ],
  },
  {
    name: 'change-tomorrow',
    description: "Change tomorrow's food selection with smart suggestions",
    arguments: [
      { name: 'accessToken', description: 'Rastar access token', required: true },
      { name: 'userId', description: 'User ID', required: true },
      { name: 'reason', description: 'Reason for change (e.g., "want something lighter")', required: false },
    ],
  },
] as const;
