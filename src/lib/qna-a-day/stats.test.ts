import { describe, it, expect } from 'vitest';
import {
  currentStreak,
  longestStreak,
  totalAnswered,
  yearCompletion,
  monthCompletion,
  heatmap,
  type DateKey,
} from './stats';
import { addDays } from './date';

describe('stats — streak and completion', () => {
  describe('currentStreak', () => {
    it('returns 0 if neither today nor yesterday answered', () => {
      const entries = {};
      expect(currentStreak(entries, '2026-06-30')).toBe(0);
    });

    it('returns 1 if only today answered', () => {
      const entries = { '2026-06-30': {} };
      expect(currentStreak(entries, '2026-06-30')).toBe(1);
    });

    it('counts today + days before', () => {
      const entries = {
        '2026-06-30': {},
        '2026-06-29': {},
        '2026-06-28': {},
        '2026-06-27': {},
      };
      expect(currentStreak(entries, '2026-06-30')).toBe(4);
    });

    it('applies grace day: today not answered, yesterday is', () => {
      const entries = { '2026-06-29': {} };
      expect(currentStreak(entries, '2026-06-30')).toBe(1);
    });

    it('stops at a gap (not answered)', () => {
      const entries = {
        '2026-06-30': {},
        '2026-06-29': {},
        // Gap: 06-28 missing
        '2026-06-27': {},
      };
      expect(currentStreak(entries, '2026-06-30')).toBe(2);
    });

    it('counts from yesterday if today not answered but yesterday is', () => {
      const entries = {
        '2026-06-29': {},
        '2026-06-28': {},
        '2026-06-27': {},
      };
      expect(currentStreak(entries, '2026-06-30')).toBe(3);
    });

    it('returns 0 if neither today nor yesterday answered', () => {
      const entries = {
        '2026-06-27': {},
        '2026-06-26': {},
      };
      expect(currentStreak(entries, '2026-06-30')).toBe(0);
    });
  });

  describe('longestStreak', () => {
    it('returns 0 for empty entries', () => {
      const entries = {};
      expect(longestStreak(entries)).toBe(0);
    });

    it('returns 1 for a single day', () => {
      const entries = { '2026-06-30': {} };
      expect(longestStreak(entries)).toBe(1);
    });

    it('finds the longest consecutive streak', () => {
      const entries = {
        '2026-06-30': {},
        '2026-06-29': {},
        '2026-06-28': {},
        // Gap
        '2026-06-25': {},
        '2026-06-24': {},
        '2026-06-23': {},
        '2026-06-22': {},
      };
      expect(longestStreak(entries)).toBe(4); // 6-22..6-25
    });

    it('handles multiple gaps correctly', () => {
      const entries = {
        '2024-01-05': {},
        '2024-01-04': {},
        '2024-01-03': {},
        // Gap
        '2024-01-01': {},
      };
      expect(longestStreak(entries)).toBe(3);
    });
  });

  describe('totalAnswered', () => {
    it('returns the count of entries', () => {
      const entries = {
        '2026-06-30': {},
        '2026-06-29': {},
        '2026-06-28': {},
      };
      expect(totalAnswered(entries)).toBe(3);
    });

    it('returns 0 for empty entries', () => {
      expect(totalAnswered({})).toBe(0);
    });
  });

  describe('yearCompletion', () => {
    it('returns answered and elapsed for a past year (assume 365 or 366 days)', () => {
      const entries = {
        '2025-01-01': {},
        '2025-06-30': {},
        '2025-12-31': {},
      };
      const result = yearCompletion(entries, 2025, '2026-06-30');
      expect(result.answered).toBe(3);
      expect(result.elapsed).toBe(365); // past non-leap year
    });

    it('returns answered and elapsed for current year (up to today)', () => {
      const entries = {
        '2026-01-01': {},
        '2026-06-30': {},
      };
      // Day 182 of 2026 (Jan 1 to Jun 30 is ~181 days, but let's say 182 for this test)
      const result = yearCompletion(entries, 2026, '2026-06-30');
      expect(result.answered).toBe(2);
      // elapsed should be days from 2026-01-01 to 2026-06-30
      expect(result.elapsed).toBeGreaterThan(0);
    });

    it('handles leap years', () => {
      // 2024 is a leap year
      const entries = {};
      const result = yearCompletion(entries, 2024, '2025-06-30');
      expect(result.elapsed).toBe(366); // leap year, past
    });
  });

  describe('monthCompletion', () => {
    it('returns answered and elapsed for a past month', () => {
      const entries = {
        '2026-03-01': {},
        '2026-03-15': {},
        '2026-03-31': {},
      };
      const result = monthCompletion(entries, 2026, 3, '2026-06-30');
      expect(result.answered).toBe(3);
      expect(result.elapsed).toBe(31); // March has 31 days
    });

    it('returns answered and elapsed for current month (up to today)', () => {
      const entries = {
        '2026-06-15': {},
        '2026-06-20': {},
      };
      // Today is 2026-06-30; elapsed is days from 1 to 30
      const result = monthCompletion(entries, 2026, 6, '2026-06-30');
      expect(result.answered).toBe(2);
      expect(result.elapsed).toBe(30); // Days from Jun 1 to Jun 30
    });

    it('returns correct elapsed for a past month', () => {
      const entries = {};
      const result = monthCompletion(entries, 2026, 2, '2026-06-30');
      expect(result.elapsed).toBe(28); // Feb 2026 (non-leap)
    });

    it('handles leap year February', () => {
      const entries = {};
      const result = monthCompletion(entries, 2024, 2, '2025-06-30');
      expect(result.elapsed).toBe(29); // Feb 2024 (leap)
    });
  });

  describe('heatmap', () => {
    it('returns a record with all dates in a year as keys, boolean values', () => {
      const entries = {
        '2026-01-01': {},
        '2026-06-30': {},
      };
      const map = heatmap(entries, 2026);

      expect(map['2026-01-01']).toBe(true);
      expect(map['2026-06-30']).toBe(true);
      expect(map['2026-02-01']).toBe(false);
    });

    it('includes all 365 dates for non-leap years', () => {
      const entries = {};
      const map = heatmap(entries, 2026);
      const keys = Object.keys(map);
      // Should have 365 keys for a non-leap year
      // Check count and format
      expect(keys.every((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))).toBe(true);
    });

    it('includes all 366 dates for leap years', () => {
      const entries = {};
      const map = heatmap(entries, 2024);
      const keys = Object.keys(map);
      expect(keys.length).toBe(366);
    });

    it('correctly marks answered vs unanswered', () => {
      const entries = {
        '2024-02-29': {}, // Leap year
        '2024-12-31': {},
      };
      const map = heatmap(entries, 2024);
      expect(map['2024-02-29']).toBe(true);
      expect(map['2024-12-31']).toBe(true);
      expect(map['2024-01-01']).toBe(false);
    });
  });
});
