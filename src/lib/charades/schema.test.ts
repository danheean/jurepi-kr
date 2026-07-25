import { describe, it, expect } from 'vitest';
import {
  WordSchema,
  DeckFileSchema,
  MergedDeckSchema,
  CharadesStoreSchema,
  safeJsonParse,
  STORE_VERSION,
  CHARADES_CATEGORIES,
} from './schema';

describe('schema — zod validation', () => {
  describe('WordSchema', () => {
    it('parses valid word with term only', () => {
      const data = { term: '자전거 타기' };
      const result = WordSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.term).toBe('자전거 타기');
        expect(result.data.hint).toBeUndefined();
      }
    });

    it('parses valid word with term and hint', () => {
      const data = { term: '코끼리', hint: '긴 코를 가진 큰 동물' };
      const result = WordSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hint).toBe('긴 코를 가진 큰 동물');
      }
    });

    it('rejects empty term', () => {
      const result = WordSchema.safeParse({ term: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing term', () => {
      const result = WordSchema.safeParse({ hint: 'hint only' });
      expect(result.success).toBe(false);
    });

    it('rejects hint > 30 chars', () => {
      const result = WordSchema.safeParse({ term: 'word', hint: 'a'.repeat(31) });
      expect(result.success).toBe(false);
    });

    it('accepts hint of exactly 30 chars', () => {
      const result = WordSchema.safeParse({ term: 'word', hint: 'a'.repeat(30) });
      expect(result.success).toBe(true);
    });
  });

  describe('DeckFileSchema', () => {
    it('parses ko file (required fields)', () => {
      const data = {
        title: '동작 A',
        category: 'actions',
        difficulty: 'easy',
        words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
      };
      const result = DeckFileSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('actions');
        expect(result.data.words).toHaveLength(10);
      }
    });

    it('parses en file (title only, inherits category/difficulty)', () => {
      const result = DeckFileSchema.safeParse({ title: 'Actions A' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBeUndefined();
        expect(result.data.words).toBeUndefined();
      }
    });

    it('rejects empty title', () => {
      const data = { title: '', category: 'actions', difficulty: 'easy', words: [{ term: 'x' }] };
      expect(DeckFileSchema.safeParse(data).success).toBe(false);
    });

    it('rejects invalid category', () => {
      const data = { title: 'Test', category: 'proverbs', difficulty: 'easy', words: [{ term: 'x' }] };
      // 'proverbs' is a speed-quiz category, NOT a valid charades category (mimeable-without-speech policy)
      expect(DeckFileSchema.safeParse(data).success).toBe(false);
    });

    it('rejects invalid difficulty', () => {
      const data = { title: 'Test', category: 'actions', difficulty: 'extreme', words: [{ term: 'x' }] };
      expect(DeckFileSchema.safeParse(data).success).toBe(false);
    });

    it('rejects invalid slug', () => {
      const data = {
        title: 'Test',
        slug: 'Invalid Slug!',
        category: 'actions',
        difficulty: 'easy',
        words: [{ term: 'x' }],
      };
      expect(DeckFileSchema.safeParse(data).success).toBe(false);
    });

    it('requires ≥10 words', () => {
      const data = {
        title: 'Test',
        category: 'actions',
        difficulty: 'easy',
        words: Array.from({ length: 9 }, (_, i) => ({ term: `word${i}` })),
      };
      expect(DeckFileSchema.safeParse(data).success).toBe(false);
    });

    it('accepts exactly 10 words', () => {
      const data = {
        title: 'Test',
        category: 'actions',
        difficulty: 'easy',
        words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
      };
      expect(DeckFileSchema.safeParse(data).success).toBe(true);
    });

    it('rejects 11 words (A/B team-battle decks are capped at exactly 10)', () => {
      const data = {
        title: 'Test',
        category: 'actions',
        difficulty: 'easy',
        words: Array.from({ length: 11 }, (_, i) => ({ term: `word${i}` })),
      };
      expect(DeckFileSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('MergedDeckSchema', () => {
    it('parses valid merged deck', () => {
      const data = {
        slug: 'actions-a',
        category: 'actions',
        difficulty: 'easy',
        words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
        ko: { title: '동작 A', words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })) },
        en: { title: 'Actions A', words: Array.from({ length: 10 }, (_, i) => ({ term: `Word${i}` })) },
      };
      expect(MergedDeckSchema.safeParse(data).success).toBe(true);
    });

    it('requires canonical words ≥10', () => {
      const data = {
        slug: 'actions-a',
        category: 'actions',
        difficulty: 'easy',
        words: Array.from({ length: 9 }, (_, i) => ({ term: `word${i}` })),
        ko: { title: '동작 A', words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })) },
        en: { title: 'Actions A', words: Array.from({ length: 10 }, (_, i) => ({ term: `Word${i}` })) },
      };
      expect(MergedDeckSchema.safeParse(data).success).toBe(false);
    });

    it('rejects canonical words > 10 (exact-10 cap for A/B team decks)', () => {
      const data = {
        slug: 'actions-a',
        category: 'actions',
        difficulty: 'easy',
        words: Array.from({ length: 11 }, (_, i) => ({ term: `word${i}` })),
        ko: { title: '동작 A팀', words: Array.from({ length: 11 }, (_, i) => ({ term: `word${i}` })) },
        en: { title: 'Actions Team A', words: Array.from({ length: 11 }, (_, i) => ({ term: `Word${i}` })) },
      };
      expect(MergedDeckSchema.safeParse(data).success).toBe(false);
    });

    it('requires non-empty ko.title and en.title', () => {
      const data = {
        slug: 'actions-a',
        category: 'actions',
        difficulty: 'easy',
        words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })),
        ko: { title: '', words: Array.from({ length: 10 }, (_, i) => ({ term: `word${i}` })) },
        en: { title: 'Actions A', words: Array.from({ length: 10 }, (_, i) => ({ term: `Word${i}` })) },
      };
      expect(MergedDeckSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('CharadesStoreSchema', () => {
    it('parses minimal valid store', () => {
      const data = { version: 1, settings: { shuffleOn: true, soundOn: true }, favorites: [], recents: [] };
      expect(CharadesStoreSchema.safeParse(data).success).toBe(true);
    });

    it('parses full store with optional settings', () => {
      const data = {
        version: 1,
        settings: {
          lastCategory: 'actions',
          lastDifficulty: 'easy',
          roundTimeSeconds: 60,
          shuffleOn: true,
          soundOn: false,
        },
        favorites: ['actions-a', 'animals-a'],
        recents: ['actions-a'],
      };
      const result = CharadesStoreSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.favorites).toHaveLength(2);
      }
    });

    it('requires version ≥1', () => {
      const data = { version: 0, settings: { shuffleOn: true, soundOn: true }, favorites: [], recents: [] };
      expect(CharadesStoreSchema.safeParse(data).success).toBe(false);
    });

    it('rejects invalid settings shape', () => {
      const data = { version: 1, settings: { invalid: true }, favorites: [], recents: [] };
      expect(CharadesStoreSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid JSON and returns data if schema matches', () => {
      const json = JSON.stringify({ version: 1, settings: { shuffleOn: true, soundOn: true }, favorites: [], recents: [] });
      const result = safeJsonParse(json, CharadesStoreSchema);
      expect(result).not.toBeNull();
    });

    it('returns null on invalid JSON', () => {
      expect(safeJsonParse('{ invalid json', CharadesStoreSchema)).toBeNull();
    });

    it('returns null if schema validation fails', () => {
      const json = JSON.stringify({ version: 0, settings: { shuffleOn: true } });
      expect(safeJsonParse(json, CharadesStoreSchema)).toBeNull();
    });

    it('never throws', () => {
      expect(() => safeJsonParse('not json', CharadesStoreSchema)).not.toThrow();
    });
  });

  describe('STORE_VERSION', () => {
    it('exports STORE_VERSION = 1', () => {
      expect(STORE_VERSION).toBe(1);
    });
  });

  describe('all 6 categories', () => {
    CHARADES_CATEGORIES.forEach((cat) => {
      it(`accepts category: ${cat}`, () => {
        const data = {
          title: 'Test',
          category: cat,
          difficulty: 'easy',
          words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
        };
        expect(DeckFileSchema.safeParse(data).success).toBe(true);
      });
    });

    it('exports exactly the mimeable-without-speech category set', () => {
      expect(CHARADES_CATEGORIES).toEqual([
        'actions',
        'animals',
        'occupations',
        'characters',
        'sports',
        'emotions',
      ]);
    });
  });

  describe('all 3 difficulties', () => {
    ['easy', 'normal', 'hard'].forEach((diff) => {
      it(`accepts difficulty: ${diff}`, () => {
        const data = {
          title: 'Test',
          category: 'actions',
          difficulty: diff,
          words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
        };
        expect(DeckFileSchema.safeParse(data).success).toBe(true);
      });
    });
  });
});
