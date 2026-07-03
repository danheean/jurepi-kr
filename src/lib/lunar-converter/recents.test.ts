import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  pushRecent,
  pruneUnknown,
  loadRecents,
  serializeRecents,
  deserializeRecents,
  formatSolarDate,
  formatLunarDate,
} from './recents';
import type { RecentEntry } from './schema';

describe('recents', () => {
  describe('pushRecent', () => {
    it('adds a new recent entry to the front', () => {
      const entries: RecentEntry[] = [];
      const next = pushRecent(entries, '2024-03-15', '2024-02-06');

      expect(next).toHaveLength(1);
      expect(next[0].solarDate).toBe('2024-03-15');
      expect(next[0].lunarDate).toBe('2024-02-06');
      expect(next[0].ts).toBeGreaterThan(0);
    });

    it('deduplicates by solar date and moves to front', () => {
      const entries: RecentEntry[] = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: '2024-10-18', lunarDate: '2024-09-16', ts: 2000 },
      ];
      const next = pushRecent(entries, '2024-03-15', '2024-02-06');

      expect(next).toHaveLength(2);
      expect(next[0].solarDate).toBe('2024-03-15'); // Moved to front
      expect(next[0].ts).toBeGreaterThan(1000); // Updated timestamp
      expect(next[1].solarDate).toBe('2024-10-18');
    });

    it('truncates to max 10 entries', () => {
      const entries: RecentEntry[] = Array.from({ length: 10 }, (_, i) => ({
        solarDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        lunarDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        ts: 1000 + i,
      }));

      const next = pushRecent(entries, '2024-11-01', '2024-10-01');

      expect(next).toHaveLength(10);
      expect(next[0].solarDate).toBe('2024-11-01');
      // The oldest entry should be removed
      expect(next.some((e) => e.solarDate === '2024-01-10')).toBe(false);
    });

    it('allows custom max parameter', () => {
      const entries: RecentEntry[] = Array.from({ length: 5 }, (_, i) => ({
        solarDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        lunarDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        ts: 1000 + i,
      }));

      const next = pushRecent(entries, '2024-06-01', '2024-05-01', 3);

      expect(next).toHaveLength(3);
      expect(next[0].solarDate).toBe('2024-06-01');
    });

    it('returns a new array (immutable)', () => {
      const entries: RecentEntry[] = [{ solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 }];
      const next = pushRecent(entries, '2024-10-18', '2024-09-16');

      expect(next).not.toBe(entries);
      expect(entries).toHaveLength(1); // Original unchanged
    });
  });

  describe('pruneUnknown', () => {
    it('keeps valid entries', () => {
      const entries = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: '2024-10-18', lunarDate: '2024-09-16', ts: 2000 },
      ];
      const pruned = pruneUnknown(entries);

      expect(pruned).toHaveLength(2);
    });

    it('removes entries with invalid date format', () => {
      const entries = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: '2024/03/15', lunarDate: '2024-02-06', ts: 2000 }, // wrong format
      ];
      const pruned = pruneUnknown(entries);

      expect(pruned).toHaveLength(1);
      expect(pruned[0].solarDate).toBe('2024-03-15');
    });

    it('removes entries with out-of-range years', () => {
      const entries = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: '1390-03-15', lunarDate: '1390-02-06', ts: 2000 }, // below min
        { solarDate: '2051-03-15', lunarDate: '2051-02-06', ts: 3000 }, // above max
      ];
      const pruned = pruneUnknown(entries);

      expect(pruned).toHaveLength(1);
      expect(pruned[0].solarDate).toBe('2024-03-15');
    });

    it('removes entries with invalid month', () => {
      const entries = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: '2024-13-15', lunarDate: '2024-02-06', ts: 2000 }, // month 13
        { solarDate: '2024-00-15', lunarDate: '2024-02-06', ts: 3000 }, // month 0
      ];
      const pruned = pruneUnknown(entries);

      expect(pruned).toHaveLength(1);
      expect(pruned[0].solarDate).toBe('2024-03-15');
    });

    it('removes entries with invalid day (outside 1-31)', () => {
      const entries = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: '2024-03-00', lunarDate: '2024-02-06', ts: 2000 }, // day 0
        { solarDate: '2024-03-32', lunarDate: '2024-02-06', ts: 3000 }, // day 32
      ];
      const pruned = pruneUnknown(entries);

      expect(pruned).toHaveLength(1);
      expect(pruned[0].solarDate).toBe('2024-03-15');
    });

    it('removes entries with invalid timestamp', () => {
      const entries = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: '2024-10-18', lunarDate: '2024-09-16', ts: -100 }, // negative
        { solarDate: '2024-10-19', lunarDate: '2024-09-17', ts: 0 }, // zero
      ];
      const pruned = pruneUnknown(entries);

      expect(pruned).toHaveLength(1);
    });

    it('removes non-object entries', () => {
      const entries = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        'not an object' as any,
        null as any,
        undefined as any,
      ];
      const pruned = pruneUnknown(entries);

      expect(pruned).toHaveLength(1);
    });

    it('returns empty array for non-array input', () => {
      expect(pruneUnknown(null as any)).toEqual([]);
      expect(pruneUnknown(undefined as any)).toEqual([]);
      expect(pruneUnknown('not an array' as any)).toEqual([]);
      expect(pruneUnknown({} as any)).toEqual([]);
    });

    it('removes entries with missing fields', () => {
      const entries = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: '2024-10-18', lunarDate: '2024-09-16' } as any, // missing ts
      ];
      const pruned = pruneUnknown(entries);

      expect(pruned).toHaveLength(1);
    });

    it('removes entries with wrong type fields', () => {
      const entries = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: 2024, lunarDate: '2024-02-06', ts: 1000 } as any, // solarDate not string
      ];
      const pruned = pruneUnknown(entries);

      expect(pruned).toHaveLength(1);
    });
  });

  describe('loadRecents', () => {
    it('loads valid store', () => {
      const store = {
        version: 1,
        entries: [
          { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        ],
      };
      const entries = loadRecents(store);

      expect(entries).toHaveLength(1);
    });

    it('prunes invalid entries when loading', () => {
      const store = {
        version: 1,
        entries: [
          { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
          { solarDate: '1390-03-15', lunarDate: '1390-02-06', ts: 2000 }, // out of range
        ],
      };
      const entries = loadRecents(store);

      expect(entries).toHaveLength(1);
    });

    it('returns empty array for invalid store', () => {
      const entries = loadRecents(null);
      expect(entries).toEqual([]);
    });
  });

  describe('serializeRecents', () => {
    it('serializes entries to RecentsStore', () => {
      const entries: RecentEntry[] = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
      ];
      const store = serializeRecents(entries);

      expect(store.version).toBe(1);
      expect(store.entries).toHaveLength(1);
      expect(store.entries[0].solarDate).toBe('2024-03-15');
    });

    it('prunes entries when serializing', () => {
      const entries: RecentEntry[] = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: '1390-03-15', lunarDate: '1390-02-06', ts: 2000 }, // out of range
      ];
      const store = serializeRecents(entries);

      expect(store.entries).toHaveLength(1);
    });
  });

  describe('deserializeRecents', () => {
    it('deserializes valid JSON', () => {
      const json = JSON.stringify({
        version: 1,
        entries: [
          { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        ],
      });
      const entries = deserializeRecents(json);

      expect(entries).toHaveLength(1);
      expect(entries[0].solarDate).toBe('2024-03-15');
    });

    it('returns empty array on invalid JSON', () => {
      const entries = deserializeRecents('{ invalid json');
      expect(entries).toEqual([]);
    });

    it('returns empty array on corrupted data', () => {
      const json = JSON.stringify({
        version: 2, // wrong version
        entries: [],
      });
      const entries = deserializeRecents(json);

      expect(entries).toEqual([]);
    });

    it('prunes entries when deserializing', () => {
      const json = JSON.stringify({
        version: 1,
        entries: [
          { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
          { solarDate: '2051-03-15', lunarDate: '2051-02-06', ts: 2000 }, // out of range
        ],
      });
      const entries = deserializeRecents(json);

      expect(entries).toHaveLength(1);
    });
  });

  describe('formatSolarDate', () => {
    it('formats a solar date as YYYY-MM-DD', () => {
      const formatted = formatSolarDate(2024, 3, 15);
      expect(formatted).toBe('2024-03-15');
    });

    it('pads single-digit months and days', () => {
      const formatted = formatSolarDate(2024, 1, 5);
      expect(formatted).toBe('2024-01-05');
    });
  });

  describe('formatLunarDate', () => {
    it('formats a lunar date as YYYY-MM-DD', () => {
      const formatted = formatLunarDate(2024, 2, 6);
      expect(formatted).toBe('2024-02-06');
    });

    it('pads single-digit months and days', () => {
      const formatted = formatLunarDate(2024, 1, 1);
      expect(formatted).toBe('2024-01-01');
    });
  });

  describe('round-trip serialization', () => {
    it('serializes and deserializes without data loss', () => {
      const original: RecentEntry[] = [
        { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
        { solarDate: '2024-10-18', lunarDate: '2024-09-16', ts: 2000 },
      ];

      const store = serializeRecents(original);
      const json = JSON.stringify(store);
      const restored = deserializeRecents(json);

      expect(restored).toHaveLength(2);
      expect(restored[0].solarDate).toBe('2024-03-15');
      expect(restored[1].solarDate).toBe('2024-10-18');
    });
  });
});
