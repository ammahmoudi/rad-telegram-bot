/**
 * High-Level Menu API
 * User-friendly functions built on top of raw API calls
 */

import type { RastarAuth, MenuSchedule, UserMenuSelection } from '../types/index.js';
import type {
  DateRangeFilter,
  CustomDateRange,
  DailyMenuOptions,
  MenuWithSelections,
  ChangeSelectionOptions,
  ChangeSelectionResult,
  MenuSelectionStats,
} from '../types/menu-helpers.js';
import {
  getMenuSchedule,
  getUserMenuSelections,
  createMenuSelection,
  deleteMenuSelection,
} from './menu.js';
import {
  getToday,
  getTomorrow,
  getThisWeek,
  getNextWeek,
  getThisMonth,
  getNextMonth,
  isPast,
  isFuture,
  isInRange,
} from '../utils/date-helpers.js';

// ==================== HELPER FUNCTIONS ====================

/**
 * Filter menu items by date range
 */
function filterByDateRange(
  items: MenuSchedule[],
  filter: DateRangeFilter | CustomDateRange
): MenuSchedule[] {
  if (typeof filter === 'object' && 'startDate' in filter) {
    return items.filter(item => isInRange(item.date, filter.startDate, filter.endDate));
  }

  const today = getToday();

  switch (filter) {
    case 'today':
      return items.filter(item => item.date === today);
    case 'tomorrow':
      return items.filter(item => item.date === getTomorrow());
    case 'this-week': {
      const week = getThisWeek();
      return items.filter(item => isInRange(item.date, week.start, week.end));
    }
    case 'next-week': {
      const week = getNextWeek();
      return items.filter(item => isInRange(item.date, week.start, week.end));
    }
    case 'this-month': {
      const month = getThisMonth();
      return items.filter(item => isInRange(item.date, month.start, month.end));
    }
    case 'next-month': {
      const month = getNextMonth();
      return items.filter(item => isInRange(item.date, month.start, month.end));
    }
    case 'past':
      return items.filter(item => isPast(item.date));
    case 'future':
      return items.filter(item => isFuture(item.date));
    case 'all':
    default:
      return items;
  }
}

/**
 * Group menu schedules by date
 */
function groupMenuByDate(schedules: MenuSchedule[]): Map<string, MenuSchedule[]> {
  const grouped = new Map<string, MenuSchedule[]>();
  
  for (const schedule of schedules) {
    const existing = grouped.get(schedule.date) || [];
    existing.push(schedule);
    grouped.set(schedule.date, existing);
  }
  
  return grouped;
}

/**
 * Create daily menu options with selection info
 */
function createDailyMenuOptions(
  groupedSchedules: Map<string, MenuSchedule[]>,
  selections: UserMenuSelection[]
): DailyMenuOptions[] {
  const dailyMenus: DailyMenuOptions[] = [];
  
  for (const [date, foodOptions] of groupedSchedules.entries()) {
    const selectedFood = selections.find(s => s.menu_schedule?.date === date);
    
    dailyMenus.push({
      date,
      foodOptions: foodOptions.sort((a, b) => a.menu_item.name.localeCompare(b.menu_item.name)),
      selectedFood,
      hasSelection: !!selectedFood,
    });
  }
  
  return dailyMenus.sort((a, b) => a.date.localeCompare(b.date));
}

// ==================== PUBLIC API ====================

/**
 * Get menu with selections combined
 * Shows all available foods for each day and what you've selected
 */
export async function getMenuWithSelections(
  auth: RastarAuth,
  userId: string,
  dateFilter: DateRangeFilter | CustomDateRange = 'all'
): Promise<MenuWithSelections> {
  // Fetch both in parallel
  const [allSchedule, userSelections] = await Promise.all([
    getMenuSchedule(auth),
    getUserMenuSelections(auth, userId),
  ]);

  // Filter by date range
  const filteredSchedule = filterByDateRange(allSchedule, dateFilter);

  // Group by date
  const groupedSchedules = groupMenuByDate(filteredSchedule);

  // Create daily menu options
  const dailyMenus = createDailyMenuOptions(groupedSchedules, userSelections);

  // Calculate stats
  const daysWithSelection = dailyMenus.filter(d => d.hasSelection).length;
  const daysWithoutSelection = dailyMenus.length - daysWithSelection;

  return {
    dailyMenus,
    totalDays: dailyMenus.length,
    daysWithSelection,
    daysWithoutSelection,
  };
}

/**
 * Change a food selection
 * Automatically deletes old selection and creates new one
 */
export async function changeSelection(
  auth: RastarAuth,
  userId: string,
  options: ChangeSelectionOptions
): Promise<ChangeSelectionResult> {
  let oldSelection: UserMenuSelection | undefined;

  // Find the old selection
  if (options.oldSelectionId) {
    // Use provided selection ID
    const userSelections = await getUserMenuSelections(auth, userId);
    oldSelection = userSelections.find(s => s.id === options.oldSelectionId);
  } else if (options.date) {
    // Find selection by date
    const userSelections = await getUserMenuSelections(auth, userId);
    oldSelection = userSelections.find(s => s.menu_schedule?.date === options.date);
  } else {
    throw new Error('Must provide either oldSelectionId or date');
  }

  if (!oldSelection) {
    throw new Error('No existing selection found to change');
  }

  // Delete old and create new
  await deleteMenuSelection(auth, oldSelection.id);
  const newSelection = await createMenuSelection(auth, userId, options.newMenuScheduleId);

  return {
    deleted: {
      id: oldSelection.id,
      menu_schedule_id: oldSelection.menu_schedule_id,
    },
    created: newSelection,
  };
}

