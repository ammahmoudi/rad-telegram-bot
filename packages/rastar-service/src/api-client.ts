/**
 * Rastar API Client
 * Low-level API calls to Rastar Supabase backend
 * Reuses logic from mcp-rastar but standalone for scheduler use
 */

export interface RastarApiConfig {
  baseUrl: string;
  apiKey: string;
}

export interface RastarAuth {
  accessToken: string;
}

export interface MenuScheduleItem {
  id: string;
  date: string;
  menu_item: {
    id: string;
    name: string;
    description?: string;
  };
  created_at: string;
}

export interface UserMenuSelection {
  id: string;
  user_id: string;
  menu_schedule_id: string;
  created_at: string;
  menu_schedule?: MenuScheduleItem;
}

function getConfig(): RastarApiConfig {
  const baseUrl = process.env.RASTAR_SUPABASE_URL;
  const apiKey = process.env.RASTAR_SUPABASE_ANON_KEY;
  
  if (!baseUrl || !apiKey) {
    throw new Error('RASTAR_SUPABASE_URL and RASTAR_SUPABASE_ANON_KEY are required');
  }
  
  return { baseUrl, apiKey };
}

/**
 * Make authenticated API request to Rastar
 */
async function apiRequest<T>(
  endpoint: string,
  auth: RastarAuth,
  options: RequestInit = {}
): Promise<T> {
  const config = getConfig();
  
  const url = `${config.baseUrl}/rest/v1/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.apiKey,
      'Authorization': `Bearer ${auth.accessToken}`,
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Rastar API error: ${response.status} - ${error}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Get all menu schedules
 */
export async function getMenuSchedule(auth: RastarAuth): Promise<MenuScheduleItem[]> {
  return apiRequest<MenuScheduleItem[]>(
    'menu_schedule?select=*,menu_item:menu_items(*)',
    auth
  );
}

/**
 * Get user's menu selections
 */
export async function getUserMenuSelections(
  auth: RastarAuth,
  userId: string
): Promise<UserMenuSelection[]> {
  return apiRequest<UserMenuSelection[]>(
    `menu_selections?user_id=eq.${userId}&select=*,menu_schedule:menu_schedule(*)`,
    auth
  );
}

/**
 * Create a menu selection
 */
export async function createMenuSelection(
  auth: RastarAuth,
  userId: string,
  menuScheduleId: string
): Promise<UserMenuSelection> {
  const result = await apiRequest<UserMenuSelection[]>(
    'menu_selections',
    auth,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        menu_schedule_id: menuScheduleId,
      }),
    }
  );
  return result[0];
}

/**
 * Delete a menu selection
 */
export async function deleteMenuSelection(
  auth: RastarAuth,
  selectionId: string
): Promise<void> {
  await apiRequest<void>(
    `menu_selections?id=eq.${selectionId}`,
    auth,
    { method: 'DELETE' }
  );
}
