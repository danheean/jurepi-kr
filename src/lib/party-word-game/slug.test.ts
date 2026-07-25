import { describe, it, expect } from 'vitest';
import { slugify, resolveSlug } from './slug';
import type { DeckFile } from './types';

describe('slug — slug utilities', () => {
  describe('slugify', () => {
    it('lowercases input', () => {
      const result = slugify('ANIMALS');
      expect(result).toBe('animals');
    });

    it('replaces spaces with hyphens', () => {
      const result = slugify('Hello World');
      expect(result).toBe('hello-world');
    });

    it('removes diacritics', () => {
      const result = slugify('café');
      expect(result).toBe('cafe');
    });

    it('collapses multiple hyphens', () => {
      const result = slugify('hello---world');
      expect(result).toBe('hello-world');
    });

    it('trims leading/trailing hyphens', () => {
      const result = slugify('-hello-');
      expect(result).toBe('hello');
    });

    it('handles mixed case and spaces', () => {
      const result = slugify('Hello   World');
      expect(result).toBe('hello-world');
    });

    it('removes special characters', () => {
      const result = slugify('hello@world!');
      expect(result).toBe('helloworld');
    });

    it('keeps alphanumerics and hyphens', () => {
      const result = slugify('test-123-abc');
      expect(result).toBe('test-123-abc');
    });

    it('handles empty string', () => {
      const result = slugify('');
      expect(result).toBe('');
    });

    it('handles only spaces', () => {
      const result = slugify('   ');
      expect(result).toBe('');
    });
  });

  describe('resolveSlug', () => {
    it('uses frontmatter slug if present', () => {
      const front: DeckFile = {
        slug: 'custom-slug',
      };
      const result = resolveSlug(front, 'animals-a.md');
      expect(result).toBe('custom-slug');
    });

    it('derives from filename (ko file)', () => {
      const front: DeckFile = {};
      const result = resolveSlug(front, 'animals-a.md');
      expect(result).toBe('animals-a');
    });

    it('derives from filename (en file)', () => {
      const front: DeckFile = {};
      const result = resolveSlug(front, 'animals-a_en.md');
      expect(result).toBe('animals-a');
    });

    it('handles filename with spaces', () => {
      const front: DeckFile = {};
      const result = resolveSlug(front, 'my animals.md');
      expect(result).toBe('my-animals');
    });

    it('falls back to filename if slug is empty string', () => {
      const front: DeckFile = {
        slug: '',
      };
      const result = resolveSlug(front, 'animals-a.md');
      // Empty slug is falsy, so fall back to filename derivation
      expect(result).toBe('animals-a');
    });

    it('uses frontmatter slug even if filename is different', () => {
      const front: DeckFile = {
        slug: 'explicit-slug',
      };
      const result = resolveSlug(front, 'anything-else.md');
      expect(result).toBe('explicit-slug');
    });

    it('handles _en suffix correctly', () => {
      const front: DeckFile = {};
      const result = resolveSlug(front, 'Historical-Figures_en.md');
      expect(result).toBe('historical-figures');
    });
  });
});
