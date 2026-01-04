/**
 * Date/Time Utilities with Persian Calendar Support
 * 
 * Handles:
 * - Timezone conversion (UTC ↔ Tehran)
 * - Persian (Jalali) ↔ Gregorian calendar conversion
 * - Natural language date parsing
 * - Dual calendar output format
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import moment from 'moment-jalaali';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/**
 * Default timezone configuration
 */
export const DEFAULT_TIMEZONE = 'Asia/Tehran';

/**
 * Dual calendar date representation
 */
export interface DualDate {
  /** ISO 8601 format (UTC) - for API usage */
  iso: string;
  
  /** Unix timestamp (milliseconds) */
  timestamp: number;
  
  /** Gregorian calendar representation */
  gregorian: {
    date: string;        // YYYY-MM-DD
    dateTime: string;    // YYYY-MM-DD HH:mm:ss
    time: string;        // HH:mm:ss
    timezone: string;    // e.g., "Asia/Tehran"
    formatted: string;   // e.g., "December 30, 2025 14:30"
  };
  
  /** Persian (Jalali) calendar representation */
  persian: {
    date: string;        // YYYY-MM-DD (Persian)
    dateTime: string;    // YYYY-MM-DD HH:mm:ss (Persian)
    time: string;        // HH:mm:ss
    formatted: string;   // e.g., "۱۴۰۴/۱۰/۱۰ ساعت ۱۴:۳۰"
    year: number;
    month: number;
    day: number;
  };
}

// Configure moment-jalaali to use Persian locale
moment.loadPersian({ dialect: 'persian-modern' });

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

const toPersianDigits = (value: string): string => value.replace(/\d/g, digit => PERSIAN_DIGITS[Number(digit)]);

/**
 * Parse various date/time formats and return DualDate
 * 
 * Supported formats:
 * - ISO 8601: "2025-12-30T10:30:00Z"
 * - Date only: "2025-12-30"
 * - Persian date: "1404/10/10" or "1404-10-10"
 * - Natural language: "today", "tomorrow", "yesterday"
 * - Relative: "in 3 days", "2 hours ago"
 * 
 * @param input - Date string or Date object
 * @param timezone - Target timezone (default: Tehran)
 */
export function parseDate(
  input: string | Date | dayjs.Dayjs,
  timezone: string = DEFAULT_TIMEZONE
): DualDate {
  let date: dayjs.Dayjs;

  if (input instanceof Date) {
    date = dayjs(input).tz(timezone);
  } else if (dayjs.isDayjs(input)) {
    date = input.tz(timezone);
  } else {
    // Handle natural language
    const lower = input.toLowerCase().trim();
    
    if (lower === 'now' || lower === 'today') {
      date = dayjs().tz(timezone);
    } else if (lower === 'tomorrow') {
      date = dayjs().tz(timezone).add(1, 'day');
    } else if (lower === 'yesterday') {
      date = dayjs().tz(timezone).subtract(1, 'day');
    } else if (lower.match(/^in \d+ (day|hour|minute|week|month)s?$/)) {
      // "in 3 days", "in 2 hours"
      const matches = lower.match(/^in (\d+) (\w+?)s?$/);
      if (matches) {
        const amount = parseInt(matches[1]);
        const unit = matches[2] as dayjs.ManipulateType;
        date = dayjs().tz(timezone).add(amount, unit);
      } else {
        date = dayjs(input).tz(timezone);
      }
    } else if (lower.match(/^\d+ (day|hour|minute|week|month)s? ago$/)) {
      // "3 days ago", "2 hours ago"
      const matches = lower.match(/^(\d+) (\w+?)s? ago$/);
      if (matches) {
        const amount = parseInt(matches[1]);
        const unit = matches[2] as dayjs.ManipulateType;
        date = dayjs().tz(timezone).subtract(amount, unit);
      } else {
        date = dayjs(input).tz(timezone);
      }
    } else if (input.match(/^14\d{2}[\/-]\d{1,2}[\/-]\d{1,2}/)) {
      // Persian date format: "1404/10/10" or "1404-10-10"
      const jalaliMoment = moment(input, ['jYYYY/jMM/jDD', 'jYYYY-jMM-jDD', 'jYYYY/jM/jD']);
      if (jalaliMoment.isValid()) {
        date = dayjs(jalaliMoment.format('YYYY-MM-DD')).tz(timezone);
      } else {
        date = dayjs(input).tz(timezone);
      }
    } else {
      // Try to parse as standard date
      date = dayjs(input).tz(timezone);
    }
  }

  // If invalid, return current date
  if (!date.isValid()) {
    date = dayjs().tz(timezone);
  }

  return toDualDate(date, timezone);
}

/**
 * Convert dayjs object to DualDate
 */
function toDualDate(date: dayjs.Dayjs, timezone: string = DEFAULT_TIMEZONE): DualDate {
  const utcDate = date.utc();
  const localDate = date.tz(timezone);
  
  // Convert to Persian calendar using moment-jalaali
  const jalaliMoment = moment(localDate.format('YYYY-MM-DD'));
  const jalaliDate = jalaliMoment.format('jYYYY-jMM-jDD');
  const jalaliDateTime = `${jalaliDate} ${localDate.format('HH:mm:ss')}`;
  
  // Use Persian locale for formatting
  const jalaliMomentFa = moment(localDate.format('YYYY-MM-DD')).locale('fa');

  return {
    iso: utcDate.toISOString(),
    timestamp: date.valueOf(),
    gregorian: {
      date: localDate.format('YYYY-MM-DD'),
      dateTime: localDate.format('YYYY-MM-DD HH:mm:ss'),
      time: localDate.format('HH:mm:ss'),
      timezone,
      formatted: localDate.format('MMMM D, YYYY HH:mm'),
    },
    persian: {
      date: jalaliDate,
      dateTime: jalaliDateTime,
      time: localDate.format('HH:mm:ss'),
      formatted: toPersianDigits(
        jalaliMomentFa.format('jYYYY/jMM/jDD - jMMMM') + ' ساعت ' + localDate.format('HH:mm')
      ),
      year: jalaliMoment.jYear(),
      month: jalaliMoment.jMonth() + 1,
      day: jalaliMoment.jDate(),
    },
  };
}

