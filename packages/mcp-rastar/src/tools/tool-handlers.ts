import * as api from '../api/index.js';
import * as helpers from '../api/menu-helpers.js';

export async function handleToolCall(name: string, args: any): Promise<any> {
  console.error('[tool-handlers] handleToolCall called:', { 
    name, 
    hasAccessToken: !!args.accessToken,
    tokenLength: args.accessToken?.length,
    tokenPreview: args.accessToken?.substring(0, 20) + '...'
  });
  
  const auth = { accessToken: args.accessToken };

  switch (name) {
    // Auth tools
    case 'rastar.auth.refresh':
      return api.refreshToken(args.refreshToken);

    // Read operations (using helpers)
    case 'rastar.menu.get_today':
      return helpers.getTodayMenu(auth, args.userId);

    case 'rastar.menu.get_tomorrow':
      return helpers.getTomorrowMenu(auth, args.userId);

    case 'rastar.menu.get_this_week':
      return helpers.getThisWeekMenu(auth, args.userId);

    case 'rastar.menu.get_next_week':
      return helpers.getNextWeekMenu(auth, args.userId);

    case 'rastar.menu.get_selection_stats':
      return helpers.getSelectionStats(auth, args.userId);

    case 'rastar.menu.get_unselected_days':
      return helpers.getUnselectedDays(auth, args.userId);

    // Menu helper tools (new - user-friendly)
    case 'rastar.menu.change_selection':
      return helpers.changeSelection(auth, args.userId, {
        date: args.date,
        newMenuScheduleId: args.newScheduleId,
      });

    case 'rastar.menu.select_food_by_date':
      return helpers.selectFoodByDate(auth, args.userId, args.date, args.foodName);

    case 'rastar.menu.remove_selection_by_date':
      return helpers.removeSelectionByDate(auth, args.userId, args.date);

    case 'rastar.menu.bulk_select_foods':
      return helpers.bulkSelectFoods(auth, args.userId, args.selections);

    // Old raw API tools (disabled, kept for reference)
    // case 'rastar.menu.list':
    //   return api.getMenuSchedule(auth);
    // case 'rastar.menu.get_selections':
    //   return api.getUserMenuSelections(auth, args.userId);
    // case 'rastar.menu.select_item':
    //   return api.createMenuSelection(auth, args.userId, args.menuScheduleId);
    // case 'rastar.menu.delete_selection':
    //   return api.deleteMenuSelection(auth, args.selectionId);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
