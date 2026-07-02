import { describe, it, expect } from 'vitest';
import { slugify, resolveSlug } from './slug';
import type { RankingFileFront } from './schema';

describe('slug', () => {
  describe('slugify', () => {
    it('converts to lowercase', () => {
      expect(slugify('BEST SUSHI')).toContain('best');
    });

    it('replaces spaces with hyphens', () => {
      expect(slugify('Best Sushi')).toBe('best-sushi');
    });

    it('removes special characters', () => {
      expect(slugify('Top Restaurants 2024!')).toBe('top-restaurants-2024');
    });

    it('collapses multiple hyphens', () => {
      expect(slugify('Best---Sushi')).toBe('best-sushi');
    });

    it('trims leading and trailing hyphens', () => {
      expect(slugify('-Best Sushi-')).toBe('best-sushi');
    });

    it('removes diacritics', () => {
      expect(slugify('Café München')).toBe('cafe-munchen');
    });

    it('handles complex strings', () => {
      expect(slugify('Best Sushi! (Global) 🍣')).toBe('best-sushi-global');
    });

    it('handles underscores', () => {
      expect(slugify('Best_Sushi_2024')).toBe('best_sushi_2024');
    });

    it('handles empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('handles only special characters', () => {
      expect(slugify('!!!')).toBe('');
    });
  });

  describe('resolveSlug', () => {
    it('returns frontmatter slug if present', () => {
      const front: RankingFileFront = {
        title: 'Test',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        slug: 'custom-slug',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      expect(resolveSlug(front, 'best-sushi.md')).toBe('custom-slug');
    });

    it('derives slug from filename when not in frontmatter', () => {
      const front: RankingFileFront = {
        title: 'Test',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      expect(resolveSlug(front, 'best-sushi.md')).toBe('best-sushi');
    });

    it('removes .md extension from filename', () => {
      const front: RankingFileFront = {
        title: 'Test',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      expect(resolveSlug(front, 'best-sushi.md')).toBe('best-sushi');
    });

    it('removes _en.md extension from filename', () => {
      const front: RankingFileFront = {
        title: 'Test',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      expect(resolveSlug(front, 'best-sushi_en.md')).toBe('best-sushi');
    });

    it('slugifies complex filename', () => {
      const front: RankingFileFront = {
        title: 'Test',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      expect(resolveSlug(front, 'Top Restaurants 2024!.md')).toBe(
        'top-restaurants-2024'
      );
    });

    it('prefers frontmatter slug over derived', () => {
      const front: RankingFileFront = {
        title: 'Test',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        slug: 'explicit-slug',
        items: [
          { rank: 1, name: 'Item 1', description: 'Desc' },
          { rank: 2, name: 'Item 2', description: 'Desc' },
          { rank: 3, name: 'Item 3', description: 'Desc' },
        ],
      };
      expect(resolveSlug(front, 'different-name_en.md')).toBe('explicit-slug');
    });
  });
});
