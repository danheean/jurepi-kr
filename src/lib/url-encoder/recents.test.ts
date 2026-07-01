import { describe, it, expect } from 'vitest';
import {
  pushRecent,
  pruneUnknown,
  serializeRecents,
  deserializeRecents,
} from './recents';

describe('recents.ts', () => {
  describe('pushRecent', () => {
    it('adds item to front of list', () => {
      const list = ['b', 'c'];
      const result = pushRecent(list, 'a');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('deduplicates: removes existing item before prepending', () => {
      const list = ['a', 'b', 'c'];
      const result = pushRecent(list, 'b');
      expect(result).toEqual(['b', 'a', 'c']);
    });

    it('truncates to max length', () => {
      const list = Array.from({ length: 10 }, (_, i) => `item${i}`);
      const result = pushRecent(list, 'new', 5);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe('new');
    });

    it('defaults max to 10', () => {
      const list = Array.from({ length: 10 }, (_, i) => `item${i}`);
      const result = pushRecent(list, 'new');
      expect(result).toHaveLength(10);
      expect(result[0]).toBe('new');
    });

    it('handles empty list', () => {
      const result = pushRecent([], 'first');
      expect(result).toEqual(['first']);
    });

    it('returns immutable copy', () => {
      const list = ['a', 'b'];
      const result = pushRecent(list, 'c');
      expect(list).toEqual(['a', 'b']); // Original unchanged
      expect(result).toEqual(['c', 'a', 'b']);
    });

    it('dedupes and keeps order on existing item', () => {
      const list = ['a', 'b', 'c', 'd'];
      const result = pushRecent(list, 'c');
      expect(result).toEqual(['c', 'a', 'b', 'd']);
    });

    it('handles duplicate in new list position', () => {
      const list = ['a', 'b', 'c'];
      const result = pushRecent(list, 'a');
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('pruneUnknown', () => {
    it('filters non-string items', () => {
      const list = ['a', 123, 'b', null, 'c'];
      const result = pruneUnknown(list);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('filters empty strings', () => {
      const list = ['a', '', 'b', 'c'];
      const result = pruneUnknown(list);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('returns empty array for non-array input', () => {
      expect(pruneUnknown(null as any)).toEqual([]);
      expect(pruneUnknown(undefined as any)).toEqual([]);
      expect(pruneUnknown('not an array' as any)).toEqual([]);
      expect(pruneUnknown({} as any)).toEqual([]);
    });

    it('returns empty array for empty array', () => {
      expect(pruneUnknown([])).toEqual([]);
    });

    it('preserves valid strings', () => {
      const list = ['hello', 'world', 'test'];
      expect(pruneUnknown(list)).toEqual(list);
    });

    it('filters objects and functions', () => {
      const list = ['a', { key: 'value' }, () => {}, 'b'];
      const result = pruneUnknown(list);
      expect(result).toEqual(['a', 'b']);
    });
  });

  describe('serializeRecents', () => {
    it('serializes array to JSON string', () => {
      const recents = ['hello', 'world'];
      const json = serializeRecents(recents);
      expect(JSON.parse(json)).toEqual(['hello', 'world']);
    });

    it('handles empty array', () => {
      const json = serializeRecents([]);
      expect(JSON.parse(json)).toEqual([]);
    });

    it('handles special characters in strings', () => {
      const recents = ['hello "world"', 'test\nline'];
      const json = serializeRecents(recents);
      expect(JSON.parse(json)).toEqual(recents);
    });

    it('handles unicode strings', () => {
      const recents = ['안녕', '😊', 'café'];
      const json = serializeRecents(recents);
      expect(JSON.parse(json)).toEqual(recents);
    });
  });

  describe('deserializeRecents', () => {
    it('parses valid JSON array', () => {
      const json = JSON.stringify(['hello', 'world']);
      const result = deserializeRecents(json);
      expect(result).toEqual(['hello', 'world']);
    });

    it('returns empty array on invalid JSON', () => {
      expect(deserializeRecents('not json')).toEqual([]);
      expect(deserializeRecents('{')).toEqual([]);
      expect(deserializeRecents('')).toEqual([]);
    });

    it('prunes invalid entries after parse', () => {
      const json = JSON.stringify(['valid', '', null, 123, 'another']);
      const result = deserializeRecents(json);
      expect(result).toEqual(['valid', 'another']);
    });

    it('handles non-array JSON', () => {
      expect(deserializeRecents('null')).toEqual([]);
      expect(deserializeRecents('123')).toEqual([]);
      expect(deserializeRecents('"string"')).toEqual([]);
    });
  });

  describe('round-trip: serialize → deserialize', () => {
    it('preserves data on round-trip', () => {
      const original = ['hello', 'world', '안녕', '😊'];
      const json = serializeRecents(original);
      const deserialized = deserializeRecents(json);
      expect(deserialized).toEqual(original);
    });

    it('round-trips empty list', () => {
      const json = serializeRecents([]);
      const deserialized = deserializeRecents(json);
      expect(deserialized).toEqual([]);
    });

    it('round-trips special characters', () => {
      const original = ['a/b', 'c%20d', 'e=f&g=h'];
      const json = serializeRecents(original);
      const deserialized = deserializeRecents(json);
      expect(deserialized).toEqual(original);
    });
  });

  describe('integration: push → serialize → deserialize → push', () => {
    it('works through full lifecycle', () => {
      let recents: string[] = [];

      // Push items
      recents = pushRecent(recents, 'item1');
      recents = pushRecent(recents, 'item2');

      // Serialize
      const json = serializeRecents(recents);

      // Deserialize
      let restored = deserializeRecents(json);

      // Push more items
      restored = pushRecent(restored, 'item3');

      expect(restored).toEqual(['item3', 'item2', 'item1']);
    });

    it('dedupes across serialize/deserialize boundary', () => {
      let recents = ['a', 'b', 'c'];
      const json = serializeRecents(recents);
      recents = deserializeRecents(json);
      recents = pushRecent(recents, 'b'); // Dedupe
      expect(recents).toEqual(['b', 'a', 'c']);
    });
  });

  describe('max 10 recents constraint', () => {
    it('enforces RECENTS_MAX=10 on pushRecent', () => {
      let recents: string[] = [];
      for (let i = 1; i <= 15; i++) {
        recents = pushRecent(recents, `item${i}`);
      }
      expect(recents).toHaveLength(10);
      expect(recents[0]).toBe('item15');
      expect(recents[9]).toBe('item6');
    });

    it('maintains max on repeated pushes', () => {
      let recents: string[] = [];
      for (let i = 1; i <= 100; i++) {
        recents = pushRecent(recents, `item${i}`);
      }
      expect(recents).toHaveLength(10);
      expect(recents[0]).toBe('item100');
    });
  });
});
