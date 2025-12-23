/**
 * Menu resources using helper functions
 * Resources provide read-only data/information
 */

export const menuResources = [
  {
    uri: 'rastar://menu/with-selections?accessToken={token}&userId={userId}',
    name: 'Menu with user selections',
    description: 'Get menu schedule combined with user selections, organized by date (requires ?accessToken=TOKEN&userId=USER_ID)',
    mimeType: 'application/json',
  },
  {
    uri: 'rastar://menu/today?accessToken={token}&userId={userId}',
    name: "Today's menu",
    description: "Get today's available food options with selection status (requires ?accessToken=TOKEN&userId=USER_ID)",
    mimeType: 'application/json',
  },
  {
    uri: 'rastar://menu/tomorrow?accessToken={token}&userId={userId}',
    name: "Tomorrow's menu",
    description: "Get tomorrow's available food options with selection status (requires ?accessToken=TOKEN&userId=USER_ID)",
    mimeType: 'application/json',
  },
  {
    uri: 'rastar://menu/this-week?accessToken={token}&userId={userId}',
    name: 'This week menu',
    description: 'Get current week (Monday-Sunday) menu with selections (requires ?accessToken=TOKEN&userId=USER_ID)',
    mimeType: 'application/json',
  },
  {
    uri: 'rastar://menu/next-week?accessToken={token}&userId={userId}',
    name: 'Next week menu',
    description: 'Get next week menu with selections (requires ?accessToken=TOKEN&userId=USER_ID)',
    mimeType: 'application/json',
  },
  {
    uri: 'rastar://menu/selection-stats?accessToken={token}&userId={userId}',
    name: 'Selection statistics',
    description: 'Get comprehensive statistics about food selections (requires ?accessToken=TOKEN&userId=USER_ID)',
    mimeType: 'application/json',
  },
  {
    uri: 'rastar://menu/unselected-days?accessToken={token}&userId={userId}',
    name: 'Unselected days',
    description: 'Get list of dates that need food selection (requires ?accessToken=TOKEN&userId=USER_ID)',
    mimeType: 'application/json',
  },
] as const;
