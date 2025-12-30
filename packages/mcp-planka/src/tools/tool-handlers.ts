import type { PlankaAuth } from '../planka.js';
import { handleUserTasksTool } from './user-tasks.tools.js';
import { handleUserActivityTool } from './user-activity.tools.js';
import { handleProjectStatusTool } from './project-status.tools.js';
import { handleDailyReportsTool } from './daily-reports.tools.js';
import { handleSearchTool } from './search.tools.js';
import { requireAuth, text as textHelper } from './helpers.js';

type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>;
};

export async function handleToolCall(request: { params: { name: string; arguments: any } }): Promise<ToolResponse> {
  const { name, arguments: args } = request.params;

  try {
    // Get auth from args (handles environment vars via requireAuth)
    const auth = await requireAuth(args);

    // User Tasks tools
    if (name === 'planka_get_user_cards' || 
        name === 'planka_get_card_history') {
      const result = await handleUserTasksTool(auth, name, args);
      return textHelper(JSON.stringify(result, null, 2));
    }

    // User Activity tools
    if (name === 'planka_get_user_notifications' || 
        name === 'planka_get_user_actions' ||
        name === 'planka_get_user_activity_summary') {
      const result = await handleUserActivityTool(auth, name, args);
      return textHelper(JSON.stringify(result, null, 2));
    }

    // Project Status tools
    if (name === 'planka_get_project_status' || 
        name === 'planka_get_board_status') {
      const result = await handleProjectStatusTool(auth, name, args);
      return textHelper(JSON.stringify(result, null, 2));
    }

    // Daily Reports tools
    if (name === 'planka_get_daily_report_projects' || 
        name === 'planka_get_user_daily_reports' || 
        name === 'planka_get_missing_daily_reports') {
      const result = await handleDailyReportsTool(auth, name, args);
      return textHelper(JSON.stringify(result, null, 2));
    }

    // Search tools
    if (name === 'planka_search_users' || 
        name === 'planka_search_projects' || 
        name === 'planka_search_boards' || 
        name === 'planka_search_cards' || 
        name === 'planka_search_tasks' || 
        name === 'planka_global_search') {
      const result = await handleSearchTool(auth, name, args);
      return textHelper(JSON.stringify(result, null, 2));
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
}
