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
 * Get the start and end of current week (Saturday to Friday - Iranian calendar)
 * In Iran: Week starts Saturday, weekend is Thursday-Friday
 */
export function getThisWeek(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  
  // Calculate days since Saturday
  // Saturday=6, Sunday=0, Monday=1, ..., Friday=5
  const daysSinceSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1);
  
  const saturday = new Date(now);
  saturday.setDate(now.getDate() - daysSinceSaturday);
  
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  
  return {
    start: saturday.toISOString().split('T')[0],
    end: friday.toISOString().split('T')[0],
  };
}

/**
 * Get the start and end of next week (Saturday to Friday - Iranian calendar)
 */
export function getNextWeek(): { start: string; end: string } {
  const thisWeek = getThisWeek();
  const nextSaturday = new Date(thisWeek.start);
  nextSaturday.setDate(nextSaturday.getDate() + 7);
  
  const nextFriday = new Date(nextSaturday);
  nextFriday.setDate(nextSaturday.getDate() + 6);
  
  return {
    start: nextSaturday.toISOString().split('T')[0],
    end: nextFriday.toISOString().split('T')[0],
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
