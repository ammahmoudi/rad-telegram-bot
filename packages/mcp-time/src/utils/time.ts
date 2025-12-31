/**
 * Time utilities with Persian calendar support
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import moment from 'moment-jalaali';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Time format options
 */
export type TimeFormat = 'iso' | 'unix' | 'jalali' | 'formatted' | 'full';

/**
 * Time result with multiple formats
 */
export interface TimeResult {
  iso: string;
  unix: number;
  gregorian: {
    year: number;
    month: number;
    day: number;
    formatted: string;
  };
  jalali: {
    year: number;
    month: number;
    day: number;
    formatted: string;
    formatted_persian: string;
  };
  time: {
    hour: number;
    minute: number;
    second: number;
    formatted: string;
  };
  timezone: string;
}

// Configure moment-jalaali to use Persian locale
moment.loadPersian({ dialect: 'persian-modern' });

/**
 * Get current time in multiple formats
 */
export function getCurrentTime(timezone: string = 'Asia/Tehran'): TimeResult {
  const now = dayjs().tz(timezone);
  
  // Gregorian
  const year = now.year();
  const month = now.month() + 1;
  const day = now.date();
  
  // Convert to Jalali using moment-jalaali
  const jalaliMoment = moment(now.format('YYYY-MM-DD'));
  const jalaliYear = jalaliMoment.jYear();
  const jalaliMonth = jalaliMoment.jMonth() + 1;
  const jalaliDay = jalaliMoment.jDate();
  
  // Use Persian locale for formatting
  const jalaliMomentFa = moment(now.format('YYYY-MM-DD')).locale('fa');
  
  // Time
  const hour = now.hour();
  const minute = now.minute();
  const second = now.second();
  
  return {
    iso: now.toISOString(),
    unix: now.unix(),
    gregorian: {
      year,
      month,
      day,
      formatted: now.format('YYYY-MM-DD'),
    },
    jalali: {
      year: jalaliYear,
      month: jalaliMonth,
      day: jalaliDay,
      formatted: `${jalaliYear}-${String(jalaliMonth).padStart(2, '0')}-${String(jalaliDay).padStart(2, '0')}`,
      formatted_persian: jalaliMomentFa.format('jYYYY/jMM/jDD - jMMMM'),
    },
    time: {
      hour,
      minute,
      second,
      formatted: now.format('HH:mm:ss'),
    },
    timezone,
  };
}

/**
 * Calculate relative date
 */
export function calculateRelativeDate(
  expression: string,
  timezone: string = 'Asia/Tehran'
): TimeResult {
  const lower = expression.toLowerCase().trim();
  let date = dayjs().tz(timezone);
  
  // Handle common expressions
  if (lower === 'now' || lower === 'today') {
    date = date.startOf('day');
  } else if (lower === 'yesterday') {
    date = date.subtract(1, 'day').startOf('day');
  } else if (lower === 'tomorrow') {
    date = date.add(1, 'day').startOf('day');
  } else if (lower.match(/^(\d+) days? ago$/)) {
    const days = parseInt(lower.match(/^(\d+)/)?.[1] || '0');
    date = date.subtract(days, 'day').startOf('day');
  } else if (lower.match(/^(\d+) weeks? ago$/)) {
    const weeks = parseInt(lower.match(/^(\d+)/)?.[1] || '0');
    date = date.subtract(weeks, 'week').startOf('day');
  } else if (lower.match(/^(\d+) months? ago$/)) {
    const months = parseInt(lower.match(/^(\d+)/)?.[1] || '0');
    date = date.subtract(months, 'month').startOf('day');
  } else if (lower === 'this week' || lower === 'start of week') {
    date = date.startOf('week');
  } else if (lower === 'last week') {
    date = date.subtract(1, 'week').startOf('week');
  } else if (lower === 'this month' || lower === 'start of month') {
    date = date.startOf('month');
  } else if (lower === 'last month') {
    date = date.subtract(1, 'month').startOf('month');
  } else if (lower === 'this year' || lower === 'start of year') {
    date = date.startOf('year');
  } else if (lower === 'last year') {
    date = date.subtract(1, 'year').startOf('year');
  }
  
  return getCurrentTimeFromDayjs(date, timezone);
}

/**
 * Add duration to a time
 */
