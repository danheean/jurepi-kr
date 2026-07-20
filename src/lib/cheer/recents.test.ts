import { describe, it, expect } from 'vitest';
import { addRecent, pruneRecents, MAX_RECENTS } from './recents';

describe('recents.ts', () => {
  describe('addRecent', () => {
    it('adds a new message to the front of recents', () => {
      const recents = ['응원!'];
      const result = addRecent(recents, '화이팅!');
      expect(result[0]).toBe('화이팅!');
      expect(result[1]).toBe('응원!');
    });

    it('returns MRU (most-recently-used) order', () => {
      const recents = ['older', 'older2'];
      const result = addRecent(recents, 'newest');
      expect(result[0]).toBe('newest');
      expect(result).toContain('older');
      expect(result).toContain('older2');
    });

    it('deduplicates existing messages', () => {
      const recents = ['응원!', '화이팅!'];
      const result = addRecent(recents, '응원!');
      expect(result.length).toBe(2);
      expect(result[0]).toBe('응원!');
      expect(result[1]).toBe('화이팅!');
    });

    it('caps recents at MAX_RECENTS (10)', () => {
      let recents: string[] = [];
      for (let i = 0; i < MAX_RECENTS + 5; i++) {
        recents = addRecent(recents, `message${i}`);
      }
      expect(recents.length).toBe(MAX_RECENTS);
    });

    it('normalizes message before adding', () => {
      const recents: string[] = [];
      const result = addRecent(recents, '  spaces   everywhere  ');
      expect(result[0]).toBe('spaces everywhere');
    });

    it('rejects invalid messages', () => {
      const recents = ['응원!'];
      // Empty after normalization
      const result = addRecent(recents, '   ');
      expect(result).toEqual(recents);
    });

    it('rejects messages over MAX_LEN', () => {
      const recents = ['응원!'];
      const longMessage = 'a'.repeat(81);
      const result = addRecent(recents, longMessage);
      expect(result).toEqual(recents);
    });

    it('immutably returns new array', () => {
      const recents = ['응원!'];
      const result = addRecent(recents, '화이팅!');
      expect(result).not.toBe(recents);
      expect(recents).toEqual(['응원!']); // original unchanged
    });
  });

  describe('pruneRecents', () => {
    it('filters out non-string values', () => {
      const dirty = ['응원!', null, '화이팅!', undefined, 123];
      const result = pruneRecents(dirty);
      expect(result).toEqual(['응원!', '화이팅!']);
    });

    it('filters out empty strings', () => {
      const dirty = ['응원!', '', '화이팅!'];
      const result = pruneRecents(dirty);
      expect(result).toEqual(['응원!', '화이팅!']);
    });

    it('filters out whitespace-only strings', () => {
      const dirty = ['응원!', '   ', '화이팅!'];
      const result = pruneRecents(dirty);
      expect(result).toEqual(['응원!', '화이팅!']);
    });

    it('returns empty array for non-array input', () => {
      expect(pruneRecents(null)).toEqual([]);
      expect(pruneRecents(undefined)).toEqual([]);
      expect(pruneRecents('not an array')).toEqual([]);
      expect(pruneRecents(123)).toEqual([]);
    });

    it('caps at MAX_RECENTS', () => {
      const dirty = new Array(MAX_RECENTS + 5)
        .fill(null)
        .map((_, i) => `message${i}`);
      const result = pruneRecents(dirty);
      expect(result.length).toBe(MAX_RECENTS);
    });

    it('preserves string order', () => {
      const dirty = ['first', 'second', 'third'];
      const result = pruneRecents(dirty);
      expect(result).toEqual(['first', 'second', 'third']);
    });

    it('returns array type for any input', () => {
      expect(Array.isArray(pruneRecents({}))).toBe(true);
      expect(Array.isArray(pruneRecents(false))).toBe(true);
    });
  });
});
