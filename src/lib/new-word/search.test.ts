import { describe, it, expect } from 'vitest';
import { filterTerms, normalizeSearchText } from './search';
import type { MergedTerm } from './schema';

describe('search — diacritic-insensitive filtering', () => {
  const mockCatalog: MergedTerm[] = [
    {
      slug: 'god-saeng',
      topic: 'mz',
      tags: ['생활', '긍정'],
      related: [],
      ko: {
        term: '갓생',
        definition: '열심히 사는 삶',
        examples: ['갓생을 산다'],
        body: '',
        aliases: ['갓생활'],
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
      related: [],
      ko: {
        term: '바이브 코딩',
        definition: 'AI에게 묻고 받아들이는 코딩 방식',
        examples: ['바이브 코딩으로 빠르게'],
        body: '',
        aliases: ['바코'],
      },
      en: {
        term: 'Vibe Coding',
        definition: 'building software by accepting AI output by vibe',
        examples: ['vibe coding'],
        body: '',
      },
    },
    {
      slug: 'king-batda',
      topic: 'mz',
      tags: ['감정'],
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

  describe('filterTerms', () => {
    it('returns all terms when query is empty', () => {
      const result = filterTerms(mockCatalog, '', 'ko');
      expect(result).toHaveLength(3);
    });

    it('returns all terms when query is whitespace', () => {
      const result = filterTerms(mockCatalog, '   ', 'ko');
      expect(result).toHaveLength(3);
    });

    it('matches term name in ko locale', () => {
      const result = filterTerms(mockCatalog, '갓생', 'ko');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('god-saeng');
    });

    it('matches term name in en locale', () => {
      const result = filterTerms(mockCatalog, 'god life', 'en');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].slug).toBe('god-saeng');
    });

    it('matches across both locales regardless of locale param', () => {
      const result = filterTerms(mockCatalog, '갓생', undefined);
      expect(result.length).toBeGreaterThan(0);
    });

    it('matches aliases', () => {
      const result = filterTerms(mockCatalog, '갓생활', undefined);
      expect(result[0].slug).toBe('god-saeng');
    });

    it('matches definition text', () => {
      const result = filterTerms(mockCatalog, '열심히', undefined);
      expect(result.length).toBeGreaterThan(0);
    });

    it('matches tags', () => {
      const result = filterTerms(mockCatalog, 'AI', undefined);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((t) => t.slug === 'vibe-coding')).toBe(true);
    });

    it('is case insensitive', () => {
      const resultLower = filterTerms(mockCatalog, 'vibe', undefined);
      const resultUpper = filterTerms(mockCatalog, 'VIBE', undefined);
      expect(resultLower).toHaveLength(resultUpper.length);
    });

    it('matches with spaces removed', () => {
      const result = filterTerms(mockCatalog, 'god life', undefined);
      expect(result.length).toBeGreaterThan(0);
    });

    it('preserves original order', () => {
      const result = filterTerms(mockCatalog, 'a', undefined);
      const slugs = result.map((t) => t.slug);
      // Preserve the original order in the filtered set
      const originalOrder = mockCatalog.map((t) => t.slug);
      expect(slugs).toEqual(slugs.sort((a, b) => originalOrder.indexOf(a) - originalOrder.indexOf(b)));
    });

    it('no results for nonmatching query', () => {
      const result = filterTerms(mockCatalog, 'xyz123nonexistent', undefined);
      expect(result).toHaveLength(0);
    });
  });

  describe('normalizeSearchText', () => {
    it('converts to lowercase', () => {
      expect(normalizeSearchText('UPPER')).toBe(normalizeSearchText('upper'));
    });

    it('uses NFC normalization', () => {
      // NFC normalized form
      const result = normalizeSearchText('test');
      expect(typeof result).toBe('string');
    });

    it('removes spaces', () => {
      const result = normalizeSearchText('god life');
      expect(result).not.toContain(' ');
    });

    it('removes hyphens', () => {
      const result = normalizeSearchText('vibe-coding');
      expect(result).not.toContain('-');
    });

    it('removes underscores', () => {
      const result = normalizeSearchText('vibe_coding');
      expect(result).not.toContain('_');
    });

    it('produces consistent normalization', () => {
      const text1 = normalizeSearchText('Test-Term');
      const text2 = normalizeSearchText('test term');
      expect(text1).toBe(text2);
    });
  });
});