/**
 * Select food for a specific date
 * Finds the menu schedule ID for the date and food, then creates selection
 */
export async function selectFoodByDate(
  auth: RastarAuth,
  userId: string,
  date: string,
  foodName: string
): Promise<UserMenuSelection> {
  const schedule = await getMenuSchedule(auth);
  
  const menuItem = schedule.find(
    s => s.date === date && s.menu_item.name.toLowerCase().includes(foodName.toLowerCase())
  );

  if (!menuItem) {
    throw new Error(`No food matching "${foodName}" found for date ${date}`);
  }

  return createMenuSelection(auth, userId, menuItem.id);
}

/**
 * Remove selection for a specific date
 */
export async function removeSelectionByDate(
  auth: RastarAuth,
  userId: string,
  date: string
): Promise<void> {
  const userSelections = await getUserMenuSelections(auth, userId);
  const selection = userSelections.find(s => s.menu_schedule?.date === date);

  if (!selection) {
    throw new Error(`No selection found for date ${date}`);
  }

  await deleteMenuSelection(auth, selection.id);
}

/**
 * Get statistics about menu selections
 */
export async function getSelectionStats(
  auth: RastarAuth,
  userId: string
): Promise<MenuSelectionStats> {
  const [schedule, selections] = await Promise.all([
    getMenuSchedule(auth),
    getUserMenuSelections(auth, userId),
  ]);

  const today = getToday();
  const uniqueDates = new Set(schedule.map(s => s.date));
  const totalDaysAvailable = uniqueDates.size;
  const totalDaysSelected = selections.length;
  const totalDaysUnselected = totalDaysAvailable - totalDaysSelected;

  // Calculate upcoming and past unselected days
  const selectedDates = new Set(selections.map(s => s.menu_schedule?.date).filter(Boolean));
  const unselectedDates = Array.from(uniqueDates).filter(date => !selectedDates.has(date));
  
  const upcomingUnselectedDays = unselectedDates.filter(date => date && (date >= today)).length;
  const pastUnselectedDays = unselectedDates.filter(date => date && (date < today)).length;

  return {
    totalDaysAvailable,
    totalDaysSelected,
    totalDaysUnselected,
    selectionRate: totalDaysAvailable > 0 ? (totalDaysSelected / totalDaysAvailable) * 100 : 0,
    upcomingUnselectedDays,
    pastUnselectedDays,
  };
}

/**
 * Get days where you haven't selected food yet
 */
export async function getUnselectedDays(
  auth: RastarAuth,
  userId: string,
  dateFilter: DateRangeFilter | CustomDateRange = 'future'
): Promise<DailyMenuOptions[]> {
  const menuWithSelections = await getMenuWithSelections(auth, userId, dateFilter);
  return menuWithSelections.dailyMenus.filter(day => !day.hasSelection);
}

/**
 * Bulk select foods for multiple days
 * Useful for selecting all meals for a week at once
 */
export async function bulkSelectFoods(
  auth: RastarAuth,
  userId: string,
  selections: Array<{ date: string; foodName: string }>
): Promise<{ 
  successful: UserMenuSelection[]; 
  failed: Array<{ date: string; foodName: string; error: string }> 
}> {
  const successful: UserMenuSelection[] = [];
  const failed: Array<{ date: string; foodName: string; error: string }> = [];

  for (const selection of selections) {
    try {
      const result = await selectFoodByDate(auth, userId, selection.date, selection.foodName);
      successful.push(result);
    } catch (error: any) {
      failed.push({
        date: selection.date,
        foodName: selection.foodName,
        error: error.message,
      });
    }
  }

  return { successful, failed };
}

/**
 * Get menu for today only
 */
export async function getTodayMenu(
  auth: RastarAuth,
  userId: string
): Promise<DailyMenuOptions | null> {
  const menu = await getMenuWithSelections(auth, userId, 'today');
  return menu.dailyMenus[0] || null;
}

/**
 * Get menu for tomorrow only
 */
export async function getTomorrowMenu(
  auth: RastarAuth,
  userId: string
): Promise<DailyMenuOptions | null> {
  const menu = await getMenuWithSelections(auth, userId, 'tomorrow');
  return menu.dailyMenus[0] || null;
}

/**
 * Get this week's menu
 */
export async function getThisWeekMenu(
  auth: RastarAuth,
  userId: string
): Promise<MenuWithSelections> {
  return getMenuWithSelections(auth, userId, 'this-week');
}

/**
 * Get next week's menu
 */
export async function getNextWeekMenu(
  auth: RastarAuth,
  userId: string
): Promise<MenuWithSelections> {
  return getMenuWithSelections(auth, userId, 'next-week');
}
