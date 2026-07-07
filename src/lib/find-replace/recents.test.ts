import { describe, it, expect } from 'vitest';
import {
  pushRecent,
  saveSet,
  removeSet,
  pruneInvalid,
  serializeStore,
  deserializeStore,
} from './recents';
import type { Rule, SavedRuleSet, FindReplaceStore } from './schema';
import { RECENTS_MAX, SAVED_SETS_MAX, STORE_VERSION } from './schema';

describe('recents.ts', () => {
  describe('pushRecent', () => {
    it('adds text to front', () => {
      const list: string[] = [];
      const result = pushRecent(list, 'text1');
      expect(result[0]).toBe('text1');
    });

    it('maintains MRU order', () => {
      let list: string[] = [];
      list = pushRecent(list, 'a');
      list = pushRecent(list, 'b');
      list = pushRecent(list, 'c');
      expect(list).toEqual(['c', 'b', 'a']);
    });

    it('deduplicates on add', () => {
      let list: string[] = ['a', 'b', 'c'];
      list = pushRecent(list, 'b');
      expect(list).toEqual(['b', 'a', 'c']);
      expect(list).toHaveLength(3); // No duplicates
    });

    it('respects max length', () => {
      let list: string[] = [];
      for (let i = 0; i < 15; i++) {
        list = pushRecent(list, `text${i}`, 10);
      }
      expect(list).toHaveLength(10);
      expect(list[0]).toBe('text14'); // Most recent
    });

    it('handles duplicate multiple times', () => {
      let list: string[] = ['a', 'b', 'c'];
      list = pushRecent(list, 'a');
      list = pushRecent(list, 'a');
      expect(list).toEqual(['a', 'b', 'c']);
      expect(list).toHaveLength(3);
    });

    it('returns new array (immutable)', () => {
      const original: string[] = ['a', 'b'];
      const result = pushRecent(original, 'c');
      expect(result).not.toBe(original);
      expect(original).toEqual(['a', 'b']); // Unchanged
    });
  });

  describe('saveSet', () => {
    it('saves a new rule-set', () => {
      const sets: SavedRuleSet[] = [];
      const rules: Rule[] = [
        {
          id: '1',
          find: 'a',
          replace: 'b',
          isRegex: false,
          caseSensitive: true,
          wholeWord: false,
          firstOnly: false,
          enabled: true,
        },
      ];
      const result = saveSet(sets, 'My Rules', rules);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Rules');
      expect(result[0].rules).toHaveLength(1);
    });

    it('replaces existing set with same name', () => {
      const rules1 = [
        {
          id: '1',
          find: 'a',
          replace: 'b',
          isRegex: false,
          caseSensitive: true,
          wholeWord: false,
          firstOnly: false,
          enabled: true,
        },
      ];
      const rules2 = [
        {
          id: '2',
          find: 'x',
          replace: 'y',
          isRegex: false,
          caseSensitive: true,
          wholeWord: false,
          firstOnly: false,
          enabled: true,
        },
      ];

      let sets = saveSet([], 'MySet', rules1);
      expect(sets).toHaveLength(1);

      sets = saveSet(sets, 'MySet', rules2);
      expect(sets).toHaveLength(1); // Still 1 (replacement)
      expect(sets[0].rules[0].find).toBe('x'); // Updated
    });

    it('maintains multiple sets', () => {
      const rule = [
        {
          id: '1',
          find: 'a',
          replace: 'b',
          isRegex: false,
          caseSensitive: true,
          wholeWord: false,
          firstOnly: false,
          enabled: true,
        },
      ];

      let sets = saveSet([], 'Set1', rule);
      sets = saveSet(sets, 'Set2', rule);
      sets = saveSet(sets, 'Set3', rule);
      expect(sets).toHaveLength(3);
    });

    it('enforces max saved sets', () => {
      const rule: Rule[] = [];
      let sets: SavedRuleSet[] = [];

      for (let i = 0; i < SAVED_SETS_MAX + 10; i++) {
        sets = saveSet(sets, `Set${i}`, rule);
      }

      expect(sets.length).toBeLessThanOrEqual(SAVED_SETS_MAX);
    });

    it('returns new array (immutable)', () => {
      const original: SavedRuleSet[] = [];
      const result = saveSet(original, 'test', []);
      expect(result).not.toBe(original);
    });

    it('deep-copies rules', () => {
      const originalRules: Rule[] = [
        {
          id: '1',
          find: 'a',
          replace: 'b',
          isRegex: false,
          caseSensitive: true,
          wholeWord: false,
          firstOnly: false,
          enabled: true,
        },
      ];

      const sets = saveSet([], 'test', originalRules);
      originalRules[0].find = 'changed';
      expect(sets[0].rules[0].find).toBe('a'); // Saved copy unchanged
    });
  });

  describe('removeSet', () => {
    it('removes set by name', () => {
      const sets: SavedRuleSet[] = [
        { name: 'Set1', rules: [] },
        { name: 'Set2', rules: [] },
        { name: 'Set3', rules: [] },
      ];

      const result = removeSet(sets, 'Set2');
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.name)).toEqual(['Set1', 'Set3']);
    });

    it('handles non-existent name', () => {
      const sets: SavedRuleSet[] = [{ name: 'Set1', rules: [] }];
      const result = removeSet(sets, 'NonExistent');
      expect(result).toHaveLength(1); // Unchanged
    });

    it('returns new array (immutable)', () => {
      const original: SavedRuleSet[] = [{ name: 'Set1', rules: [] }];
      const result = removeSet(original, 'Set1');
      expect(result).not.toBe(original);
      expect(original).toHaveLength(1); // Unchanged
    });
  });

  describe('pruneInvalid', () => {
    it('keeps valid store', () => {
      const store: FindReplaceStore = {
        version: STORE_VERSION,
        savedSets: [],
        recents: ['valid'],
        meta: { createdAt: Date.now() },
      };

      const result = pruneInvalid(store);
      expect(result.recents).toEqual(['valid']);
    });

    it('removes invalid recents', () => {
      const store = {
        version: STORE_VERSION,
        savedSets: [],
        recents: ['valid', null, undefined, 'valid2'] as any,
        meta: { createdAt: Date.now() },
      };

      const result = pruneInvalid(store);
      // Invalid entries should be filtered
      expect(result.recents.every((r: any) => typeof r === 'string')).toBe(true);
    });

    it('returns new store (immutable)', () => {
      const original: FindReplaceStore = {
        version: STORE_VERSION,
        savedSets: [],
        recents: [],
        meta: { createdAt: Date.now() },
      };

      const result = pruneInvalid(original);
      expect(result).not.toBe(original);
    });
  });

  describe('serializeStore / deserializeStore round-trip', () => {
    it('round-trips store', () => {
      const original: FindReplaceStore = {
        version: STORE_VERSION,
        savedSets: [
          {
            name: 'Test',
            rules: [
              {
                id: '1',
                find: 'a',
                replace: 'b',
                isRegex: false,
                caseSensitive: false,
                wholeWord: false,
                firstOnly: false,
                enabled: true,
              },
            ],
          },
        ],
        recents: ['text1', 'text2'],
        meta: { createdAt: 123456 },
      };

      const json = serializeStore(original);
      const restored = deserializeStore(json);
      expect(restored).toEqual(original);
    });

    it('deserializeStore returns empty on invalid JSON', () => {
      const result = deserializeStore('not valid json');
      expect(result.version).toBe(STORE_VERSION);
      expect(result.savedSets).toHaveLength(0);
      expect(result.recents).toHaveLength(0);
    });
  });
});
