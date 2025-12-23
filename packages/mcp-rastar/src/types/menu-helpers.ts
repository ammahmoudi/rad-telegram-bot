import type { MenuSchedule, UserMenuSelection } from './index.js';

/**
 * Date range filter for menu queries
 */
export type DateRangeFilter = 
  | 'today'
  | 'tomorrow'
  | 'this-week'
  | 'next-week'
  | 'this-month'
  | 'next-month'
  | 'past'
  | 'future'
  | 'all';

/**
 * Custom date range
 */
export interface CustomDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Menu options grouped by date
 */
export interface DailyMenuOptions {
  date: string; // YYYY-MM-DD
  foodOptions: MenuSchedule[];
  selectedFood?: UserMenuSelection;
  hasSelection: boolean;
}

/**
 * Combined menu view with user selections
 */
export interface MenuWithSelections {
  dailyMenus: DailyMenuOptions[];
  totalDays: number;
  daysWithSelection: number;
  daysWithoutSelection: number;
}

/**
 * Options for changing a food selection
 */
export interface ChangeSelectionOptions {
  date?: string; // Optional: if you want to change by date
  oldSelectionId?: string; // Optional: if you have the selection ID
  newMenuScheduleId: string; // Required: what you want to change to
}

/**
 * Result of a change operation
 */
export interface ChangeSelectionResult {
  deleted: {
    id: string;
    menu_schedule_id: string;
  };
  created: UserMenuSelection;
}

/**
 * Statistics about user's menu selections
 */
export interface MenuSelectionStats {
  totalDaysAvailable: number;
  totalDaysSelected: number;
  totalDaysUnselected: number;
  selectionRate: number; // percentage
  upcomingUnselectedDays: number;
  pastUnselectedDays: number;
}
