import { rastarFetch } from './client.js';
import type { RastarAuth, MenuSchedule, UserMenuSelection } from '../types/index.js';

/**
 * Get the food menu schedule
 */
export async function getMenuSchedule(auth: RastarAuth): Promise<MenuSchedule[]> {
  return rastarFetch<MenuSchedule[]>('/rest/v1/menu_schedule', auth, {
    method: 'GET',
    params: {
      select: '*,menu_item:menu_items(id,name,description)',
      order: 'date.asc',
    },
  });
}

/**
 * Get user's menu selections
 */
export async function getUserMenuSelections(
  auth: RastarAuth,
  userId: string
): Promise<UserMenuSelection[]> {
  return rastarFetch<UserMenuSelection[]>('/rest/v1/user_menu_selections', auth, {
    method: 'GET',
    params: {
      select: 'id,user_id,menu_schedule_id,created_at,menu_schedule:menu_schedule(id,date,menu_item:menu_items(id,name,description))',
      user_id: `eq.${userId}`,
      order: 'created_at.asc',
    },
  });
}

/**
 * Create a menu selection
 */
export async function createMenuSelection(
  auth: RastarAuth,
  userId: string,
  menuScheduleId: string
): Promise<UserMenuSelection> {
  const result = await rastarFetch<UserMenuSelection[]>('/rest/v1/user_menu_selections', auth, {
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      menu_schedule_id: menuScheduleId,
    }),
  });
  
  // Supabase returns an array when using return=representation
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Delete a menu selection by ID
 */
export async function deleteMenuSelection(auth: RastarAuth, selectionId: string): Promise<void> {
  return rastarFetch<void>('/rest/v1/user_menu_selections', auth, {
    method: 'DELETE',
    params: {
      id: `eq.${selectionId}`,
    },
  });
}
