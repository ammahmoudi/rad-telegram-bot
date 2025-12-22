import * as api from '../api/index.js';

export async function handleToolCall(name: string, args: any): Promise<any> {
  switch (name) {
    // Auth tools
    case 'rastar.auth.refresh':
      return api.refreshToken(args.refreshToken);

    // Menu tools
    case 'rastar.menu.list':
      return api.getMenuSchedule({ accessToken: args.accessToken });

    case 'rastar.menu.get_selections':
      return api.getUserMenuSelections(
        { accessToken: args.accessToken },
        args.userId
      );

    case 'rastar.menu.select_item':
      return api.createMenuSelection(
        { accessToken: args.accessToken },
        args.userId,
        args.menuScheduleId
      );

    case 'rastar.menu.delete_selection':
      return api.deleteMenuSelection(
        { accessToken: args.accessToken },
        args.selectionId
      );

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
