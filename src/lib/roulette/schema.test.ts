import { describe, it, expect } from 'vitest';
import {
  OptionSchema,
  OptionSetSchema,
  RouletteStoreSchema,
  parseStore,
  STORE_VERSION,
  MIN_OPTIONS,
  MAX_OPTIONS,
  MIN_WEIGHT,
  MAX_WEIGHT,
  LEGEND_THRESHOLD,
  SPIN_DURATION_MS,
  CONFETTI_COUNT,
} from './schema';

describe('schema.ts', () => {
  describe('OptionSchema', () => {
    it('validates a valid option', () => {
      const opt = { label: 'Pizza', weight: 1 };
      const result = OptionSchema.safeParse(opt);
      expect(result.success).toBe(true);
    });

    it('rejects empty label', () => {
      const opt = { label: '', weight: 1 };
      const result = OptionSchema.safeParse(opt);
      expect(result.success).toBe(false);
    });

    it('rejects label > 50 chars', () => {
      const opt = { label: 'a'.repeat(51), weight: 1 };
      const result = OptionSchema.safeParse(opt);
      expect(result.success).toBe(false);
    });

    it('accepts label = 50 chars exactly', () => {
      const opt = { label: 'a'.repeat(50), weight: 1 };
      const result = OptionSchema.safeParse(opt);
      expect(result.success).toBe(true);
    });

    it('rejects weight < 1', () => {
      const opt = { label: 'Pizza', weight: 0 };
      const result = OptionSchema.safeParse(opt);
      expect(result.success).toBe(false);
    });

    it('rejects weight > 1000', () => {
      const opt = { label: 'Pizza', weight: 1001 };
      const result = OptionSchema.safeParse(opt);
      expect(result.success).toBe(false);
    });

    it('accepts weight = 1 (MIN_WEIGHT)', () => {
      const opt = { label: 'Pizza', weight: 1 };
      const result = OptionSchema.safeParse(opt);
      expect(result.success).toBe(true);
    });

    it('accepts weight = 1000 (MAX_WEIGHT)', () => {
      const opt = { label: 'Pizza', weight: 1000 };
      const result = OptionSchema.safeParse(opt);
      expect(result.success).toBe(true);
    });

    it('rejects non-integer weight', () => {
      const opt = { label: 'Pizza', weight: 1.5 };
      const result = OptionSchema.safeParse(opt);
      expect(result.success).toBe(false);
    });
  });

  describe('OptionSetSchema', () => {
    it('validates a valid option set', () => {
      const set = {
        name: 'Lunch',
        options: [
          { label: 'Pizza', weight: 1 },
          { label: 'Pasta', weight: 2 },
        ],
        createdAt: Date.now(),
      };
      const result = OptionSetSchema.safeParse(set);
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const set = {
        name: '',
        options: [{ label: 'Pizza', weight: 1 }],
        createdAt: Date.now(),
      };
      const result = OptionSetSchema.safeParse(set);
      expect(result.success).toBe(false);
    });

    it('rejects name > 50 chars', () => {
      const set = {
        name: 'a'.repeat(51),
        options: [{ label: 'Pizza', weight: 1 }],
        createdAt: Date.now(),
      };
      const result = OptionSetSchema.safeParse(set);
      expect(result.success).toBe(false);
    });

    it('accepts name = 50 chars exactly', () => {
      const set = {
        name: 'a'.repeat(50),
        options: [{ label: 'Pizza', weight: 1 }],
        createdAt: Date.now(),
      };
      const result = OptionSetSchema.safeParse(set);
      expect(result.success).toBe(true);
    });

    it('rejects empty options array', () => {
      const set = {
        name: 'Lunch',
        options: [],
        createdAt: Date.now(),
      };
      const result = OptionSetSchema.safeParse(set);
      expect(result.success).toBe(false);
    });

    it('accepts createdAt as timestamp number', () => {
      const now = Date.now();
      const set = {
        name: 'Lunch',
        options: [{ label: 'Pizza', weight: 1 }],
        createdAt: now,
      };
      const result = OptionSetSchema.safeParse(set);
      expect(result.success).toBe(true);
    });
  });

  describe('RouletteStoreSchema', () => {
    it('validates a valid store', () => {
      const store = {
        version: 1,
        sets: {
          lunch: {
            name: 'Lunch',
            options: [{ label: 'Pizza', weight: 1 }],
            createdAt: Date.now(),
          },
        },
        lastSetName: 'lunch',
      };
      const result = RouletteStoreSchema.safeParse(store);
      expect(result.success).toBe(true);
    });

    it('rejects version !== 1', () => {
      const store = {
        version: 2,
        sets: {},
        lastSetName: null,
      };
      const result = RouletteStoreSchema.safeParse(store);
      expect(result.success).toBe(false);
    });

    it('accepts empty sets record', () => {
      const store = {
        version: 1,
        sets: {},
        lastSetName: null,
      };
      const result = RouletteStoreSchema.safeParse(store);
      expect(result.success).toBe(true);
    });

    it('accepts lastSetName = null', () => {
      const store = {
        version: 1,
        sets: {},
        lastSetName: null,
      };
      const result = RouletteStoreSchema.safeParse(store);
      expect(result.success).toBe(true);
    });

    it('accepts lastSetName as string', () => {
      const store = {
        version: 1,
        sets: {
          lunch: {
            name: 'Lunch',
            options: [{ label: 'Pizza', weight: 1 }],
            createdAt: Date.now(),
          },
        },
        lastSetName: 'lunch',
      };
      const result = RouletteStoreSchema.safeParse(store);
      expect(result.success).toBe(true);
    });
  });

  describe('parseStore', () => {
    it('parses valid JSON string', () => {
      const store = {
        version: 1,
        sets: {},
        lastSetName: null,
      };
      const result = parseStore(JSON.stringify(store));
      expect(result.version).toBe(1);
      expect(result.lastSetName).toBe(null);
    });

    it('returns fresh store on null input', () => {
      const result = parseStore(null);
      expect(result.version).toBe(1);
      expect(result.sets).toEqual({});
      expect(result.lastSetName).toBeNull();
    });

    it('returns fresh store on invalid JSON', () => {
      const result = parseStore('invalid json {');
      expect(result.version).toBe(1);
      expect(result.sets).toEqual({});
      expect(result.lastSetName).toBeNull();
    });

    it('returns fresh store on zod validation failure', () => {
      const badStore = JSON.stringify({
        version: 2, // invalid version
        sets: {},
        lastSetName: null,
      });
      const result = parseStore(badStore);
      expect(result.version).toBe(1);
      expect(result.sets).toEqual({});
      expect(result.lastSetName).toBeNull();
    });

    it('does not throw on any input', () => {
      expect(() => parseStore(null)).not.toThrow();
      expect(() => parseStore('invalid')).not.toThrow();
      expect(() => parseStore('{}')).not.toThrow();
    });
  });

  describe('constants', () => {
    it('exports expected constant values', () => {
      expect(STORE_VERSION).toBe(1);
      expect(MIN_OPTIONS).toBe(2);
      expect(MAX_OPTIONS).toBe(30);
      expect(MIN_WEIGHT).toBe(1);
      expect(MAX_WEIGHT).toBe(1000);
      expect(LEGEND_THRESHOLD).toBe(16);
      expect(SPIN_DURATION_MS).toBe(4000);
      expect(CONFETTI_COUNT).toBe(50);
    });
  });
});
