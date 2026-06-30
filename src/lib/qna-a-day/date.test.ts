import { describe, it, expect } from 'vitest';
import {
  toDateKey,
  toQuestionKey,
  questionKeyFromDateKey,
  resolveQuestionKey,
  parseDateKey,
  addDays,
  neighbors,
  isLeapYear,
  daysInMonth,
  today,
} from './date';

describe('date engine — local-time correctness', () => {
  describe('toDateKey', () => {
    it('converts Date to YYYY-MM-DD using local components', () => {
      const d = new Date(2026, 5, 30); // June 30, 2026 (local midnight)
      expect(toDateKey(d)).toBe('2026-06-30');
    });

    it('zero-pads month and day', () => {
      const d = new Date(2026, 0, 5); // Jan 5
      expect(toDateKey(d)).toBe('2026-01-05');
    });

    it('handles year boundaries', () => {
      const dec31 = new Date(2026, 11, 31);
      const jan1 = new Date(2027, 0, 1);
      expect(toDateKey(dec31)).toBe('2026-12-31');
      expect(toDateKey(jan1)).toBe('2027-01-01');
    });

    it('uses local components, not UTC', () => {
      // Create a date that would be different in UTC
      // For simplicity, we test that getFullYear/getMonth/getDate are used
      const d = new Date(2026, 5, 30);
      const key = toDateKey(d);
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const [y, m, day] = key.split('-').map(Number);
      expect(y).toBe(d.getFullYear());
      expect(m).toBe(d.getMonth() + 1);
      expect(day).toBe(d.getDate());
    });
  });

  describe('toQuestionKey', () => {
    it('extracts MM-DD from a Date', () => {
      const d = new Date(2026, 5, 30);
      expect(toQuestionKey(d)).toBe('06-30');
    });

    it('extracts MM-DD from a dateKey string', () => {
      expect(toQuestionKey('2026-06-30')).toBe('06-30');
    });

    it('zero-pads month and day', () => {
      const d = new Date(2026, 0, 5);
      expect(toQuestionKey(d)).toBe('01-05');
    });

    it('handles both Date and string input', () => {
      const d = new Date(2026, 11, 25);
      const dateKeyStr = '2026-12-25';
      expect(toQuestionKey(d)).toBe(toQuestionKey(dateKeyStr));
    });
  });

  describe('questionKeyFromDateKey', () => {
    it('slices MM-DD from YYYY-MM-DD', () => {
      expect(questionKeyFromDateKey('2026-06-30')).toBe('06-30');
      expect(questionKeyFromDateKey('2025-01-01')).toBe('01-01');
      expect(questionKeyFromDateKey('2026-12-31')).toBe('12-31');
    });
  });

  describe('resolveQuestionKey', () => {
    it('maps 02-29 to 02-28', () => {
      expect(resolveQuestionKey('02-29')).toBe('02-28');
    });

    it('is identity for all other dates', () => {
      expect(resolveQuestionKey('02-28')).toBe('02-28');
      expect(resolveQuestionKey('03-01')).toBe('03-01');
      expect(resolveQuestionKey('01-01')).toBe('01-01');
      expect(resolveQuestionKey('12-31')).toBe('12-31');
    });
  });

  describe('parseDateKey', () => {
    it('parses YYYY-MM-DD to local midnight Date', () => {
      const d = parseDateKey('2026-06-30');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(5); // 0-indexed
      expect(d.getDate()).toBe(30);
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
    });

    it('handles month and day boundaries', () => {
      const jan1 = parseDateKey('2026-01-01');
      expect(jan1.getMonth()).toBe(0);
      expect(jan1.getDate()).toBe(1);

      const dec31 = parseDateKey('2026-12-31');
      expect(dec31.getMonth()).toBe(11);
      expect(dec31.getDate()).toBe(31);
    });
  });

  describe('addDays', () => {
    it('adds days via setDate (DST-safe)', () => {
      expect(addDays('2026-06-30', 1)).toBe('2026-07-01');
      expect(addDays('2026-06-30', -1)).toBe('2026-06-29');
    });

    it('handles month boundaries', () => {
      expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
      expect(addDays('2026-02-01', -1)).toBe('2026-01-31');
    });

    it('handles year boundaries', () => {
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
      expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    });

    it('handles large deltas', () => {
      expect(addDays('2026-01-01', 365)).toBe('2027-01-01');
      expect(addDays('2026-06-30', 30)).toBe('2026-07-30');
    });
  });

  describe('neighbors', () => {
    it('returns prev and next dateKeys', () => {
      const { prev, next } = neighbors('2026-06-30');
      expect(prev).toBe('2026-06-29');
      expect(next).toBe('2026-07-01');
    });

    it('handles month boundaries', () => {
      const { prev, next } = neighbors('2026-02-01');
      expect(prev).toBe('2026-01-31');
      expect(next).toBe('2026-02-02');
    });

    it('handles year boundaries', () => {
      const { prev, next } = neighbors('2027-01-01');
      expect(prev).toBe('2026-12-31');
      expect(next).toBe('2027-01-02');
    });
  });

  describe('isLeapYear', () => {
    it('identifies leap years (divisible by 4, except centuries)', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(2027)).toBe(false);
      expect(isLeapYear(2028)).toBe(true);
    });

    it('handles century rules (divisible by 400)', () => {
      expect(isLeapYear(2000)).toBe(true); // divisible by 400
      expect(isLeapYear(1900)).toBe(false); // divisible by 100 but not 400
      expect(isLeapYear(2100)).toBe(false);
    });
  });

  describe('daysInMonth', () => {
    it('returns correct days for each month', () => {
      const nonLeapYear = 2026;
      expect(daysInMonth(nonLeapYear, 1)).toBe(31); // Jan
      expect(daysInMonth(nonLeapYear, 2)).toBe(28); // Feb (non-leap)
      expect(daysInMonth(nonLeapYear, 3)).toBe(31); // Mar
      expect(daysInMonth(nonLeapYear, 4)).toBe(30); // Apr
      expect(daysInMonth(nonLeapYear, 5)).toBe(31); // May
      expect(daysInMonth(nonLeapYear, 6)).toBe(30); // Jun
      expect(daysInMonth(nonLeapYear, 7)).toBe(31); // Jul
      expect(daysInMonth(nonLeapYear, 8)).toBe(31); // Aug
      expect(daysInMonth(nonLeapYear, 9)).toBe(30); // Sep
      expect(daysInMonth(nonLeapYear, 10)).toBe(31); // Oct
      expect(daysInMonth(nonLeapYear, 11)).toBe(30); // Nov
      expect(daysInMonth(nonLeapYear, 12)).toBe(31); // Dec
    });

    it('handles February in leap years', () => {
      expect(daysInMonth(2024, 2)).toBe(29); // leap year
      expect(daysInMonth(2026, 2)).toBe(28); // non-leap
      expect(daysInMonth(2028, 2)).toBe(29); // leap year
    });
  });

  describe('today', () => {
    it('returns today\'s dateKey with no argument', () => {
      const t = today();
      expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const now = new Date();
      expect(t).toBe(toDateKey(now));
    });

    it('returns the dateKey of the injected now Date', () => {
      const injected = new Date(2026, 5, 30);
      const result = today(injected);
      expect(result).toBe('2026-06-30');
    });

    it('uses local components from injected date', () => {
      const d = new Date(2025, 11, 31);
      expect(today(d)).toBe('2025-12-31');
    });
  });

  describe('round-trip consistency', () => {
    it('parseDateKey(toDateKey(d)) round-trips the local date', () => {
      const original = new Date(2026, 5, 30);
      const key = toDateKey(original);
      const parsed = parseDateKey(key);
      expect(parsed.getFullYear()).toBe(original.getFullYear());
      expect(parsed.getMonth()).toBe(original.getMonth());
      expect(parsed.getDate()).toBe(original.getDate());
    });

    it('questionKeyFromDateKey === toQuestionKey(parseDateKey(dateKey))', () => {
      const dateKey = '2026-06-30';
      const qk1 = questionKeyFromDateKey(dateKey);
      const qk2 = toQuestionKey(parseDateKey(dateKey));
      expect(qk1).toBe(qk2);
    });
  });
});
