import { describe, it, expect } from 'vitest';
import {
  allRankings,
  byId,
  byField,
  fields,
  validateUniqueSlugPerField,
  validateRanksConsecutive,
} from './catalog';
import type { MergedRanking } from './schema';

describe('catalog', () => {
  const mockCatalog: MergedRanking[] = [
    {
      slug: 'llm-agents',
      field: 'ai',
      asOfDate: '2026-06',
      sourceNote: 'Agent Arena',
      ko: {
        title: 'AI 에이전트 순위',
        items: [
          { rank: 1, name: 'Claude', description: 'Best' },
          { rank: 2, name: 'GPT', description: 'Good' },
          { rank: 3, name: 'Gemini', description: 'OK' },
        ],
      },
      en: {
        title: 'AI Agent Leaderboard',
        items: [
          { rank: 1, name: 'Claude', description: 'Best' },
          { rank: 2, name: 'GPT', description: 'Good' },
          { rank: 3, name: 'Gemini', description: 'OK' },
        ],
      },
    },
    {
      slug: 'programming-langs',
      field: 'programming',
      asOfDate: '2026-06',
      sourceNote: 'TIOBE',
      ko: {
        title: '프로그래밍 언어',
        items: [
          { rank: 1, name: 'Python', description: 'Popular' },
          { rank: 2, name: 'C', description: 'Systems' },
          { rank: 3, name: 'C++', description: 'Performance' },
        ],
      },
      en: {
        title: 'Programming Languages',
        items: [
          { rank: 1, name: 'Python', description: 'Popular' },
          { rank: 2, name: 'C', description: 'Systems' },
          { rank: 3, name: 'C++', description: 'Performance' },
        ],
      },
    },
    {
      slug: 'best-games',
      field: 'games',
      asOfDate: '2026-06',
      sourceNote: 'IGN',
      ko: {
        title: '게임 순위',
        items: [
          { rank: 1, name: 'Game A', description: 'Excellent' },
          { rank: 2, name: 'Game B', description: 'Great' },
          { rank: 3, name: 'Game C', description: 'Good' },
        ],
      },
      en: {
        title: 'Game Rankings',
        items: [
          { rank: 1, name: 'Game A', description: 'Excellent' },
          { rank: 2, name: 'Game B', description: 'Great' },
          { rank: 3, name: 'Game C', description: 'Good' },
        ],
      },
    },
  ];

  describe('allRankings', () => {
    it('returns all rankings', () => {
      const results = allRankings(mockCatalog);
      expect(results).toEqual(mockCatalog);
    });

    it('returns empty array for empty catalog', () => {
      const results = allRankings([]);
      expect(results).toEqual([]);
    });
  });

  describe('byId', () => {
    it('finds ranking by slug', () => {
      const result = byId(mockCatalog, 'llm-agents');
      expect(result).not.toBeNull();
      expect(result?.slug).toBe('llm-agents');
    });

    it('returns null for non-existent slug', () => {
      const result = byId(mockCatalog, 'non-existent');
      expect(result).toBeNull();
    });

    it('returns null for empty catalog', () => {
      const result = byId([], 'any-slug');
      expect(result).toBeNull();
    });
  });

  describe('byField', () => {
    it('filters rankings by field', () => {
      const results = byField(mockCatalog, 'ai');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('llm-agents');
    });

    it('filters multiple rankings by field', () => {
      const doubleAi = [
        ...mockCatalog,
        {
          ...mockCatalog[0],
          slug: 'ai-models',
        },
      ];
      const results = byField(doubleAi, 'ai');
      expect(results.length).toBe(2);
    });

    it('returns empty array for non-existent field', () => {
      const results = byField(mockCatalog, 'music');
      expect(results).toEqual([]);
    });

    it('returns empty array for empty catalog', () => {
      const results = byField([], 'ai');
      expect(results).toEqual([]);
    });
  });

  describe('fields', () => {
    it('returns unique fields in defined order', () => {
      const results = fields(mockCatalog);
      expect(results).toContain('ai');
      expect(results).toContain('programming');
      expect(results).toContain('games');
    });

    it('respects field order: ai, programming, tech, games, movies, music', () => {
      const results = fields(mockCatalog);
      const aiIndex = results.indexOf('ai');
      const progIndex = results.indexOf('programming');
      const gamesIndex = results.indexOf('games');
      expect(aiIndex).toBeLessThan(progIndex);
      expect(progIndex).toBeLessThan(gamesIndex);
    });

    it('only returns fields present in catalog', () => {
      const results = fields(mockCatalog);
      expect(results).not.toContain('movies');
      expect(results).not.toContain('music');
    });

    it('returns empty array for empty catalog', () => {
      const results = fields([]);
      expect(results).toEqual([]);
    });

    it('removes duplicates', () => {
      const doubleAi = [...mockCatalog, mockCatalog[0]];
      const results = fields(doubleAi);
      const aiCount = results.filter((f) => f === 'ai').length;
      expect(aiCount).toBe(1);
    });
  });

  describe('validateUniqueSlugPerField', () => {
    it('returns empty errors for unique slugs', () => {
      const errors = validateUniqueSlugPerField(mockCatalog);
      expect(errors).toEqual([]);
    });

    it('detects duplicate slug in same field', () => {
      const dupeInField = [
        mockCatalog[0],
        { ...mockCatalog[1], slug: 'llm-agents' }, // same slug as first, but different field
      ];
      const errors = validateUniqueSlugPerField(dupeInField);
      expect(errors.length).toBe(0); // Different fields, so OK
    });

    it('detects duplicate slug within same field', () => {
      const dupeInSameField = [
        mockCatalog[0],
        { ...mockCatalog[0], slug: 'llm-agents' }, // exact duplicate
      ];
      const errors = validateUniqueSlugPerField(dupeInSameField);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Duplicate slug');
      expect(errors[0]).toContain('ai');
    });

    it('returns empty errors for empty catalog', () => {
      const errors = validateUniqueSlugPerField([]);
      expect(errors).toEqual([]);
    });
  });

  describe('validateRanksConsecutive', () => {
    it('returns empty errors for consecutive ranks', () => {
      const errors = validateRanksConsecutive(mockCatalog);
      expect(errors).toEqual([]);
    });

    it('detects gap in KO ranks', () => {
      const withGap = [
        {
          ...mockCatalog[0],
          ko: {
            ...mockCatalog[0].ko,
            items: [
              { rank: 1, name: 'Item 1', description: 'Desc' },
              { rank: 3, name: 'Item 3', description: 'Desc' }, // gap: missing 2
              { rank: 4, name: 'Item 4', description: 'Desc' },
            ],
          },
        },
      ];
      const errors = validateRanksConsecutive(withGap);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('ranks must be consecutive');
    });

    it('detects gap in EN ranks', () => {
      const withGap = [
        {
          ...mockCatalog[0],
          en: {
            ...mockCatalog[0].en,
            items: [
              { rank: 1, name: 'Item 1', description: 'Desc' },
              { rank: 2, name: 'Item 2', description: 'Desc' },
              { rank: 4, name: 'Item 4', description: 'Desc' }, // gap: missing 3
            ],
          },
        },
      ];
      const errors = validateRanksConsecutive(withGap);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('ranks must be consecutive');
    });

    it('validates ranks starting at 1', () => {
      const withoutOne = [
        {
          ...mockCatalog[0],
          ko: {
            ...mockCatalog[0].ko,
            items: [
              { rank: 2, name: 'Item 2', description: 'Desc' },
              { rank: 3, name: 'Item 3', description: 'Desc' },
              { rank: 4, name: 'Item 4', description: 'Desc' },
            ],
          },
        },
      ];
      const errors = validateRanksConsecutive(withoutOne);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('handles unordered items (sorts before validation)', () => {
      const unordered = [
        {
          ...mockCatalog[0],
          ko: {
            ...mockCatalog[0].ko,
            items: [
              { rank: 3, name: 'Item 3', description: 'Desc' },
              { rank: 1, name: 'Item 1', description: 'Desc' },
              { rank: 2, name: 'Item 2', description: 'Desc' },
            ],
          },
        },
      ];
      const errors = validateRanksConsecutive(unordered);
      expect(errors).toEqual([]); // Should pass because ranks are 1, 2, 3 (when sorted)
    });

    it('returns empty errors for empty catalog', () => {
      const errors = validateRanksConsecutive([]);
      expect(errors).toEqual([]);
    });
  });
});
