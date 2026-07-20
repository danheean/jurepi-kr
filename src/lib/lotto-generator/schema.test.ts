import { describe, it, expect } from 'vitest';
import {
  DrawSchema,
  SettingsSchema,
  HistoryEntrySchema,
  LottoStoreSchema,
  parseStore,
} from './schema';

describe('src/lib/lotto-generator/schema', () => {
  describe('DrawSchema', () => {
    it('accepts valid draw: 6 unique sorted numbers 1–45', () => {
      const draw = [2, 7, 18, 34, 41, 44];
      const result = DrawSchema.parse(draw);
      expect(result).toEqual(draw);
    });

    it('rejects draw with duplicate numbers', () => {
      const draw = [2, 2, 18, 34, 41, 44];
      expect(() => DrawSchema.parse(draw)).toThrow();
    });

    it('rejects draw not sorted', () => {
      const draw = [44, 2, 7, 18, 34, 41];
      expect(() => DrawSchema.parse(draw)).toThrow();
    });

    it('rejects draw with wrong length', () => {
      const draw = [2, 7, 18, 34, 41];
      expect(() => DrawSchema.parse(draw)).toThrow();
    });

    it('rejects draw with number out of range [1, 45]', () => {
      const draw = [2, 7, 18, 34, 41, 46];
      expect(() => DrawSchema.parse(draw)).toThrow();

      const draw2 = [0, 7, 18, 34, 41, 44];
      expect(() => DrawSchema.parse(draw2)).toThrow();
    });
  });

  describe('SettingsSchema', () => {
    it('accepts valid settings', () => {
      const settings = {
        gameCount: 3,
        fixedNumbers: [1, 7],
        excludedNumbers: [10, 11, 12],
      };
      const result = SettingsSchema.parse(settings);
      expect(result).toEqual(settings);
    });

    it('accepts empty fixed/excluded', () => {
      const settings = {
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
      };
      const result = SettingsSchema.parse(settings);
      expect(result).toEqual(settings);
    });

    it('rejects gameCount < 1', () => {
      const settings = { gameCount: 0, fixedNumbers: [], excludedNumbers: [] };
      expect(() => SettingsSchema.parse(settings)).toThrow();
    });

    it('rejects gameCount > 10', () => {
      const settings = { gameCount: 11, fixedNumbers: [], excludedNumbers: [] };
      expect(() => SettingsSchema.parse(settings)).toThrow();
    });

    it('rejects fixedNumbers with duplicates', () => {
      const settings = {
        gameCount: 1,
        fixedNumbers: [1, 1, 2],
        excludedNumbers: [],
      };
      expect(() => SettingsSchema.parse(settings)).toThrow();
    });

    it('rejects fixedNumbers with > 5 numbers', () => {
      const settings = {
        gameCount: 1,
        fixedNumbers: [1, 2, 3, 4, 5, 6],
        excludedNumbers: [],
      };
      expect(() => SettingsSchema.parse(settings)).toThrow();
    });

    it('rejects excludedNumbers with > 39 numbers', () => {
      const settings = {
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: Array.from({ length: 40 }, (_, i) => i + 1),
      };
      expect(() => SettingsSchema.parse(settings)).toThrow();
    });

    it('rejects fixedNumbers out of range', () => {
      const settings = {
        gameCount: 1,
        fixedNumbers: [0, 1, 2],
        excludedNumbers: [],
      };
      expect(() => SettingsSchema.parse(settings)).toThrow();

      const settings2 = {
        gameCount: 1,
        fixedNumbers: [45, 46],
        excludedNumbers: [],
      };
      expect(() => SettingsSchema.parse(settings2)).toThrow();
    });
  });

  describe('HistoryEntrySchema', () => {
    it('accepts valid history entry', () => {
      const entry = {
        timestamp: '2026-07-20T10:30:00Z',
        gameCount: 2,
        fixedNumbers: [1],
        excludedNumbers: [],
        games: [
          [1, 7, 18, 34, 41, 44],
          [1, 2, 15, 28, 39, 45],
        ],
      };
      const result = HistoryEntrySchema.parse(entry);
      expect(result).toEqual(entry);
    });

    it('rejects invalid timestamp', () => {
      const entry = {
        timestamp: 'not-a-timestamp',
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [[1, 2, 3, 4, 5, 6]],
      };
      expect(() => HistoryEntrySchema.parse(entry)).toThrow();
    });
  });

  describe('LottoStoreSchema', () => {
    it('accepts valid store', () => {
      const store = {
        version: 1,
        history: [],
        lastSettings: null,
      };
      const result = LottoStoreSchema.parse(store);
      expect(result).toEqual(store);
    });

    it('accepts store with history entries', () => {
      const store = {
        version: 1,
        history: [
          {
            timestamp: '2026-07-20T10:30:00Z',
            gameCount: 2,
            fixedNumbers: [],
            excludedNumbers: [],
            games: [
              [1, 2, 3, 4, 5, 6],
              [7, 8, 9, 10, 11, 12],
            ],
          },
        ],
        lastSettings: {
          gameCount: 2,
          fixedNumbers: [],
          excludedNumbers: [],
        },
      };
      const result = LottoStoreSchema.parse(store);
      expect(result).toEqual(store);
    });

    it('rejects version !== 1', () => {
      const store = {
        version: 2,
        history: [],
        lastSettings: null,
      };
      expect(() => LottoStoreSchema.parse(store)).toThrow();
    });
  });

  describe('parseStore', () => {
    it('parses valid JSON localStorage value', () => {
      const json = JSON.stringify({
        version: 1,
        history: [],
        lastSettings: null,
      });
      const result = parseStore(json);
      expect(result.version).toBe(1);
      expect(result.history).toEqual([]);
    });

    it('returns fresh store on null input', () => {
      const result = parseStore(null);
      expect(result.version).toBe(1);
      expect(result.history).toEqual([]);
      expect(result.lastSettings).toBe(null);
    });

    it('returns fresh store on invalid JSON', () => {
      const result = parseStore('{ invalid json }');
      expect(result.version).toBe(1);
      expect(result.history).toEqual([]);
      expect(result.lastSettings).toBe(null);
    });

    it('returns fresh store on corrupt schema', () => {
      const json = JSON.stringify({
        version: 999,
        history: [],
        lastSettings: null,
      });
      const result = parseStore(json);
      // Should silently fail and return fresh store
      expect(result.version).toBe(1);
      expect(result.history).toEqual([]);
    });

    it('prunes invalid history entries on load', () => {
      const json = JSON.stringify({
        version: 1,
        history: [
          {
            timestamp: '2026-07-20T10:30:00Z',
            gameCount: 1,
            fixedNumbers: [],
            excludedNumbers: [],
            games: [[1, 2, 3, 4, 5, 6]],
          },
          {
            timestamp: 'invalid',
            gameCount: 1,
            fixedNumbers: [],
            excludedNumbers: [],
            games: [[1, 2, 3, 4, 5, 6]],
          },
        ],
        lastSettings: null,
      });
      const result = parseStore(json);
      // Should have 1 valid entry
      expect(result.history.length).toBe(1);
    });
  });
});
