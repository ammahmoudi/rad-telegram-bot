import type { ReadResourceRequest } from '@modelcontextprotocol/sdk/types.js';
import * as helpers from '../api/menu-helpers.js';
import type { DateRangeFilter } from '../types/menu-helpers.js';

/**
 * Handle resource read requests
 * Resources provide read-only data using helper functions
 */
export async function handleReadResource(request: ReadResourceRequest) {
  const uri = request.params.uri;

  // Parse URI and extract query parameters
  const match = uri.match(/^rastar:\/\/([^?]+)(?:\?(.+))?$/);
  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const [, path, queryString] = match;
  const params = new URLSearchParams(queryString || '');
  const accessToken = params.get('accessToken');
  const userId = params.get('userId');
  const filterParam = params.get('filter');

  if (!accessToken || !userId) {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Authentication required',
            usage: 'Add ?accessToken=TOKEN&userId=USER_ID to the URI',
            example: 'rastar://menu/today?accessToken=YOUR_TOKEN&userId=USER_ID',
          }),
        },
      ],
    };
  }

  const auth = { accessToken };
  const filter: DateRangeFilter | undefined = filterParam ? JSON.parse(filterParam) : undefined;

  let result: any;

  switch (path) {
    case 'menu/with-selections':
      result = await helpers.getMenuWithSelections(auth, userId, filter);
      break;

    case 'menu/today':
      result = await helpers.getTodayMenu(auth, userId);
      break;

    case 'menu/tomorrow':
      result = await helpers.getTomorrowMenu(auth, userId);
      break;

    case 'menu/this-week':
      result = await helpers.getThisWeekMenu(auth, userId);
      break;

    case 'menu/next-week':
      result = await helpers.getNextWeekMenu(auth, userId);
      break;

    case 'menu/selection-stats':
      result = await helpers.getSelectionStats(auth, userId);
      break;

    case 'menu/unselected-days':
      result = await helpers.getUnselectedDays(auth, userId, filter);
      break;

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
