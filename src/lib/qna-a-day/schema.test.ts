import { describe, it, expect } from 'vitest';
import { STORE_VERSION, EntrySchema, StoreSchema, migrate } from './schema';

describe('schema — zod validation', () => {
  describe('EntrySchema', () => {
    it('accepts a valid entry', () => {
      const entry = {
        date: '2026-06-30',
        questionKey: '06-30',
        text: 'My answer',
        createdAt: 1000,
        updatedAt: 2000,
      };
      expect(() => EntrySchema.parse(entry)).not.toThrow();
    });

    it('rejects invalid dateKey format', () => {
      const entry = {
        date: 'invalid',
        questionKey: '06-30',
        text: 'answer',
        createdAt: 1000,
        updatedAt: 2000,
      };
      expect(() => EntrySchema.parse(entry)).toThrow();
    });

    it('rejects invalid questionKey format', () => {
      const entry = {
        date: '2026-06-30',
        questionKey: 'invalid',
        text: 'answer',
        createdAt: 1000,
        updatedAt: 2000,
      };
      expect(() => EntrySchema.parse(entry)).toThrow();
    });

    it('rejects text over 4000 chars', () => {
      const entry = {
        date: '2026-06-30',
        questionKey: '06-30',
        text: 'a'.repeat(4001),
        createdAt: 1000,
        updatedAt: 2000,
      };
      expect(() => EntrySchema.parse(entry)).toThrow();
    });

    it('accepts text up to 4000 chars', () => {
      const entry = {
        date: '2026-06-30',
        questionKey: '06-30',
        text: 'a'.repeat(4000),
        createdAt: 1000,
        updatedAt: 2000,
      };
      expect(() => EntrySchema.parse(entry)).not.toThrow();
    });

    it('rejects negative timestamps', () => {
      const entry = {
        date: '2026-06-30',
        questionKey: '06-30',
        text: 'answer',
        createdAt: -1,
        updatedAt: 2000,
      };
      expect(() => EntrySchema.parse(entry)).toThrow();
    });

    it('rejects non-integer timestamps', () => {
      const entry = {
        date: '2026-06-30',
        questionKey: '06-30',
        text: 'answer',
        createdAt: 1000.5,
        updatedAt: 2000,
      };
      expect(() => EntrySchema.parse(entry)).toThrow();
    });
  });

  describe('StoreSchema', () => {
    it('accepts a valid store', () => {
      const store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'answer',
            createdAt: 1000,
            updatedAt: 2000,
          },
        },
        meta: {
          createdAt: 1000,
          lastBackupAt: 2000,
        },
      };
      expect(() => StoreSchema.parse(store)).not.toThrow();
    });

    it('accepts optional meta fields', () => {
      const store = {
        version: 1,
        entries: {},
        meta: {
          createdAt: 1000,
        },
      };
      expect(() => StoreSchema.parse(store)).not.toThrow();
    });

    it('rejects invalid entry keys', () => {
      const store = {
        version: 1,
        entries: {
          'invalid-key': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'answer',
            createdAt: 1000,
            updatedAt: 2000,
          },
        },
        meta: { createdAt: 1000 },
      };
      expect(() => StoreSchema.parse(store)).toThrow();
    });

    it('rejects version < 1', () => {
      const store = {
        version: 0,
        entries: {},
        meta: { createdAt: 1000 },
      };
      expect(() => StoreSchema.parse(store)).toThrow();
    });

    it('rejects missing meta.createdAt', () => {
      const store = {
        version: 1,
        entries: {},
        meta: {},
      };
      expect(() => StoreSchema.parse(store)).toThrow();
    });

    it('rejects negative meta.createdAt', () => {
      const store = {
        version: 1,
        entries: {},
        meta: { createdAt: -1 },
      };
      expect(() => StoreSchema.parse(store)).toThrow();
    });
  });

  describe('migrate', () => {
    it('accepts and passes through v1 stores', () => {
      const raw = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'answer',
            createdAt: 1000,
            updatedAt: 2000,
          },
        },
        meta: { createdAt: 1000 },
      };

      const migrated = migrate(raw);
      expect(migrated.version).toBe(1);
      expect(migrated.entries['2026-06-30'].text).toBe('answer');
    });

    it('throws on invalid schema', () => {
      const raw = {
        version: 1,
        entries: 'invalid',
        meta: { createdAt: 1000 },
      };

      expect(() => migrate(raw)).toThrow();
    });

    it('throws on missing required fields', () => {
      const raw = {
        version: 1,
        entries: {},
        // Missing meta
      };

      expect(() => migrate(raw)).toThrow();
    });
  });

  describe('STORE_VERSION', () => {
    it('is set to 1', () => {
      expect(STORE_VERSION).toBe(1);
    });
  });
});
