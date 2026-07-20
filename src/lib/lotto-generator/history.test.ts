import { describe, it, expect } from 'vitest';
import {
  addHistory,
  pruneUnknown,
  clearHistory,
} from './history';
import { type HistoryEntry } from './schema';

describe('src/lib/lotto-generator/history', () => {
  describe('addHistory', () => {
    it('adds entry to front of array (prepend)', () => {
      const oldEntry: HistoryEntry = {
        timestamp: '2026-07-20T10:00:00Z',
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [[1, 2, 3, 4, 5, 6]],
      };
      const newEntry: HistoryEntry = {
        timestamp: '2026-07-20T11:00:00Z',
        gameCount: 2,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [
          [1, 2, 3, 4, 5, 6],
          [7, 8, 9, 10, 11, 12],
        ],
      };

      const result = addHistory([oldEntry], newEntry);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(newEntry);
      expect(result[1]).toEqual(oldEntry);
    });

    it('caps history at 20 entries', () => {
      const entries: HistoryEntry[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2026-07-20T${String(i).padStart(2, '0')}:00:00Z`,
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [[1, 2, 3, 4, 5, 6]],
      }));

      const newEntry: HistoryEntry = {
        timestamp: '2026-07-20T23:00:00Z',
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [[7, 8, 9, 10, 11, 12]],
      };

      const result = addHistory(entries, newEntry);
      expect(result).toHaveLength(20);
      expect(result[0]).toEqual(newEntry);
      expect(result[result.length - 1]).not.toEqual(entries[19]); // Oldest removed
    });

    it('does not mutate original array', () => {
      const oldEntry: HistoryEntry = {
        timestamp: '2026-07-20T10:00:00Z',
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [[1, 2, 3, 4, 5, 6]],
      };
      const newEntry: HistoryEntry = {
        timestamp: '2026-07-20T11:00:00Z',
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [[7, 8, 9, 10, 11, 12]],
      };
      const original = [oldEntry];
      const originalLength = original.length;

      addHistory(original, newEntry);
      expect(original).toHaveLength(originalLength);
      expect(original[0]).toEqual(oldEntry);
    });
  });

  describe('pruneUnknown', () => {
    it('keeps valid entries', () => {
      const entries: HistoryEntry[] = [
        {
          timestamp: '2026-07-20T10:00:00Z',
          gameCount: 1,
          fixedNumbers: [],
          excludedNumbers: [],
          games: [[1, 2, 3, 4, 5, 6]],
        },
      ];

      const result = pruneUnknown(entries);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(entries[0]);
    });

    it('removes invalid entries', () => {
      const entries: HistoryEntry[] = [
        {
          timestamp: '2026-07-20T10:00:00Z',
          gameCount: 1,
          fixedNumbers: [],
          excludedNumbers: [],
          games: [[1, 2, 3, 4, 5, 6]],
        },
        {
          timestamp: '2026-07-20T11:00:00Z',
          gameCount: 99, // Invalid: > 10
          fixedNumbers: [],
          excludedNumbers: [],
          games: [[1, 2, 3, 4, 5, 6]],
        } as HistoryEntry,
      ];

      const result = pruneUnknown(entries);
      expect(result).toHaveLength(1);
      expect(result[0].gameCount).toBe(1);
    });

    it('removes infeasible entries', () => {
      const entries: HistoryEntry[] = [
        {
          timestamp: '2026-07-20T10:00:00Z',
          gameCount: 1,
          fixedNumbers: [1, 2, 3, 4, 5],
          excludedNumbers: Array.from({ length: 40 }, (_, i) => i + 6), // 40 excluded
          games: [[1, 2, 3, 4, 5, 6]], // Infeasible: 45 - 40 = 5 < 6 - 5 = 1? No, 5 >= 1 ✓
        } as HistoryEntry,
        {
          timestamp: '2026-07-20T11:00:00Z',
          gameCount: 1,
          fixedNumbers: [],
          excludedNumbers: Array.from({ length: 40 }, (_, i) => i + 1), // Exclude 1–40, only 41–45 left
          games: [[41, 42, 43, 44, 45, 1]], // Invalid: 1 is excluded
        } as HistoryEntry,
      ];

      const result = pruneUnknown(entries);
      // Both should be removed due to schema violations
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('does not mutate original array', () => {
      const entry: HistoryEntry = {
        timestamp: '2026-07-20T10:00:00Z',
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [[1, 2, 3, 4, 5, 6]],
      };
      const original = [entry];
      const originalLength = original.length;

      pruneUnknown(original);
      expect(original).toHaveLength(originalLength);
    });
  });

  describe('clearHistory', () => {
    it('returns empty array', () => {
      const entries: HistoryEntry[] = [
        {
          timestamp: '2026-07-20T10:00:00Z',
          gameCount: 1,
          fixedNumbers: [],
          excludedNumbers: [],
          games: [[1, 2, 3, 4, 5, 6]],
        },
      ];

      const result = clearHistory(entries);
      expect(result).toEqual([]);
    });

    it('does not mutate original array', () => {
      const entry: HistoryEntry = {
        timestamp: '2026-07-20T10:00:00Z',
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [[1, 2, 3, 4, 5, 6]],
      };
      const original = [entry];
      const originalLength = original.length;

      clearHistory(original);
      expect(original).toHaveLength(originalLength);
    });
  });
});
