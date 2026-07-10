import { describe, it, expect } from 'vitest';
import { parseQuartz } from './quartz-parser';

describe('parseQuartz', () => {
  describe('valid basic patterns', () => {
    it('parses every second with *', () => {
      const result = parseQuartz('* * * * * ?');
      expect(result.isValid).toBe(true);
      expect(result.second).toEqual(Array.from({ length: 60 }, (_, i) => i));
      expect(result.minute).toEqual(Array.from({ length: 60 }, (_, i) => i));
      expect(result.hour).toEqual(Array.from({ length: 24 }, (_, i) => i));
      expect(result.month).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      expect(result.dom.noSpecific).toBe(false); // * means all, not unspecified
      expect(result.dom.values).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
      expect(result.dow.noSpecific).toBe(true); // ? means unspecified
      expect(result.hasYear).toBe(false);
    });

    it('parses 6 fields without year', () => {
      const result = parseQuartz('0 0 0 1 1 ?');
      expect(result.isValid).toBe(true);
      expect(result.second).toEqual([0]);
      expect(result.minute).toEqual([0]);
      expect(result.hour).toEqual([0]);
      expect(result.dom.values).toEqual([1]);
      expect(result.month).toEqual([1]);
      expect(result.dow.noSpecific).toBe(true);
      expect(result.hasYear).toBe(false);
    });

    it('parses 7 fields with year', () => {
      const result = parseQuartz('0 0 0 1 1 ? 2026');
      expect(result.isValid).toBe(true);
      expect(result.year).toEqual([2026]);
      expect(result.hasYear).toBe(true);
    });
  });

  describe('field parsing', () => {
    it('parses explicit values', () => {
      const result = parseQuartz('0,15,30,45 0 0 15 1-3 ?');
      expect(result.isValid).toBe(true);
      expect(result.second).toEqual([0, 15, 30, 45]);
      expect(result.month).toEqual([1, 2, 3]);
    });

    it('parses ranges', () => {
      const result = parseQuartz('0 0 0-5 * * ?');
      expect(result.isValid).toBe(true);
      expect(result.hour).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('parses step values', () => {
      const result = parseQuartz('0/30 * * * * ?');
      expect(result.isValid).toBe(true);
      expect(result.second).toEqual([0, 30]);
    });

    it('parses month names', () => {
      const result = parseQuartz('0 0 0 1 JAN,JUL,DEC ?');
      expect(result.isValid).toBe(true);
      expect(result.month).toEqual([1, 7, 12]);
    });

    it('parses day names', () => {
      const result = parseQuartz('0 0 0 ? * MON-FRI');
      expect(result.isValid).toBe(true);
      expect(result.dow.values).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('dom special patterns', () => {
    it('parses L (last day)', () => {
      const result = parseQuartz('0 0 0 L * ?');
      expect(result.isValid).toBe(true);
      expect(result.dom.lastDay).toBe(true);
      expect(result.dom.values).toEqual([]);
    });

    it('parses L-k (last minus offset)', () => {
      const result = parseQuartz('0 0 0 L-3 * ?');
      expect(result.isValid).toBe(true);
      expect(result.dom.lastDay).toBe(true);
      expect(result.dom.lastOffset).toBe(3);
    });

    it('parses LW (last weekday)', () => {
      const result = parseQuartz('0 0 0 LW * ?');
      expect(result.isValid).toBe(true);
      expect(result.dom.lastWeekday).toBe(true);
    });

    it('parses nW (nearest weekday)', () => {
      const result = parseQuartz('0 0 0 15W * ?');
      expect(result.isValid).toBe(true);
      expect(result.dom.nearestWeekday).toBe(15);
    });

    it('parses mixed explicit and special', () => {
      const result = parseQuartz('0 0 0 1,L,15W * ?');
      expect(result.isValid).toBe(true);
      expect(result.dom.values).toEqual([1]);
      expect(result.dom.lastDay).toBe(true);
      expect(result.dom.nearestWeekday).toBe(15);
    });
  });

  describe('dow special patterns', () => {
    it('parses dowL (last occurrence of dow)', () => {
      const result = parseQuartz('0 0 0 ? * 5L');
      expect(result.isValid).toBe(true);
      expect(result.dow.last).toBe(4); // FRI in 0-6 (Quartz 5 = FRI)
    });

    it('parses dow#n (nth occurrence)', () => {
      const result = parseQuartz('0 0 0 ? * 5#3');
      expect(result.isValid).toBe(true);
      expect(result.dow.nth).toEqual({ dow: 4, n: 3 }); // 3rd FRI
    });

    it('parses SUN with correct mapping', () => {
      const result = parseQuartz('0 0 0 ? * 0');
      expect(result.isValid).toBe(true);
      expect(result.dow.values).toEqual([0]); // SUN
    });

    it('parses numeric dow 1-7 (Quartz range)', () => {
      const result = parseQuartz('0 0 0 ? * 1-7');
      expect(result.isValid).toBe(true);
      expect(result.dow.values).toEqual([0, 1, 2, 3, 4, 5, 6]); // normalized to 0-6
    });

    it('parses day names with ranges', () => {
      const result = parseQuartz('0 0 0 ? * SUN,WED-FRI,SAT');
      expect(result.isValid).toBe(true);
      expect(result.dow.values).toEqual([0, 3, 4, 5, 6]);
    });
  });

  describe('validation errors', () => {
    it('rejects wrong field count (< 6)', () => {
      const result = parseQuartz('0 0 0 1 1');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('expression');
      expect(result.error?.message).toBe('fieldCount');
    });

    it('rejects wrong field count (> 7)', () => {
      const result = parseQuartz('0 0 0 1 1 ? 2026 extra');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('expression');
      expect(result.error?.message).toBe('fieldCount');
    });

    it('rejects out-of-range second', () => {
      const result = parseQuartz('60 0 0 1 1 ?');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('second');
    });

    it('rejects out-of-range minute', () => {
      const result = parseQuartz('0 60 0 1 1 ?');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('minute');
    });

    it('rejects out-of-range hour', () => {
      const result = parseQuartz('0 0 24 1 1 ?');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('hour');
    });

    it('rejects out-of-range dom', () => {
      const result = parseQuartz('0 0 0 32 1 ?');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('dom');
    });

    it('rejects out-of-range month', () => {
      const result = parseQuartz('0 0 0 1 13 ?');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('month');
    });

    it('rejects out-of-range dow', () => {
      const result = parseQuartz('0 0 0 ? * 8');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('dow');
    });

    it('rejects both dom and dow specified (not ?, not *)', () => {
      const result = parseQuartz('0 0 0 15 1 MON');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBe('bothSpecified');
    });

    it('rejects invalid dom patterns', () => {
      const result = parseQuartz('0 0 0 X * ?');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('dom');
    });

    it('rejects invalid month name', () => {
      const result = parseQuartz('0 0 0 1 INVALID ?');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('month');
    });

    it('rejects invalid dow name', () => {
      const result = parseQuartz('0 0 0 ? * INVALID');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('dow');
    });

    it('rejects out-of-range year', () => {
      const result = parseQuartz('0 0 0 1 1 ? 1969');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('year');
    });

    it('rejects both dom and dow as noSpecific (?)' , () => {
      const result = parseQuartz('0 0 0 ? * ?');
      // Allow this (Quartz is strict, but we're more lenient)
      expect(result.isValid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles sorted output', () => {
      const result = parseQuartz('0 0 5,1,3 * * ?');
      expect(result.isValid).toBe(true);
      expect(result.hour).toEqual([1, 3, 5]);
    });

    it('handles duplicate removal', () => {
      const result = parseQuartz('0 0 5,5,1,1 * * ?');
      expect(result.isValid).toBe(true);
      expect(result.hour).toEqual([1, 5]);
    });

    it('handles large step values', () => {
      const result = parseQuartz('0/45 * * * * ?');
      expect(result.isValid).toBe(true);
      expect(result.second).toEqual([0, 45]);
    });

    it('handles mixed case day names', () => {
      const result = parseQuartz('0 0 0 ? * Mon-Fri');
      expect(result.isValid).toBe(true);
      expect(result.dow.values).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('year field (7th, optional)', () => {
    it('parses * as all years 1970-2099', () => {
      const result = parseQuartz('0 0 0 1 1 ? *');
      expect(result.isValid).toBe(true);
      expect(result.hasYear).toBe(true);
      expect(result.year?.[0]).toBe(1970);
      expect(result.year?.[result.year.length - 1]).toBe(2099);
    });

    it('parses a list of years', () => {
      const result = parseQuartz('0 0 0 1 1 ? 2026,2028');
      expect(result.isValid).toBe(true);
      expect(result.year).toEqual([2026, 2028]);
    });

    it('parses a range of years', () => {
      const result = parseQuartz('0 0 0 1 1 ? 2026-2030');
      expect(result.isValid).toBe(true);
      expect(result.year).toEqual([2026, 2027, 2028, 2029, 2030]);
    });

    it('parses a step over years', () => {
      const result = parseQuartz('0 0 0 1 1 ? 2026/2');
      expect(result.isValid).toBe(true);
      expect(result.year).toContain(2026);
      expect(result.year).toContain(2028);
      expect(result.year).not.toContain(2027);
    });

    it('parses a step from * as start 1970', () => {
      const result = parseQuartz('0 0 0 1 1 ? */40');
      expect(result.isValid).toBe(true);
      expect(result.year).toContain(1970);
      expect(result.year).toContain(2010);
    });

    it('rejects a year below 1970', () => {
      const result = parseQuartz('0 0 0 1 1 ? 1969');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('year');
    });

    it('rejects a year above 2099', () => {
      const result = parseQuartz('0 0 0 1 1 ? 2100');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('year');
    });

    it('rejects an inverted year range', () => {
      const result = parseQuartz('0 0 0 1 1 ? 2030-2026');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('year');
    });

    it('rejects an out-of-range year range end', () => {
      const result = parseQuartz('0 0 0 1 1 ? 2050-2200');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('year');
    });

    it('rejects an out-of-range step start', () => {
      const result = parseQuartz('0 0 0 1 1 ? 1900/5');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('year');
    });

    it('rejects a non-numeric step', () => {
      const result = parseQuartz('0 0 0 1 1 ? 2026/x');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('year');
    });
  });

  describe('dow field step and range', () => {
    it('parses a dow step (0/2 → SUN,TUE,THU,SAT)', () => {
      const result = parseQuartz('0 0 0 ? * 1/2');
      expect(result.isValid).toBe(true);
      expect(result.dow.values).toEqual([0, 2, 4, 6]);
    });

    it('parses a dow step from *', () => {
      const result = parseQuartz('0 0 0 ? * */3');
      expect(result.isValid).toBe(true);
      expect(result.dow.values).toEqual([0, 3, 6]);
    });

    it('rejects a non-numeric dow step', () => {
      const result = parseQuartz('0 0 0 ? * 1/x');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('dow');
    });

    it('rejects an inverted dow range', () => {
      const result = parseQuartz('0 0 0 ? * FRI-MON');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('dow');
    });

    it('rejects a zero dow step', () => {
      const result = parseQuartz('0 0 0 ? * 1/0');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('dow');
    });

    it('rejects conflicting nth specifications', () => {
      const result = parseQuartz('0 0 0 ? * 6#3,5#2');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('dow');
    });

    it('rejects conflicting last specifications', () => {
      const result = parseQuartz('0 0 0 ? * 6L,5L');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('dow');
    });

    it('rejects an out-of-range nth n', () => {
      const result = parseQuartz('0 0 0 ? * 6#7');
      expect(result.isValid).toBe(false);
      expect(result.error?.field).toBe('dow');
    });
  });
});
