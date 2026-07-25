import { describe, it, expect } from 'vitest';
import { mergePair, validatePair } from './merge';
import type { DeckFile } from './schema';

describe('merge — pair merging & validation', () => {
  const mockKoFront: DeckFile = {
    title: '동작 A',
    category: 'actions',
    difficulty: 'easy',
    words: Array.from({ length: 10 }, (_, i) => ({
      term: `action${i}`,
      hint: i === 0 ? 'hint0' : undefined,
    })),
  };

  const mockEnFront: DeckFile = {
    title: 'Actions A',
    words: Array.from({ length: 10 }, (_, i) => ({
      term: `Action${i}`,
    })),
  };

  describe('mergePair', () => {
    it('returns merged deck with ko canonical category/difficulty/words', () => {
      const result = mergePair(mockKoFront, mockEnFront, 'actions-a');
      expect(result.category).toBe('actions');
      expect(result.difficulty).toBe('easy');
      expect(result.words).toEqual(mockKoFront.words);
    });

    it('sets slug from parameter', () => {
      const result = mergePair(mockKoFront, mockEnFront, 'actions-a');
      expect(result.slug).toBe('actions-a');
    });

    it('uses ko title for ko locale', () => {
      const result = mergePair(mockKoFront, mockEnFront, 'actions-a');
      expect(result.ko.title).toBe('동작 A');
    });

    it('uses en title from en front', () => {
      const result = mergePair(mockKoFront, mockEnFront, 'actions-a');
      expect(result.en.title).toBe('Actions A');
    });

    it('uses ko words for canonical words field', () => {
      const result = mergePair(mockKoFront, mockEnFront, 'actions-a');
      expect(result.words).toBe(mockKoFront.words);
    });

    it('uses ko words in ko.words', () => {
      const result = mergePair(mockKoFront, mockEnFront, 'actions-a');
      expect(result.ko.words).toBe(mockKoFront.words);
    });

    it('uses en words in en.words if present', () => {
      const result = mergePair(mockKoFront, mockEnFront, 'actions-a');
      expect(result.en.words).toBe(mockEnFront.words);
    });

    it('inherits ko words to en.words if en.words absent', () => {
      const enFrontNoWords: DeckFile = {
        title: 'Actions A',
      };
      const result = mergePair(mockKoFront, enFrontNoWords, 'actions-a');
      expect(result.en.words).toBe(mockKoFront.words);
    });

    it('preserves word hints', () => {
      const result = mergePair(mockKoFront, mockEnFront, 'actions-a');
      expect(result.words[0]?.hint).toBe('hint0');
      expect(result.words[1]?.hint).toBeUndefined();
    });
  });

  describe('validatePair', () => {
    it('returns { deck, errors: [] } for valid pair', () => {
      const result = validatePair(mockKoFront, mockEnFront, 'actions-a.md', 'actions-a_en.md');
      expect(result.errors).toHaveLength(0);
      expect(result.deck).not.toBeNull();
    });

    it('rejects if ko missing title', () => {
      const koFront: DeckFile = { ...mockKoFront, title: '' };
      const result = validatePair(koFront, mockEnFront, 'actions-a.md', 'actions-a_en.md');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.deck).toBeNull();
      expect(result.errors[0]).toMatch(/title/i);
    });

    it('rejects if ko missing category', () => {
      const koFront: DeckFile = { ...mockKoFront, category: undefined };
      const result = validatePair(koFront, mockEnFront, 'actions-a.md', 'actions-a_en.md');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.deck).toBeNull();
    });

    it('rejects if ko missing difficulty', () => {
      const koFront: DeckFile = { ...mockKoFront, difficulty: undefined };
      const result = validatePair(koFront, mockEnFront, 'actions-a.md', 'actions-a_en.md');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.deck).toBeNull();
    });

    it('rejects if ko words < 10', () => {
      const koFront: DeckFile = {
        ...mockKoFront,
        words: Array.from({ length: 9 }, (_, i) => ({ term: `w${i}` })),
      };
      const result = validatePair(koFront, mockEnFront, 'actions-a.md', 'actions-a_en.md');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.deck).toBeNull();
    });

    it('rejects if en missing title', () => {
      const enFront: DeckFile = { ...mockEnFront, title: '' };
      const result = validatePair(mockKoFront, enFront, 'actions-a.md', 'actions-a_en.md');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.deck).toBeNull();
    });

    it('rejects if en.words length !== ko.words length', () => {
      const enFront: DeckFile = {
        title: 'Actions A',
        words: Array.from({ length: 11 }, (_, i) => ({ term: `Action${i}` })),
      };
      const result = validatePair(mockKoFront, enFront, 'actions-a.md', 'actions-a_en.md');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.deck).toBeNull();
    });

    it('rejects if ko words have duplicate terms', () => {
      const koFront: DeckFile = {
        ...mockKoFront,
        words: [
          { term: 'duplicate' },
          { term: 'unique' },
          { term: 'duplicate' },
          ...Array.from({ length: 8 }, (_, i) => ({ term: `w${i}` })),
        ],
      };
      const result = validatePair(koFront, mockEnFront, 'actions-a.md', 'actions-a_en.md');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.deck).toBeNull();
    });

    it('rejects if en words have duplicate terms', () => {
      const enFront: DeckFile = {
        title: 'Actions A',
        words: [
          { term: 'duplicate' },
          { term: 'unique' },
          { term: 'duplicate' },
          ...Array.from({ length: 8 }, (_, i) => ({ term: `Action${i}` })),
        ],
      };
      const result = validatePair(mockKoFront, enFront, 'actions-a.md', 'actions-a_en.md');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.deck).toBeNull();
    });

    it('includes file path in error messages', () => {
      const koFront: DeckFile = { ...mockKoFront, title: '' };
      const result = validatePair(koFront, mockEnFront, 'actions-a.md', 'actions-a_en.md');
      expect(result.errors.some((e) => e.includes('actions-a.md'))).toBe(true);
    });
  });
});