export function addDuration(
  baseTime: string,
  duration: string,
  timezone: string = 'Asia/Tehran'
): TimeResult {
  let date = baseTime === 'now' ? dayjs().tz(timezone) : dayjs(baseTime).tz(timezone);
  
  // Parse duration: e.g., "2h", "3d", "-1w", "30m"
  const match = duration.match(/^(-?\d+)([smhdwMy])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}. Use format like: 2h, 3d, -1w, 30m`);
  }
  
  const amount = parseInt(match[1]);
  const unit = match[2];
  
  const unitMap: Record<string, dayjs.ManipulateType> = {
    s: 'second',
    m: 'minute',
    h: 'hour',
    d: 'day',
    w: 'week',
    M: 'month',
    y: 'year',
  };
  
  date = date.add(amount, unitMap[unit]);
  
  return getCurrentTimeFromDayjs(date, timezone);
}

/**
 * Get time range for expressions like "this week", "last month"
 */
export function getTimeRange(
  range: string,
  timezone: string = 'Asia/Tehran'
): { start: TimeResult; end: TimeResult } {
  const lower = range.toLowerCase().trim();
  let start = dayjs().tz(timezone);
  let end = dayjs().tz(timezone);
  
  if (lower === 'today') {
    start = start.startOf('day');
    end = end.endOf('day');
  } else if (lower === 'yesterday') {
    start = start.subtract(1, 'day').startOf('day');
    end = start.endOf('day');
  } else if (lower === 'this week') {
    start = start.startOf('week');
    end = end.endOf('week');
  } else if (lower === 'last week') {
    start = start.subtract(1, 'week').startOf('week');
    end = start.endOf('week');
  } else if (lower === 'this month') {
    start = start.startOf('month');
    end = end.endOf('month');
  } else if (lower === 'last month') {
    start = start.subtract(1, 'month').startOf('month');
    end = start.endOf('month');
  } else if (lower === 'this year') {
    start = start.startOf('year');
    end = end.endOf('year');
  } else if (lower === 'last year') {
    start = start.subtract(1, 'year').startOf('year');
    end = start.endOf('year');
  } else if (lower.match(/^last (\d+) days?$/)) {
    const days = parseInt(lower.match(/^last (\d+)/)?.[1] || '0');
    start = start.subtract(days, 'day').startOf('day');
    end = end.endOf('day');
  }
  
  return {
    start: getCurrentTimeFromDayjs(start, timezone),
    end: getCurrentTimeFromDayjs(end, timezone),
  };
}

/**
 * Helper: Convert dayjs object to TimeResult
 */
function getCurrentTimeFromDayjs(date: dayjs.Dayjs, timezone: string): TimeResult {
  // Gregorian
  const year = date.year();
  const month = date.month() + 1;
  const day = date.date();
  
  // Convert to Jalali using moment-jalaali
  const jalaliMoment = moment(date.format('YYYY-MM-DD'));
  const jalaliYear = jalaliMoment.jYear();
  const jalaliMonth = jalaliMoment.jMonth() + 1;
  const jalaliDay = jalaliMoment.jDate();
  
  // Use Persian locale for formatting
  const jalaliMomentFa = moment(date.format('YYYY-MM-DD')).locale('fa');
  
  // Time
  const hour = date.hour();
  const minute = date.minute();
  const second = date.second();
  
  return {
    iso: date.toISOString(),
    unix: date.unix(),
    gregorian: {
      year,
      month,
      day,
      formatted: date.format('YYYY-MM-DD'),
    },
    jalali: {
      year: jalaliYear,
      month: jalaliMonth,
      day: jalaliDay,
      formatted: `${jalaliYear}-${String(jalaliMonth).padStart(2, '0')}-${String(jalaliDay).padStart(2, '0')}`,
      formatted_persian: jalaliMomentFa.format('jYYYY/jMM/jDD - jMMMM'),
    },
    time: {
      hour,
      minute,
      second,
      formatted: date.format('HH:mm:ss'),
    },
    timezone,
  };
}

/**
 * Format TimeResult based on requested format
 */
export function formatTimeResult(result: TimeResult, format: TimeFormat = 'iso'): string {
  switch (format) {
    case 'iso':
      return result.iso;
    case 'unix':
      return String(result.unix);
    case 'jalali':
      return result.jalali.formatted_persian;
    case 'formatted':
      return `${result.gregorian.formatted} ${result.time.formatted} (${result.timezone})`;
    case 'full':
      return JSON.stringify(result, null, 2);
    default:
      return result.iso;
  }
}
