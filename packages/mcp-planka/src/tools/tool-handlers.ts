import type { PlankaAuth } from '../planka.js';
import { handleUserActivityTool } from './user-activity.tools.js';
import { handleProjectStatusTool } from './project-status.tools.js';
import { handleDailyReportsTool } from './daily-reports.tools.js';
import { handleCardsFilterTool } from './cards-filter.tools.js';
import { handleAdvancedSearchTool } from './advanced-search.tools.js';
import { handleActivityFeedTool } from './activity-feed.tools.js';
import { requireAuth, text as textHelper } from './helpers.js';

type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>;
};

export async function handleToolCall(request: { params: { name: string; arguments: any } }): Promise<ToolResponse> {
  const { name, arguments: args } = request.params;

  try {
    // Get auth from args (handles environment vars via requireAuth)
    const auth = await requireAuth(args);

    // Cards Filter tool
    if (name === 'planka_filter_cards') {
      const result = await handleCardsFilterTool(auth, name, args);
      return textHelper(JSON.stringify(result, null, 2));
    }

    // Advanced Search tools
    if (name === 'planka_search_users_advanced' ||
        name === 'planka_search_projects_advanced' ||
        name === 'planka_search_boards_advanced' ||
        name === 'planka_search_cards_advanced' ||
        name === 'planka_global_search_advanced') {
      const result = await handleAdvancedSearchTool(auth, name, args);
      return textHelper(JSON.stringify(result, null, 2));
    }

    // Activity Feed tools
    if (name === 'planka_get_user_actions_feed' ||
        name === 'planka_get_system_history' ||
        name === 'planka_get_activity_feed') {
      const result = await handleActivityFeedTool(auth, name, args);
      return textHelper(JSON.stringify(result, null, 2));
    }

    // User Activity tools
    if (name === 'planka_get_user_notifications' ||
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
        name === 'planka_get_missing_daily_reports' ||
        name === 'planka_create_daily_report_card') {
      const result = await handleDailyReportsTool(auth, name, args);
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
