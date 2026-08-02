import { describe, it, expect } from 'vitest';
import {
  pad2,
  monthDayKey,
  isValidMonthDay,
  parseMonthDay,
  todayKey,
  monthOfKey,
  monthSlug,
  monthNumber,
  DAYS_IN_MONTH,
} from './date';

describe('birthday-secret/date', () => {
  describe('pad2', () => {
    it('pads single digits', () => {
      expect(pad2(1)).toBe('01');
      expect(pad2(9)).toBe('09');
      expect(pad2(10)).toBe('10');
    });

    it('leaves double digits alone', () => {
      expect(pad2(10)).toBe('10');
      expect(pad2(12)).toBe('12');
    });
  });

  describe('monthDayKey', () => {
    it('formats month and day as MM-DD', () => {
      expect(monthDayKey(1, 15)).toBe('01-15');
      expect(monthDayKey(12, 31)).toBe('12-31');
      expect(monthDayKey(2, 29)).toBe('02-29');
    });
  });

  describe('DAYS_IN_MONTH', () => {
    it('has correct days per month', () => {
      expect(DAYS_IN_MONTH).toEqual([31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
    });

    it('uses Feb 29 to allow leap day validation', () => {
      expect(DAYS_IN_MONTH[1]).toBe(29); // Feb
    });
  });

  describe('isValidMonthDay', () => {
    it('accepts valid month-day pairs', () => {
      expect(isValidMonthDay(1, 1)).toBe(true);
      expect(isValidMonthDay(1, 31)).toBe(true);
      expect(isValidMonthDay(12, 31)).toBe(true);
      expect(isValidMonthDay(2, 28)).toBe(true);
      expect(isValidMonthDay(2, 29)).toBe(true); // leap day allowed
    });

    it('rejects invalid months', () => {
      expect(isValidMonthDay(0, 15)).toBe(false);
      expect(isValidMonthDay(13, 15)).toBe(false);
      expect(isValidMonthDay(-1, 15)).toBe(false);
    });

    it('rejects invalid days', () => {
      expect(isValidMonthDay(1, 0)).toBe(false);
      expect(isValidMonthDay(1, 32)).toBe(false);
      expect(isValidMonthDay(4, 31)).toBe(false); // April has 30 days
      expect(isValidMonthDay(2, 30)).toBe(false); // Feb doesn't have 30
      expect(isValidMonthDay(2, 31)).toBe(false);
    });
  });

  describe('parseMonthDay', () => {
    it('parses valid MM-DD strings', () => {
      const result = parseMonthDay('03-15');
      expect(result).toEqual({ month: 3, day: 15 });
    });

    it('parses with leading zeros', () => {
      const result = parseMonthDay('01-05');
      expect(result).toEqual({ month: 1, day: 5 });
    });

    it('returns null for invalid format', () => {
      expect(parseMonthDay('3-15')).toBeNull();
      expect(parseMonthDay('03/15')).toBeNull();
      expect(parseMonthDay('0315')).toBeNull();
      expect(parseMonthDay('invalid')).toBeNull();
    });

    it('returns null for invalid month/day values', () => {
      expect(parseMonthDay('13-01')).toBeNull(); // month > 12
      expect(parseMonthDay('00-05')).toBeNull(); // month 0
      expect(parseMonthDay('02-30')).toBeNull(); // Feb doesn't have 30
      expect(parseMonthDay('04-31')).toBeNull(); // April doesn't have 31
    });

    it('accepts 02-29', () => {
      const result = parseMonthDay('02-29');
      expect(result).toEqual({ month: 2, day: 29 });
    });
  });

  describe('todayKey', () => {
    it('returns MM-DD from injected Date', () => {
      const date = new Date(2026, 2, 15); // March 15, 2026 (month is 0-indexed)
      const key = todayKey(date);
      expect(key).toBe('03-15');
    });

    it('handles January 1st', () => {
      const date = new Date(2026, 0, 1);
      const key = todayKey(date);
      expect(key).toBe('01-01');
    });

    it('handles December 31st', () => {
      const date = new Date(2026, 11, 31);
      const key = todayKey(date);
      expect(key).toBe('12-31');
    });

    it('handles February 29th (leap year)', () => {
      const date = new Date(2024, 1, 29); // Feb 29, 2024 (leap year)
      const key = todayKey(date);
      expect(key).toBe('02-29');
    });
  });

  describe('monthOfKey', () => {
    it('extracts month from MM-DD key', () => {
      expect(monthOfKey('03-15')).toBe(3);
      expect(monthOfKey('12-31')).toBe(12);
      expect(monthOfKey('01-01')).toBe(1);
    });

    it('returns null for invalid format', () => {
      expect(monthOfKey('3-15')).toBeNull();
      expect(monthOfKey('invalid')).toBeNull();
    });
  });

  describe('monthSlug and monthNumber', () => {
    it('converts month number to slug', () => {
      expect(monthSlug(1)).toBe('january');
      expect(monthSlug(6)).toBe('june');
      expect(monthSlug(12)).toBe('december');
    });

    it('converts slug back to month number', () => {
      expect(monthNumber('january')).toBe(1);
      expect(monthNumber('june')).toBe(6);
      expect(monthNumber('december')).toBe(12);
    });

    it('is bidirectional', () => {
      for (let m = 1; m <= 12; m++) {
        const slug = monthSlug(m);
        const num = monthNumber(slug);
        expect(num).toBe(m);
      }
    });
  });
});
