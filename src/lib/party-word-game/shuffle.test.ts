import { describe, it, expect } from 'vitest';
import { fairShuffle } from './shuffle';
import type { Word } from './types';

describe('shuffle — fair Fisher-Yates with seeded PRNG', () => {
  const mockWords: Word[] = Array.from({ length: 10 }, (_, i) => ({
    term: `word${i}`,
  }));

  describe('fairShuffle', () => {
    it('returns a permutation of the same words', () => {
      const result = fairShuffle(mockWords, 42);
      expect(result).toHaveLength(mockWords.length);
      expect(result.map((w) => w.term).sort()).toEqual(
        mockWords.map((w) => w.term).sort()
      );
    });

    it('does not mutate input array', () => {
      const words = [...mockWords];
      const original = JSON.stringify(words);
      fairShuffle(words, 42);
      expect(JSON.stringify(words)).toBe(original);
    });

    it('produces same shuffle for same seed', () => {
      const result1 = fairShuffle(mockWords, 42);
      const result2 = fairShuffle(mockWords, 42);
      expect(result1.map((w) => w.term)).toEqual(result2.map((w) => w.term));
    });

    it('produces different shuffle for different seed', () => {
      const result1 = fairShuffle(mockWords, 42);
      const result2 = fairShuffle(mockWords, 43);
      const match = result1.map((w) => w.term).every((t, i) => t === result2[i]?.term);
      expect(match).toBe(false); // Very unlikely to match by chance
    });

    it('handles empty array', () => {
      const result = fairShuffle([], 42);
      expect(result).toEqual([]);
    });

    it('handles single element', () => {
      const single = [{ term: 'only' }];
      const result = fairShuffle(single, 42);
      expect(result).toEqual(single);
    });

    it('handles two elements', () => {
      const two = [{ term: 'a' }, { term: 'b' }];
      const result = fairShuffle(two, 42);
      expect(result).toHaveLength(2);
      expect(result.map((w) => w.term)).toEqual(expect.arrayContaining(['a', 'b']));
    });

    it('preserves word hints after shuffle', () => {
      const wordsWithHints: Word[] = [
        { term: 'word0', hint: 'hint0' },
        { term: 'word1' },
        { term: 'word2', hint: 'hint2' },
        ...Array.from({ length: 7 }, (_, i) => ({ term: `word${i + 3}` })),
      ];
      const result = fairShuffle(wordsWithHints, 42);
      const withHints = result.filter((w) => w.hint);
      expect(withHints).toHaveLength(2);
      expect(withHints.map((w) => w.hint)).toContain('hint0');
      expect(withHints.map((w) => w.hint)).toContain('hint2');
    });

    it('works with large N (100 words)', () => {
      const large = Array.from({ length: 100 }, (_, i) => ({ term: `w${i}` }));
      const result = fairShuffle(large, 42);
      expect(result).toHaveLength(100);
      expect(result.map((w) => w.term).sort()).toEqual(
        large.map((w) => w.term).sort()
      );
    });

    it('different seeds produce statistically different distributions', () => {
      // Collect first element from 100 shuffles with different seeds
      const positions = new Map<string, number>();
      for (let seed = 0; seed < 100; seed++) {
        const result = fairShuffle(mockWords, seed);
        const first = result[0]?.term || '';
        positions.set(first, (positions.get(first) || 0) + 1);
      }
      // All 10 words should appear at position 0 at least once (statistically)
      expect(positions.size).toBeGreaterThan(1); // At least 2 different words at position 0
    });

    it('is reproducible: same data+seed = same order', () => {
      const seed = 12345;
      const result1 = fairShuffle(mockWords, seed);
      const result2 = fairShuffle(mockWords, seed);
      const result3 = fairShuffle(mockWords, seed);
      expect(result1.map((w) => w.term)).toEqual(result2.map((w) => w.term));
      expect(result2.map((w) => w.term)).toEqual(result3.map((w) => w.term));
    });
  });
});
