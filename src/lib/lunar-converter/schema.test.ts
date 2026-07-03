import { describe, it, expect } from 'vitest';
import { parseRecentsStore, RecentsStoreSchema } from './schema';
import type { RecentsStore } from './schema';

describe('schema', () => {
  describe('RecentsStoreSchema', () => {
    it('accepts a valid store', () => {
      const valid: RecentsStore = {
        version: 1,
        entries: [
          { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
          { solarDate: '2024-10-18', lunarDate: '2024-09-16', ts: 2000 },
        ],
      };
      const result = RecentsStoreSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid version', () => {
      const invalid = {
        version: 2, // wrong version
        entries: [],
      };
      const result = RecentsStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects non-array entries', () => {
      const invalid = {
        version: 1,
        entries: 'not an array',
      };
      const result = RecentsStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects entries with missing fields', () => {
      const invalid = {
        version: 1,
        entries: [
          { solarDate: '2024-03-15', lunarDate: '2024-02-06' }, // missing ts
        ],
      };
      const result = RecentsStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts empty entries array', () => {
      const valid: RecentsStore = {
        version: 1,
        entries: [],
      };
      const result = RecentsStoreSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('parseRecentsStore', () => {
    it('parses valid JSON', () => {
      const result = parseRecentsStore({
        version: 1,
        entries: [{ solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 }],
      });
      expect(result.version).toBe(1);
      expect(result.entries).toHaveLength(1);
    });

    it('returns fresh store on invalid input', () => {
      const result = parseRecentsStore({ version: 2, entries: [] });
      expect(result.version).toBe(1);
      expect(result.entries).toHaveLength(0);
    });

    it('returns fresh store on null input', () => {
      const result = parseRecentsStore(null);
      expect(result.version).toBe(1);
      expect(result.entries).toHaveLength(0);
    });

    it('returns fresh store on undefined input', () => {
      const result = parseRecentsStore(undefined);
      expect(result.version).toBe(1);
      expect(result.entries).toHaveLength(0);
    });

    it('returns fresh store on non-object input', () => {
      const result = parseRecentsStore('not an object');
      expect(result.version).toBe(1);
      expect(result.entries).toHaveLength(0);
    });
  });
});
