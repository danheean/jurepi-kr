import { describe, it, expect } from 'vitest';
import {
  ruleSchema,
  storeSchema,
  parseStore,
  serializeStore,
  STORE_VERSION,
  RECENTS_MAX,
  SAVED_SETS_MAX,
} from './schema';
import type { Rule, FindReplaceStore } from './schema';

describe('schema.ts', () => {
  describe('ruleSchema validation', () => {
    it('accepts valid rule with defaults', () => {
      const rule = {
        id: '1',
        find: 'hello',
        replace: 'world',
      };
      const result = ruleSchema.parse(rule);
      expect(result.isRegex).toBe(false);
      expect(result.caseSensitive).toBe(false);
      expect(result.wholeWord).toBe(false);
      expect(result.firstOnly).toBe(false);
      expect(result.enabled).toBe(true);
    });

    it('rejects rule with empty id', () => {
      const rule = {
        id: '',
        find: 'hello',
        replace: 'world',
      };
      expect(() => ruleSchema.parse(rule)).toThrow();
    });

    it('accepts rule with all options', () => {
      const rule: Rule = {
        id: '1',
        find: '(\\d+)',
        replace: '$1',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: true,
        flags: 'im',
        enabled: true,
      };
      const result = ruleSchema.parse(rule);
      expect(result.flags).toBe('im');
      expect(result.isRegex).toBe(true);
    });
  });

  describe('storeSchema validation', () => {
    it('accepts valid store', () => {
      const store = {
        version: STORE_VERSION,
        savedSets: [],
        recents: ['text1', 'text2'],
        meta: { createdAt: Date.now() },
      };
      const result = storeSchema.parse(store);
      expect(result.version).toBe(STORE_VERSION);
      expect(result.recents).toHaveLength(2);
    });

    it('accepts store with rules in savedSets', () => {
      const store = {
        version: STORE_VERSION,
        savedSets: [
          {
            name: 'My Rules',
            rules: [
              { id: '1', find: 'a', replace: 'b', isRegex: false, caseSensitive: false, wholeWord: false, firstOnly: false, enabled: true },
            ],
          },
        ],
        recents: [],
        meta: { createdAt: Date.now() },
      };
      const result = storeSchema.parse(store);
      expect(result.savedSets[0].rules).toHaveLength(1);
    });

    it('enforces max recents length', () => {
      const store = {
        version: STORE_VERSION,
        savedSets: [],
        recents: Array.from({ length: RECENTS_MAX + 1 }, (_, i) => `text${i}`),
        meta: { createdAt: Date.now() },
      };
      expect(() => storeSchema.parse(store)).toThrow();
    });

    it('enforces max saved sets length', () => {
      const store = {
        version: STORE_VERSION,
        savedSets: Array.from({ length: SAVED_SETS_MAX + 1 }, (_, i) => ({
          name: `Set ${i}`,
          rules: [],
        })),
        recents: [],
        meta: { createdAt: Date.now() },
      };
      expect(() => storeSchema.parse(store)).toThrow();
    });
  });

  describe('parseStore', () => {
    it('parses valid JSON store', () => {
      const store: FindReplaceStore = {
        version: STORE_VERSION,
        savedSets: [],
        recents: ['test'],
        meta: { createdAt: 123456 },
      };
      const json = JSON.stringify(store);
      const result = parseStore(json);
      expect(result.recents).toEqual(['test']);
    });

    it('returns empty store on invalid JSON', () => {
      const result = parseStore('not valid json');
      expect(result.version).toBe(STORE_VERSION);
      expect(result.savedSets).toHaveLength(0);
      expect(result.recents).toHaveLength(0);
    });

    it('returns empty store on validation error', () => {
      const json = JSON.stringify({ version: 'invalid', savedSets: null });
      const result = parseStore(json);
      expect(result.version).toBe(STORE_VERSION);
      expect(result.savedSets).toHaveLength(0);
    });
  });

  describe('serializeStore', () => {
    it('serializes store to JSON', () => {
      const store: FindReplaceStore = {
        version: STORE_VERSION,
        savedSets: [],
        recents: ['test1', 'test2'],
        meta: { createdAt: 123456 },
      };
      const json = serializeStore(store);
      const parsed = JSON.parse(json);
      expect(parsed.recents).toEqual(['test1', 'test2']);
    });

    it('round-trips through parse/serialize', () => {
      const store: FindReplaceStore = {
        version: STORE_VERSION,
        savedSets: [
          {
            name: 'test',
            rules: [
              { id: '1', find: 'a', replace: 'b', isRegex: false, caseSensitive: false, wholeWord: false, firstOnly: false, enabled: true },
            ],
          },
        ],
        recents: ['text'],
        meta: { createdAt: 123456 },
      };
      const json = serializeStore(store);
      const parsed = parseStore(json);
      expect(parsed).toEqual(store);
    });
  });
});
