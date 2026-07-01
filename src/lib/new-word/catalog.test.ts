import { describe, it, expect } from 'vitest';
import {
  allTerms,
  byId,
  byTopic,
  topics,
  validateRelatedIntegrity,
  validateUniqueSlugs,
} from './catalog';
import type { MergedTerm } from './schema';

describe('catalog — typed immutable access', () => {
  const mockCatalog: MergedTerm[] = [
    {
      slug: 'god-saeng',
      topic: 'mz',
      tags: ['생활'],
      related: ['king-batda'],
      ko: {
        term: '갓생',
        definition: '열심히 사는 삶',
        examples: ['갓생을 산다'],
        body: '',
      },
      en: {
        term: 'god life',
        definition: 'living productively',
        examples: ['living god life'],
        body: '',
      },
    },
    {
      slug: 'vibe-coding',
      topic: 'tech',
      tags: ['AI', '개발'],
      coinedYear: 2025,
      related: ['king-batda'],
      ko: {
        term: '바이브 코딩',
        definition: '느낌대로 코딩',
        examples: ['바이브 코딩'],
        body: '',
      },
      en: {
        term: 'Vibe Coding',
        definition: 'coding by vibe',
        examples: ['vibe coding'],
        body: '',
      },
    },
    {
      slug: 'king-batda',
      topic: 'mz',
      tags: [],
      related: [],
      ko: {
        term: '킹받다',
        definition: '열받다',
        examples: ['킹받네'],
        body: '',
      },
      en: {
        term: 'annoyed',
        definition: 'feeling annoyed',
        examples: ['annoyed'],
        body: '',
      },
    },
  ];

  describe('allTerms', () => {
    it('returns all terms in order', () => {
      const result = allTerms(mockCatalog);
      expect(result).toHaveLength(3);
      expect(result[0].slug).toBe('god-saeng');
    });

    it('returns same reference (immutable)', () => {
      const result = allTerms(mockCatalog);
      expect(result).toBe(mockCatalog);
    });
  });

  describe('byId', () => {
    it('finds term by slug', () => {
      const result = byId(mockCatalog, 'vibe-coding');
      expect(result?.ko.term).toBe('바이브 코딩');
    });

    it('returns null for unknown slug', () => {
      const result = byId(mockCatalog, 'unknown');
      expect(result).toBeNull();
    });

    it('finds with exact slug match', () => {
      const result = byId(mockCatalog, 'king-batda');
      expect(result?.slug).toBe('king-batda');
    });
  });

  describe('byTopic', () => {
    it('filters by mz topic', () => {
      const result = byTopic(mockCatalog, 'mz');
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.slug)).toContain('god-saeng');
      expect(result.map((t) => t.slug)).toContain('king-batda');
    });

    it('filters by tech topic', () => {
      const result = byTopic(mockCatalog, 'tech');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('vibe-coding');
    });

    it('returns empty array for unknown topic', () => {
      const result = byTopic(mockCatalog, 'unknown');
      expect(result).toHaveLength(0);
    });

    it('returns new array (immutable)', () => {
      const result = byTopic(mockCatalog, 'mz');
      expect(result).not.toBe(mockCatalog);
    });
  });

  describe('topics', () => {
    it('returns unique topics in sorted order', () => {
      const result = topics(mockCatalog);
      expect(result).toEqual(['mz', 'tech']);
    });

    it('removes duplicates', () => {
      const result = topics(mockCatalog);
      expect(new Set(result).size).toBe(result.length);
    });

    it('returns empty array for empty catalog', () => {
      const result = topics([]);
      expect(result).toEqual([]);
    });
  });

  describe('validateRelatedIntegrity', () => {
    it('detects dangling related reference', () => {
      const catalog = [
        {
          ...mockCatalog[0],
          related: ['nonexistent-slug'],
        },
      ];
      const errors = validateRelatedIntegrity(catalog);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('nonexistent-slug');
    });

    it('allows valid related references', () => {
      const errors = validateRelatedIntegrity(mockCatalog);
      expect(errors).toHaveLength(0);
    });

    it('handles no related references', () => {
      const catalog = mockCatalog.filter((t) => t.related.length === 0);
      const errors = validateRelatedIntegrity(catalog);
      expect(errors).toHaveLength(0);
    });

    it('reports dangling reference with slug name', () => {
      const catalog = [
        {
          ...mockCatalog[0],
          related: ['missing'],
        },
      ];
      const errors = validateRelatedIntegrity(catalog);
      expect(errors[0]).toContain('god-saeng');
      expect(errors[0]).toContain('missing');
    });
  });

  describe('validateUniqueSlugs', () => {
    it('succeeds with unique slugs', () => {
      const errors = validateUniqueSlugs(mockCatalog);
      expect(errors).toHaveLength(0);
    });

    it('detects duplicate slugs', () => {
      const catalog = [mockCatalog[0], { ...mockCatalog[0], slug: 'god-saeng' }];
      const errors = validateUniqueSlugs(catalog);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('god-saeng');
    });

    it('allows single term with unique slug', () => {
      const errors = validateUniqueSlugs([mockCatalog[0]]);
      expect(errors).toHaveLength(0);
    });

    it('detects multiple duplicates', () => {
      const catalog = [
        mockCatalog[0],
        { ...mockCatalog[0], slug: 'god-saeng' },
        mockCatalog[1],
        { ...mockCatalog[1], slug: 'vibe-coding' },
      ];
      const errors = validateUniqueSlugs(catalog);
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