/**
 * Convert UTC date to Tehran timezone and return DualDate
 */
export function fromUTC(utcDate: string | Date, timezone: string = DEFAULT_TIMEZONE): DualDate {
  const date = dayjs.utc(utcDate).tz(timezone);
  return toDualDate(date, timezone);
}

/**
 * Convert Tehran timezone date to UTC
 */
export function toUTC(localDate: string | Date, timezone: string = DEFAULT_TIMEZONE): string {
  return dayjs.tz(localDate, timezone).utc().toISOString();
}

/**
 * Get current date/time in dual format
 */
export function now(timezone: string = DEFAULT_TIMEZONE): DualDate {
  return toDualDate(dayjs().tz(timezone), timezone);
}

/**
 * Get today's date (start of day) in dual format
 */
export function today(timezone: string = DEFAULT_TIMEZONE): DualDate {
  return toDualDate(dayjs().tz(timezone).startOf('day'), timezone);
}

/**
 * Get yesterday's date in dual format
 */
export function yesterday(timezone: string = DEFAULT_TIMEZONE): DualDate {
  return toDualDate(dayjs().tz(timezone).subtract(1, 'day').startOf('day'), timezone);
}

/**
 * Get tomorrow's date in dual format
 */
export function tomorrow(timezone: string = DEFAULT_TIMEZONE): DualDate {
  return toDualDate(dayjs().tz(timezone).add(1, 'day').startOf('day'), timezone);
}

/**
 * Format a date range
 */
export function formatDateRange(
  start: string | Date,
  end: string | Date,
  timezone: string = DEFAULT_TIMEZONE
): {
  start: DualDate;
  end: DualDate;
  duration: {
    days: number;
    hours: number;
    minutes: number;
  };
} {
  const startDate = dayjs(start).tz(timezone);
  const endDate = dayjs(end).tz(timezone);
  
  const diffMinutes = endDate.diff(startDate, 'minute');
  const diffHours = endDate.diff(startDate, 'hour');
  const diffDays = endDate.diff(startDate, 'day');

  return {
    start: toDualDate(startDate, timezone),
    end: toDualDate(endDate, timezone),
    duration: {
      days: diffDays,
      hours: diffHours,
      minutes: diffMinutes,
    },
  };
}

/**
 * Check if a date is a weekend (Thursday/Friday in Iran)
 */
export function isWeekend(date: string | Date | DualDate, timezone: string = DEFAULT_TIMEZONE): boolean {
  let dayOfWeek: number;
  
  if (typeof date === 'object' && 'iso' in date) {
    dayOfWeek = dayjs(date.iso).tz(timezone).day();
  } else {
    dayOfWeek = dayjs(date).tz(timezone).day();
  }
  
  // Thursday = 4, Friday = 5
  return dayOfWeek === 4 || dayOfWeek === 5;
}

/**
 * Get array of dates between start and end
 */
export function getDateRange(
  start: string | Date,
  end: string | Date,
  options: {
    includeWeekends?: boolean;
    timezone?: string;
  } = {}
): DualDate[] {
  const { includeWeekends = true, timezone = DEFAULT_TIMEZONE } = options;
  
  const startDate = dayjs(start).tz(timezone).startOf('day');
  const endDate = dayjs(end).tz(timezone).startOf('day');
  const dates: DualDate[] = [];
  
  let current = startDate;
  while (current.isBefore(endDate) || current.isSame(endDate)) {
    const dual = toDualDate(current, timezone);
    
    if (includeWeekends || !isWeekend(dual, timezone)) {
      dates.push(dual);
    }
    
    current = current.add(1, 'day');
  }
  
  return dates;
}

/**
 * Parse Persian date string to ISO
 */
export function persianToISO(persianDate: string, timezone: string = DEFAULT_TIMEZONE): string {
  // Format: "1404/10/10" or "1404-10-10"
  const jalaliMoment = moment(persianDate, ['jYYYY/jMM/jDD', 'jYYYY-jMM-jDD', 'jYYYY/jM/jD']);
  if (!jalaliMoment.isValid()) {
    throw new Error(`Invalid Persian date format: ${persianDate}`);
  }
  return dayjs(jalaliMoment.format('YYYY-MM-DD'))
    .tz(timezone)
    .utc()
    .toISOString();
}

/**
 * Format helper - returns a function to format dates consistently
 */
export function createDateFormatter(timezone: string = DEFAULT_TIMEZONE) {
  return {
    /**
     * Format date for display (both calendars)
     */
    format: (date: string | Date): DualDate => {
      return fromUTC(date, timezone);
    },
    
    /**
     * Format for API input (to UTC)
     */
    toAPI: (date: string | Date): string => {
      return toUTC(date, timezone);
    },
    
    /**
     * Parse user input
     */
    parse: (input: string): DualDate => {
      return parseDate(input, timezone);
    },
  };
}
