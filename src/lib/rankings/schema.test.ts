import { describe, it, expect } from 'vitest';
import {
  STORE_VERSION,
  RankingFileFrontSchema,
  MergedRankingSchema,
  RankingsStoreSchema,
  safeJsonParse,
} from './schema';

describe('schema — zod validation', () => {
  describe('RankingFileFrontSchema', () => {
    it('accepts valid Korean frontmatter with required fields', () => {
      const valid = {
        title: 'LLM 에이전트 순위',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Agent Arena 리더보드 기준',
        items: [
          { rank: 1, name: 'Claude Opus 4.8', description: 'Best agent' },
          { rank: 2, name: 'GPT 5.5', description: 'Strong performer' },
          { rank: 3, name: 'Gemini 2.0', description: 'Good reasoning' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts optional sourceUrl field', () => {
      const valid = {
        title: '프로그래밍 언어 순위',
        field: 'programming',
        asOfDate: '2026-06',
        sourceNote: 'TIOBE 인덱스',
        sourceUrl: 'https://www.tiobe.com/tiobe-index/',
        items: [
          { rank: 1, name: 'Python', description: '가장 인기 있는 언어' },
          { rank: 2, name: 'C', description: '시스템 언어' },
          { rank: 3, name: 'C++', description: '고성능' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const invalid = {
        title: '',
        field: 'tech',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('allows omitting field (for EN files that inherit from KO)', () => {
      const valid = {
        title: 'LLM Agent Leaderboard',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid field enum', () => {
      const invalid = {
        title: '순위',
        field: 'invalid-field',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts all valid field enum values', () => {
      const fields = ['ai', 'programming', 'tech', 'games', 'movies', 'music'] as const;
      for (const field of fields) {
        const data = {
          title: `${field} ranking`,
          field,
          asOfDate: '2026-06',
          sourceNote: 'Source',
          items: [
            { rank: 1, name: 'Item 1', description: 'Desc' },
            { rank: 2, name: 'Item 2', description: 'Desc' },
            { rank: 3, name: 'Item 3', description: 'Desc' },
          ],
        };
        expect(RankingFileFrontSchema.safeParse(data).success).toBe(true);
      }
    });

    it('rejects sourceNote exceeding 200 chars', () => {
      const longNote = 'a'.repeat(201);
      const invalid = {
        title: '순위',
        field: 'tech',
        asOfDate: '2026-06',
        sourceNote: longNote,
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects less than 3 items', () => {
      const invalid = {
        title: '순위',
        field: 'tech',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects item with missing rank', () => {
      const invalid = {
        title: '순위',
        field: 'tech',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        items: [
          { name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects item with description exceeding 200 chars', () => {
      const longDesc = 'a'.repeat(201);
      const invalid = {
        title: '순위',
        field: 'tech',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        items: [
          { rank: 1, name: 'Item 1', description: longDesc },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts item with optional imageUrl, imageWidth, imageHeight', () => {
      const valid = {
        title: '영화',
        field: 'movies',
        asOfDate: '2026-06',
        sourceNote: 'IMDb',
        items: [
          {
            rank: 1,
            name: 'Movie 1',
            description: 'Great film',
            imageUrl: 'https://example.com/1.jpg',
            imageWidth: 100,
            imageHeight: 150,
          },
          { rank: 2, name: 'Movie 2', description: 'Good' },
          { rank: 3, name: 'Movie 3', description: 'OK' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts item with optional link', () => {
      const valid = {
        title: '게임',
        field: 'games',
        asOfDate: '2026-06',
        sourceNote: 'Steam',
        items: [
          {
            rank: 1,
            name: 'Game 1',
            description: 'Fun',
            link: 'https://steam.com/game1',
          },
          { rank: 2, name: 'Game 2', description: 'Good' },
          { rank: 3, name: 'Game 3', description: 'OK' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid sourceUrl', () => {
      const invalid = {
        title: '순위',
        field: 'tech',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        sourceUrl: 'not-a-url',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid item link', () => {
      const invalid = {
        title: '순위',
        field: 'tech',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc', link: 'not-a-url' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      const result = RankingFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('MergedRankingSchema', () => {
    it('accepts valid merged ranking', () => {
      const valid = {
        slug: 'llm-agent-leaderboard',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Agent Arena leaderboard',
        ko: {
          title: 'LLM 에이전트 순위',
          items: [
            { rank: 1, name: 'Claude Opus', description: 'Best' },
            { rank: 2, name: 'GPT 5.5', description: 'Strong' },
            { rank: 3, name: 'Gemini 2.0', description: 'Good' },
          ],
        },
        en: {
          title: 'LLM Agent Leaderboard',
          items: [
            { rank: 1, name: 'Claude Opus', description: 'Best' },
            { rank: 2, name: 'GPT 5.5', description: 'Strong' },
            { rank: 3, name: 'Gemini 2.0', description: 'Good' },
          ],
        },
      };
      const result = MergedRankingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts optional sourceUrl in merged ranking', () => {
      const valid = {
        slug: 'programming-languages',
        field: 'programming',
        asOfDate: '2026-06',
        sourceNote: 'TIOBE Index',
        sourceUrl: 'https://www.tiobe.com/tiobe-index/',
        ko: {
          title: '프로그래밍 언어',
          items: [
            { rank: 1, name: 'Python', description: 'Popular' },
            { rank: 2, name: 'C', description: 'System' },
            { rank: 3, name: 'C++', description: 'Performance' },
          ],
        },
        en: {
          title: 'Programming Languages',
          items: [
            { rank: 1, name: 'Python', description: 'Popular' },
            { rank: 2, name: 'C', description: 'System' },
            { rank: 3, name: 'C++', description: 'Performance' },
          ],
        },
      };
      const result = MergedRankingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid slug format', () => {
      const invalid = {
        slug: 'Invalid Slug!',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        ko: {
          title: 'Title',
          items: [
            { rank: 1, name: 'Item 1', description: 'Desc' },
            { rank: 2, name: 'Item 2', description: 'Desc' },
            { rank: 3, name: 'Item 3', description: 'Desc' },
          ],
        },
        en: {
          title: 'Title',
          items: [
            { rank: 1, name: 'Item 1', description: 'Desc' },
            { rank: 2, name: 'Item 2', description: 'Desc' },
            { rank: 3, name: 'Item 3', description: 'Desc' },
          ],
        },
      };
      const result = MergedRankingSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const invalid = {
        slug: 'test',
        field: 'ai',
        // missing asOfDate
        sourceNote: 'Source',
        ko: {
          title: 'Title',
          items: [{ rank: 1, name: 'Item', description: 'Desc' }],
        },
        en: {
          title: 'Title',
          items: [{ rank: 1, name: 'Item', description: 'Desc' }],
        },
      };
      const result = MergedRankingSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('RankingsStoreSchema', () => {
    it('accepts valid store with version', () => {
      const valid = {
        version: STORE_VERSION,
        favorites: [],
        recents: [],
        meta: { createdAt: Date.now() },
      };
      const result = RankingsStoreSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts store with favorites and recents', () => {
      const valid = {
        version: STORE_VERSION,
        favorites: ['slug1', 'slug2'],
        recents: ['slug3', 'slug4'],
        meta: { createdAt: Date.now(), lastField: 'ai' },
      };
      const result = RankingsStoreSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid version', () => {
      const invalid = {
        version: 0,
        favorites: [],
        recents: [],
        meta: { createdAt: Date.now() },
      };
      const result = RankingsStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid JSON matching schema', () => {
      const store = {
        version: STORE_VERSION,
        favorites: ['slug1'],
        recents: [],
        meta: { createdAt: Date.now() },
      };
      const json = JSON.stringify(store);
      const result = safeJsonParse(json, RankingsStoreSchema);
      expect(result).not.toBeNull();
      expect(result?.favorites).toEqual(['slug1']);
    });

    it('returns null for invalid JSON', () => {
      const result = safeJsonParse('invalid json', RankingsStoreSchema);
      expect(result).toBeNull();
    });

    it('returns null for JSON not matching schema', () => {
      const json = JSON.stringify({ version: 0, favorites: [] });
      const result = safeJsonParse(json, RankingsStoreSchema);
      expect(result).toBeNull();
    });

    it('returns null for corrupt data', () => {
      const result = safeJsonParse('', RankingsStoreSchema);
      expect(result).toBeNull();
    });
  });

  describe('STORE_VERSION constant', () => {
    it('is defined as 1', () => {
      expect(STORE_VERSION).toBe(1);
    });
  });
});
