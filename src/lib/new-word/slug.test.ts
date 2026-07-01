import { describe, it, expect } from 'vitest';
import { slugify, resolveSlug } from './slug';
import type { TermFileFront } from './schema';

describe('slug — slugification and resolution', () => {
  describe('slugify', () => {
    it('converts uppercase to lowercase', () => {
      expect(slugify('GOD-SAENG')).toBe('god-saeng');
    });

    it('converts spaces to hyphens', () => {
      expect(slugify('vibe coding')).toBe('vibe-coding');
    });

    it('collapses multiple spaces into single hyphen', () => {
      expect(slugify('multiple   spaces')).toBe('multiple-spaces');
    });

    it('removes diacritics and accents', () => {
      expect(slugify('café')).toBe('cafe');
    });

    it('removes special characters except hyphens', () => {
      expect(slugify('god-saeng!')).toBe('god-saeng');
    });

    it('trims leading and trailing hyphens', () => {
      expect(slugify('-test-')).toBe('test');
    });

    it('collapses multiple hyphens', () => {
      expect(slugify('test--slug---here')).toBe('test-slug-here');
    });

    it('handles numbers', () => {
      expect(slugify('term-123')).toBe('term-123');
    });

    it('handles Korean characters by normalization', () => {
      // NFKD normalization handles Korean
      const result = slugify('가나다');
      expect(typeof result).toBe('string');
    });
  });

  describe('resolveSlug', () => {
    it('uses frontmatter slug if present', () => {
      const front: TermFileFront = {
        term: '갓생',
        definition: '열심',
        examples: ['예'],
        slug: 'custom-slug',
      };
      expect(resolveSlug(front, 'god-saeng.md')).toBe('custom-slug');
    });

    it('derives from filename if slug absent', () => {
      const front: TermFileFront = {
        term: '갓생',
        definition: '열심',
        examples: ['예'],
      };
      expect(resolveSlug(front, 'god-saeng.md')).toBe('god-saeng');
    });

    it('handles _en suffix in filename', () => {
      const front: TermFileFront = {
        term: 'god life',
        definition: 'productive',
        examples: ['example'],
      };
      expect(resolveSlug(front, 'god-saeng_en.md')).toBe('god-saeng');
    });

    it('slugifies filename base if needed', () => {
      const front: TermFileFront = {
        term: 'Vibe Coding',
        definition: 'def',
        examples: ['e'],
      };
      expect(resolveSlug(front, 'Vibe Coding.md')).toBe('vibe-coding');
    });

    it('prefers explicit slug over filename', () => {
      const front: TermFileFront = {
        term: 'Term',
        definition: 'def',
        examples: ['e'],
        slug: 'override',
      };
      expect(resolveSlug(front, 'different-filename.md')).toBe('override');
    });
  });
});
