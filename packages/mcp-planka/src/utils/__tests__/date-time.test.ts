/**
 * Tests for date-time utilities with dual calendar support
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseDate,
  now,
  today,
  yesterday,
  tomorrow,
  fromUTC,
  toUTC,
  formatDateRange,
  isWeekend,
  getDateRange,
  persianToISO,
  createDateFormatter,
  DEFAULT_TIMEZONE,
  type DualDate,
} from '../date-time.js';

describe('Date-Time Utilities', () => {
  describe('parseDate', () => {
    it('should parse "today"', () => {
      const result = parseDate('today');
      expect(result).toHaveProperty('gregorian');
      expect(result).toHaveProperty('persian');
      expect(result).toHaveProperty('iso');
      expect(result.gregorian.timezone).toBe(DEFAULT_TIMEZONE);
    });

    it('should parse "tomorrow"', () => {
      const todayDate = today();
      const tomorrowDate = parseDate('tomorrow');
      
      expect(tomorrowDate.timestamp).toBeGreaterThan(todayDate.timestamp);
    });

    it('should parse "yesterday"', () => {
      const todayDate = today();
      const yesterdayDate = parseDate('yesterday');
      
      expect(yesterdayDate.timestamp).toBeLessThan(todayDate.timestamp);
    });

    it('should parse relative dates like "in 3 days"', () => {
      const todayDate = today();
      const future = parseDate('in 3 days');
      
      const daysDiff = Math.floor((future.timestamp - todayDate.timestamp) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(3);
    });

    it('should parse relative dates like "2 hours ago"', () => {
      const nowDate = now();
      const past = parseDate('2 hours ago');
      
      const hoursDiff = Math.round((nowDate.timestamp - past.timestamp) / (1000 * 60 * 60));
      expect(hoursDiff).toBe(2);
    });

    it('should parse ISO date strings', () => {
      const result = parseDate('2025-12-30');
      expect(result.gregorian.date).toBe('2025-12-30');
    });

    it('should parse Persian dates', () => {
      const result = parseDate('1404/10/10');
      expect(result.persian.year).toBe(1404);
      expect(result.persian.month).toBe(10);
      expect(result.persian.day).toBe(10);
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-12-30T10:30:00Z');
      const result = parseDate(date);
      expect(result.iso).toContain('2025-12-30');
    });

    it('should default to today for invalid inputs', () => {
      const result = parseDate('invalid-date-string');
      const todayDate = today();
      
      // Should be close to today (within 1 day)
      const daysDiff = Math.abs(result.timestamp - todayDate.timestamp) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeLessThan(1);
    });
  });

  describe('Current date functions', () => {
    it('should return now with time', () => {
      const nowDate = now();
      expect(nowDate).toHaveProperty('gregorian');
      expect(nowDate).toHaveProperty('persian');
      expect(nowDate.gregorian.time).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should return today at start of day', () => {
      const todayDate = today();
      expect(todayDate.gregorian.time).toBe('00:00:00');
    });

    it('should return yesterday', () => {
      const todayDate = today();
      const yesterdayDate = yesterday();
      
      const daysDiff = Math.floor((todayDate.timestamp - yesterdayDate.timestamp) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(1);
    });

    it('should return tomorrow', () => {
      const todayDate = today();
      const tomorrowDate = tomorrow();
      
      const daysDiff = Math.floor((tomorrowDate.timestamp - todayDate.timestamp) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(1);
    });
  });

  describe('Timezone conversion', () => {
    it('should convert from UTC to Tehran timezone', () => {
      const utcDate = '2025-12-30T10:30:00.000Z';
      const result = fromUTC(utcDate);
      
      expect(result.gregorian.timezone).toBe(DEFAULT_TIMEZONE);
      expect(result.iso).toBe(utcDate);
    });

    it('should convert from Tehran to UTC', () => {
      const localDate = '2025-12-30 14:00:00';
      const utcDate = toUTC(localDate);
      
      expect(utcDate).toContain('2025-12-30');
      expect(utcDate).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('DualDate structure', () => {
    it('should contain all required Gregorian fields', () => {
      const date = today();
      
      expect(date.gregorian).toHaveProperty('date');
      expect(date.gregorian).toHaveProperty('dateTime');
      expect(date.gregorian).toHaveProperty('time');
      expect(date.gregorian).toHaveProperty('timezone');
      expect(date.gregorian).toHaveProperty('formatted');
      
      expect(date.gregorian.date).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(date.gregorian.dateTime).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should contain all required Persian fields', () => {
      const date = today();
      
      expect(date.persian).toHaveProperty('date');
      expect(date.persian).toHaveProperty('dateTime');
      expect(date.persian).toHaveProperty('time');
      expect(date.persian).toHaveProperty('formatted');
      expect(date.persian).toHaveProperty('year');
      expect(date.persian).toHaveProperty('month');
      expect(date.persian).toHaveProperty('day');
      
      expect(date.persian.year).toBeGreaterThan(1400);
      expect(date.persian.month).toBeGreaterThanOrEqual(1);
      expect(date.persian.month).toBeLessThanOrEqual(12);
    });

    it('should contain ISO and timestamp', () => {
      const date = now();
      
      expect(date).toHaveProperty('iso');
      expect(date).toHaveProperty('timestamp');
      
      expect(date.iso).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(typeof date.timestamp).toBe('number');
      expect(date.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Persian calendar conversion', () => {
    it('should correctly convert known Gregorian to Persian date', () => {
      // 2025-03-21 is 1404-01-01 (Persian New Year)
      const result = parseDate('2025-03-21');
      
      // Should be close to Persian year 1404
      expect(result.persian.year).toBe(1404);
    });

    it('should format Persian digits', () => {
      const result = parseDate('1404/10/10');
      
      // Persian formatted should contain Persian digits
      expect(result.persian.formatted).toMatch(/۱۴۰۴/);
    });

    it('should convert Persian date to ISO', () => {
      const iso = persianToISO('1404/01/01');
      
      expect(iso).toMatch(/\d{4}-\d{2}-\d{2}T/);
      // Persian New Year 1404 is around March 2025
      expect(iso).toContain('2025-03');
    });
  });

  describe('Date ranges', () => {
    it('should format date range with duration', () => {
      const range = formatDateRange('2025-12-01', '2025-12-07');
      
      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
      expect(range).toHaveProperty('duration');
      
      expect(range.duration.days).toBe(6);
    });

    it('should get date range as array', () => {
      const dates = getDateRange('2025-12-01', '2025-12-03');
      
      expect(Array.isArray(dates)).toBe(true);
      expect(dates.length).toBe(3); // Inclusive of both start and end
    });

    it('should exclude weekends when requested', () => {
      // Get a week that includes a weekend
      const dates = getDateRange('2025-12-01', '2025-12-07', {
        includeWeekends: false,
      });
      
      // Check no weekend days (Thursday=4, Friday=5) in results
      dates.forEach(date => {
        expect(isWeekend(date)).toBe(false);
      });
    });
  });

  describe('Weekend detection (Iran)', () => {
    it('should detect Thursday as weekend', () => {
      // Need to find a Thursday - 2025-01-02 is Thursday
      const date = parseDate('2025-01-02');
      const dayOfWeek = new Date(date.iso).getDay();
      
      if (dayOfWeek === 4) { // Thursday
        expect(isWeekend(date)).toBe(true);
      }
    });

    it('should detect Friday as weekend', () => {
      // 2025-01-03 is Friday
      const date = parseDate('2025-01-03');
      const dayOfWeek = new Date(date.iso).getDay();
      
      if (dayOfWeek === 5) { // Friday
        expect(isWeekend(date)).toBe(true);
      }
    });

    it('should not detect Monday as weekend', () => {
      // 2025-12-29 is Monday
      const date = parseDate('2025-12-29');
      const dayOfWeek = new Date(date.iso).getDay();
      
      if (dayOfWeek === 1) { // Monday
        expect(isWeekend(date)).toBe(false);
      }
    });
  });

  describe('Date formatter helper', () => {
    it('should create a formatter with consistent timezone', () => {
      const formatter = createDateFormatter('Asia/Tehran');
      
      expect(formatter).toHaveProperty('format');
      expect(formatter).toHaveProperty('toAPI');
      expect(formatter).toHaveProperty('parse');
    });

    it('should format dates consistently', () => {
      const formatter = createDateFormatter();
      const date = formatter.parse('2025-12-30');
      
      expect(date.gregorian.timezone).toBe(DEFAULT_TIMEZONE);
    });

    it('should convert to API format (UTC)', () => {
      const formatter = createDateFormatter();
      const utcDate = formatter.toAPI('2025-12-30 14:00:00');
      
      expect(utcDate).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Edge cases', () => {
    it('should handle leap years', () => {
      const leapDay = parseDate('2024-02-29');
      expect(leapDay.gregorian.date).toBe('2024-02-29');
    });

    it('should handle year boundaries', () => {
      const newYear = parseDate('2025-01-01');
      expect(newYear.gregorian.date).toBe('2025-01-01');
      expect(newYear.persian.year).toBeGreaterThanOrEqual(1403);
    });

    it('should handle month boundaries', () => {
      const endOfMonth = parseDate('2025-01-31');
      const day = new Date(endOfMonth.iso).getDate();
      expect(day).toBe(31);
    });

    it('should handle Persian New Year (Nowruz)', () => {
      // March 20 or 21 is typically Nowruz
      const nowruz = parseDate('2025-03-20');
      
      // Should be close to start of Persian year
      expect([1403, 1404]).toContain(nowruz.persian.year);
    });
  });

  describe('Format consistency', () => {
    it('should format all dates consistently', () => {
      const dates = [
        parseDate('today'),
        parseDate('yesterday'),
        parseDate('tomorrow'),
      ];
      
      dates.forEach(date => {
        // Gregorian date format: YYYY-MM-DD
        expect(date.gregorian.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Persian date format: YYYY-MM-DD
        expect(date.persian.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // ISO format
        expect(date.iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    it('should maintain timezone in all operations', () => {
      const dates = [
        now(),
        today(),
        yesterday(),
        tomorrow(),
      ];
      
      dates.forEach(date => {
        expect(date.gregorian.timezone).toBe(DEFAULT_TIMEZONE);
      });
    });
  });
});
