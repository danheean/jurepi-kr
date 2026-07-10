import { describe, it, expect } from 'vitest';
import { formatDomSpec, formatDowSpec, formatNumberField } from './quartz-format';
import { REVERSE_DAY_MAP } from '@/lib/cron-parser';

describe('quartz-format', () => {
  describe('formatNumberField', () => {
    it('returns null for full range (caller localizes "All")', () => {
      const result = formatNumberField([0, 1, 2, 3, 4, 5], 6);
      expect(result).toBeNull();
    });

    it('returns comma-separated values for partial range', () => {
      const result = formatNumberField([5, 10, 15], 60);
      expect(result).toBe('5, 10, 15');
    });

    it('truncates long lists with ellipsis', () => {
      const values = Array.from({ length: 15 }, (_, i) => i);
      const result = formatNumberField(values, 60);
      expect(result).toContain('…');
      expect(result).toMatch(/^0.*\…$/);
    });

    it('handles single value', () => {
      const result = formatNumberField([30], 60);
      expect(result).toBe('30');
    });

    it('handles empty array', () => {
      const result = formatNumberField([], 60);
      expect(result).toBe('');
    });
  });

  describe('formatDomSpec', () => {
    it('returns "?" for noSpecific', () => {
      const dom = {
        values: [],
        noSpecific: true,
        lastDay: false,
        lastWeekday: false,
      };
      expect(formatDomSpec(dom)).toBe('?');
    });

    it('returns "L" for lastDay', () => {
      const dom = {
        values: [],
        noSpecific: false,
        lastDay: true,
        lastWeekday: false,
      };
      expect(formatDomSpec(dom)).toBe('L');
    });

    it('returns "L-{n}" for lastOffset', () => {
      const dom = {
        values: [],
        noSpecific: false,
        lastDay: false,
        lastOffset: 3,
        lastWeekday: false,
      };
      expect(formatDomSpec(dom)).toBe('L-3');
    });

    it('returns "LW" for lastWeekday', () => {
      const dom = {
        values: [],
        noSpecific: false,
        lastDay: false,
        lastWeekday: true,
      };
      expect(formatDomSpec(dom)).toBe('LW');
    });

    it('returns "{n}W" for nearestWeekday', () => {
      const dom = {
        values: [],
        noSpecific: false,
        lastDay: false,
        nearestWeekday: 15,
        lastWeekday: false,
      };
      expect(formatDomSpec(dom)).toBe('15W');
    });

    it('returns formatted values for specific dates', () => {
      const dom = {
        values: [1, 15, 30],
        noSpecific: false,
        lastDay: false,
        lastWeekday: false,
      };
      expect(formatDomSpec(dom)).toBe('1, 15, 30');
    });

    it('returns null when dom covers all 31 days (full range)', () => {
      const dom = {
        values: Array.from({ length: 31 }, (_, i) => i + 1),
        noSpecific: false,
        lastDay: false,
        lastWeekday: false,
      };
      expect(formatDomSpec(dom)).toBeNull();
    });
  });

  describe('formatDowSpec', () => {
    it('returns "?" for noSpecific', () => {
      const dow = {
        values: [],
        noSpecific: true,
      };
      expect(formatDowSpec(dow)).toBe('?');
    });

    it('returns "{DAY}L" for last dow', () => {
      const dow = {
        values: [],
        noSpecific: false,
        last: 5, // FRI
      };
      const result = formatDowSpec(dow);
      expect(result).toContain('L');
      expect(result).toContain(REVERSE_DAY_MAP[5]); // Should contain FRI symbol
    });

    it('returns "{DAY}#{n}" for nth dow', () => {
      const dow = {
        values: [],
        noSpecific: false,
        nth: { dow: 6, n: 3 }, // 3rd SAT
      };
      const result = formatDowSpec(dow);
      expect(result).toContain('#3');
      expect(result).toContain(REVERSE_DAY_MAP[6]); // Should contain SAT symbol
    });

    it('returns day symbols for specific values', () => {
      const dow = {
        values: [1, 3, 5], // MON, WED, FRI
        noSpecific: false,
      };
      const result = formatDowSpec(dow);
      expect(result).toContain(REVERSE_DAY_MAP[1]);
      expect(result).toContain(REVERSE_DAY_MAP[3]);
      expect(result).toContain(REVERSE_DAY_MAP[5]);
    });

    it('returns null when dow covers all 7 days (full range)', () => {
      const dow = {
        values: [0, 1, 2, 3, 4, 5, 6],
        noSpecific: false,
      };
      expect(formatDowSpec(dow)).toBeNull();
    });
  });
});
