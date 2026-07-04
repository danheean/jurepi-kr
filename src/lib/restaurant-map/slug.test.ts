import { describe, it, expect } from 'vitest';
import { slugify, resolveSlug } from './slug';

describe('slug', () => {
  describe('slugify', () => {
    it('lowercases ASCII text', () => {
      expect(slugify('Seoul Jokbal')).toBe('seoul-jokbal');
    });

    it('removes special characters', () => {
      expect(slugify('Busan (Local) Ramen!')).toBe('busan-local-ramen');
    });

    it('collapses multiple spaces to single dash', () => {
      expect(slugify('National  Tuna   Spots')).toBe('national-tuna-spots');
    });

    it('removes leading and trailing spaces', () => {
      expect(slugify('  Seoul Cafes  ')).toBe('seoul-cafes');
    });

    it('handles apostrophes', () => {
      expect(slugify("Joe's Coffee")).toBe('joes-coffee');
    });

    it('collapses dashes and spaces', () => {
      expect(slugify('Cafe - Brunch')).toBe('cafe-brunch');
    });
  });

  describe('resolveSlug', () => {
    it('uses explicit slug from frontmatter if present', () => {
      const front = {
        title: 'Seoul Jokbal',
        slug: 'custom-slug',
        region: 'seoul',
        asOfDate: '2026-07-04',
        sourceNote: 'Personal',
        places: [],
      };
      expect(resolveSlug(front, 'seoul-jokbal.md')).toBe('custom-slug');
    });

    it('derives slug from filename if frontmatter slug absent', () => {
      const front: { slug?: string } = {};
      expect(resolveSlug(front, 'seoul-jokbal.md')).toBe('seoul-jokbal');
    });

    it('removes .md extension from filename', () => {
      const front: { slug?: string } = {};
      expect(resolveSlug(front, 'busan-ramen.md')).toBe('busan-ramen');
    });

    it('removes _en suffix from filename', () => {
      const front: { slug?: string } = {};
      expect(resolveSlug(front, 'busan-ramen_en.md')).toBe('busan-ramen');
    });

    it('handles full path extraction', () => {
      const front: { slug?: string } = {};
      expect(resolveSlug(front, '/path/to/seoul-cafes.md')).toBe('seoul-cafes');
    });
  });
});
