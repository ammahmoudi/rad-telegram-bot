/**
 * Date utility functions for menu operations
 */

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Get the start and end of current week (Monday to Sunday)
 */
export function getThisWeek(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

/**
 * Get the start and end of next week
 */
export function getNextWeek(): { start: string; end: string } {
  const thisWeek = getThisWeek();
  const nextMonday = new Date(thisWeek.start);
  nextMonday.setDate(nextMonday.getDate() + 7);
  
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  
  return {
    start: nextMonday.toISOString().split('T')[0],
    end: nextSunday.toISOString().split('T')[0],
  };
}

/**
 * Get the start and end of current month
 */
export function getThisMonth(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Get the start and end of next month
 */
export function getNextMonth(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Check if a date is in the past (before today)
 */
export function isPast(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date(getToday());
  return date < today;
}

/**
 * Check if a date is in the future (after today)
 */
export function isFuture(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date(getToday());
  return date > today;
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getToday();
}

/**
 * Check if a date is within a range (inclusive)
 */
export function isInRange(dateStr: string, startDate: string, endDate: string): boolean {
  const date = new Date(dateStr);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return date >= start && date <= end;
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Get relative date description (Today, Tomorrow, etc.)
 */
export function getRelativeDate(dateStr: string): string {
  if (isToday(dateStr)) return 'Today';
  if (dateStr === getTomorrow()) return 'Tomorrow';
  
  const date = new Date(dateStr);
  const today = new Date(getToday());
  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  
  return formatDate(dateStr);
}
