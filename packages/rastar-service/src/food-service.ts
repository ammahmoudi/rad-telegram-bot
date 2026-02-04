/**
 * Rastar Food Service
 * High-level service for food-related operations
 * Used by scheduled jobs to check food selections and send reminders
 */

import { getPrisma, decryptString } from '@rad/shared';
import {
  getMenuSchedule,
  getUserMenuSelections,
  type RastarAuth,
  type MenuScheduleItem,
  type UserMenuSelection,
} from './api-client.js';
import type { UserFoodStatus, DailyFoodOption } from './types.js';

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Get date N days from now
 */
function getDateFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Check if a date is in the future (including today)
 */
function isFutureOrToday(dateStr: string): boolean {
  const today = getToday();
  return dateStr >= today;
}

/**
 * Get all users with linked Rastar accounts
 */
export async function getAllLinkedUsers(): Promise<Array<{
  telegramUserId: string;
  userId: string;
  email: string;
  accessToken: string;
}>> {
  const tokens = await getPrisma().rastarToken.findMany();
  
  return tokens.map((token: {
    telegramUserId: string;
    userId: string;
    email: string;
    accessTokenEnc: string;
  }) => ({
    telegramUserId: token.telegramUserId,
    userId: token.userId,
    email: token.email,
    accessToken: decryptString(token.accessTokenEnc),
  }));
}

/**
 * Get a user's food selection status
 */
export async function getUserFoodStatus(
  telegramUserId: string,
  options?: { daysAhead?: number }
): Promise<UserFoodStatus | null> {
  const daysAhead = options?.daysAhead ?? 7;
  
  // Get user's Rastar token
  const tokenRecord = await getPrisma().rastarToken.findUnique({
    where: { telegramUserId },
  });
  
  if (!tokenRecord) {
    return null;
  }

  const accessToken = decryptString(tokenRecord.accessTokenEnc);
  const auth: RastarAuth = { accessToken };

  // Fetch menu and selections
  const [schedule, selections] = await Promise.all([
    getMenuSchedule(auth),
    getUserMenuSelections(auth, tokenRecord.userId),
  ]);

  // Filter to future dates only
  const today = getToday();
  const endDate = getDateFromNow(daysAhead);
  const futureSchedule = schedule.filter(
    s => s.date >= today && s.date <= endDate
  );

  // Build selection lookup
  const selectionsByDate = new Map<string, UserMenuSelection>();
  for (const sel of selections) {
    if (sel.menu_schedule?.date) {
      selectionsByDate.set(sel.menu_schedule.date, sel);
    }
  }

  // Group menu items by date
  const menuByDate = new Map<string, MenuScheduleItem[]>();
  for (const item of futureSchedule) {
    const items = menuByDate.get(item.date) ?? [];
    items.push(item);
    menuByDate.set(item.date, items);
  }

  // Find unselected days
  const unselectedDays: DailyFoodOption[] = [];
  for (const [date, items] of menuByDate.entries()) {
    const selection = selectionsByDate.get(date);
    if (!selection) {
      // No selection for this date - add all options
      for (const item of items) {
        unselectedDays.push({
          scheduleId: item.id,
          date: item.date,
          food: {
            id: item.menu_item.id,
            name: item.menu_item.name,
            description: item.menu_item.description,
          },
          isSelected: false,
        });
      }
    }
  }

  // Calculate stats
  const uniqueDates = new Set([...menuByDate.keys()]);
  const selectedDates = new Set([...selectionsByDate.keys()].filter(d => isFutureOrToday(d) && d <= endDate));
  const upcomingUnselectedCount = uniqueDates.size - selectedDates.size;

  return {
    userId: tokenRecord.userId,
    telegramUserId,
    email: tokenRecord.email,
    unselectedDays,
    upcomingUnselectedCount,
    totalAvailableDays: uniqueDates.size,
    selectionRate: uniqueDates.size > 0 
      ? (selectedDates.size / uniqueDates.size) * 100 
      : 0,
  };
}

/**
 * Get all users with unselected food for tomorrow
 */
export async function getUsersWithUnselectedTomorrow(): Promise<UserFoodStatus[]> {
  const users = await getAllLinkedUsers();
  const tomorrow = getTomorrow();
  const result: UserFoodStatus[] = [];

  for (const user of users) {
    try {
      const auth: RastarAuth = { accessToken: user.accessToken };
      
      const [schedule, selections] = await Promise.all([
        getMenuSchedule(auth),
        getUserMenuSelections(auth, user.userId),
      ]);

      // Check if tomorrow has menu options
      const tomorrowMenu = schedule.filter(s => s.date === tomorrow);
      if (tomorrowMenu.length === 0) {
        continue; // No menu for tomorrow
      }

      // Check if user has selected for tomorrow
      const hasSelection = selections.some(
        s => s.menu_schedule?.date === tomorrow
      );

      if (!hasSelection) {
        // User hasn't selected for tomorrow
        const unselectedDays: DailyFoodOption[] = tomorrowMenu.map(item => ({
          scheduleId: item.id,
          date: item.date,
          food: {
            id: item.menu_item.id,
            name: item.menu_item.name,
            description: item.menu_item.description,
          },
          isSelected: false,
        }));

        result.push({
          userId: user.userId,
          telegramUserId: user.telegramUserId,
          email: user.email,
          unselectedDays,
          upcomingUnselectedCount: 1,
          totalAvailableDays: 1,
          selectionRate: 0,
        });
      }
    } catch (error) {
      console.error(`[food-service] Error checking user ${user.telegramUserId}:`, error);
      // Continue with other users
    }
  }

  return result;
}

/**
 * Get users with unselected food for the next N days
 */
export async function getUsersWithUnselectedDays(
  daysAhead: number = 3
): Promise<UserFoodStatus[]> {
  const users = await getAllLinkedUsers();
  const result: UserFoodStatus[] = [];

  for (const user of users) {
    try {
      const status = await getUserFoodStatus(user.telegramUserId, { daysAhead });
      if (status && status.upcomingUnselectedCount > 0) {
        result.push(status);
      }
    } catch (error) {
      console.error(`[food-service] Error checking user ${user.telegramUserId}:`, error);
    }
  }

  return result;
}

/**
 * Format food options for display
 */
export function formatFoodOptions(options: DailyFoodOption[]): string {
  const byDate = new Map<string, DailyFoodOption[]>();
  
  for (const opt of options) {
    const dateOpts = byDate.get(opt.date) ?? [];
    dateOpts.push(opt);
    byDate.set(opt.date, dateOpts);
  }

  const lines: string[] = [];
  for (const [date, opts] of byDate.entries()) {
    const foodNames = opts.map(o => o.food.name).join(' | ');
    lines.push(`📅 ${date}: ${foodNames}`);
  }

  return lines.join('\n');
}
