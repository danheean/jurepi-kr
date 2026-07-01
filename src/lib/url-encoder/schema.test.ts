import { describe, it, expect } from 'vitest';
import {
  inputSchema,
  queryTableSchema,
  storeSchema,
  parseStore,
  serializeStore,
  RECENTS_MAX,
  INPUT_MAX_LEN,
} from './schema';

describe('schema.ts', () => {
  describe('inputSchema', () => {
    it('accepts valid input', () => {
      const valid = {
        text: 'hello world',
        direction: 'encode' as const,
        mode: 'component' as const,
        charset: 'utf-8' as const,
      };
      expect(() => inputSchema.parse(valid)).not.toThrow();
    });

    it('defaults charset to utf-8', () => {
      const input = {
        text: 'test',
        direction: 'encode' as const,
        mode: 'component' as const,
      };
      const parsed = inputSchema.parse(input);
      expect(parsed.charset).toBe('utf-8');
    });

    it('rejects text exceeding max length', () => {
      const invalid = {
        text: 'x'.repeat(INPUT_MAX_LEN + 1),
        direction: 'encode' as const,
        mode: 'component' as const,
      };
      expect(() => inputSchema.parse(invalid)).toThrow();
    });

    it('accepts valid direction and mode', () => {
      const valid = {
        text: 'test',
        direction: 'decode' as const,
        mode: 'uri' as const,
      };
      expect(() => inputSchema.parse(valid)).not.toThrow();
    });

    it('accepts euc-kr charset', () => {
      const valid = {
        text: 'test',
        direction: 'encode' as const,
        mode: 'component' as const,
        charset: 'euc-kr' as const,
      };
      expect(() => inputSchema.parse(valid)).not.toThrow();
    });
  });

  describe('queryTableSchema', () => {
    it('accepts valid query table', () => {
      const valid = {
        rows: [
          { key: 'name', value: 'Alice' },
          { key: 'age', value: '30' },
        ],
      };
      expect(() => queryTableSchema.parse(valid)).not.toThrow();
    });

    it('accepts empty rows', () => {
      const valid = { rows: [] };
      expect(() => queryTableSchema.parse(valid)).not.toThrow();
    });

    it('accepts empty values', () => {
      const valid = {
        rows: [{ key: 'foo', value: '' }],
      };
      expect(() => queryTableSchema.parse(valid)).not.toThrow();
    });
  });

  describe('storeSchema', () => {
    it('accepts valid store', () => {
      const valid = {
        version: 1,
        recents: ['hello', 'world'],
        meta: { createdAt: Date.now() },
      };
      expect(() => storeSchema.parse(valid)).not.toThrow();
    });

    it('accepts empty recents', () => {
      const valid = {
        version: 1,
        recents: [],
        meta: { createdAt: Date.now() },
      };
      expect(() => storeSchema.parse(valid)).not.toThrow();
    });
  });

  describe('parseStore', () => {
    it('parses valid JSON', () => {
      const json = JSON.stringify({
        version: 1,
        recents: ['test'],
        meta: { createdAt: 123456 },
      });
      const store = parseStore(json);
      expect(store.recents).toEqual(['test']);
    });

    it('returns default store on invalid JSON', () => {
      const store = parseStore('not json');
      expect(store.recents).toEqual([]);
      expect(store.version).toBe(1);
    });

    it('returns default store on missing fields', () => {
      const store = parseStore('{}');
      expect(store.recents).toEqual([]);
    });

    it('returns default store on invalid structure', () => {
      const json = JSON.stringify({ recents: 'not an array' });
      const store = parseStore(json);
      expect(store.recents).toEqual([]);
    });
  });

  describe('serializeStore', () => {
    it('serializes store to JSON', () => {
      const store = {
        version: 1,
        recents: ['hello', 'world'],
        meta: { createdAt: 123456 },
      };
      const json = serializeStore(store);
      const parsed = JSON.parse(json);
      expect(parsed.recents).toEqual(['hello', 'world']);
    });

    it('round-trips parse → serialize → parse', () => {
      const original = {
        version: 1,
        recents: ['a', 'b', 'c'],
        meta: { createdAt: 9999 },
      };
      const json = serializeStore(original);
      const parsed = parseStore(json);
      expect(parsed).toEqual(original);
    });
  });

  describe('constants', () => {
    it('RECENTS_MAX = 10', () => {
      expect(RECENTS_MAX).toBe(10);
    });

    it('INPUT_MAX_LEN = 10000', () => {
      expect(INPUT_MAX_LEN).toBe(10000);
    });
  });
});
