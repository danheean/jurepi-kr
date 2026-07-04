import { describe, it, expect } from 'vitest';
import { slugify, resolveSlug } from './slug';
import type { PersonFileFront } from './schema';

describe('slugify', () => {
  it('converts name to ASCII slug', () => {
    expect(slugify('Grace Hopper')).toBe('grace-hopper');
    expect(slugify('Guido van Rossum')).toBe('guido-van-rossum');
    expect(slugify('Linus Torvalds')).toBe('linus-torvalds');
  });

  it('removes diacritics', () => {
    expect(slugify('Björn Stroustrup')).toBe('bjorn-stroustrup');
    expect(slugify('José García')).toBe('jose-garcia');
  });

  it('lowercases', () => {
    expect(slugify('GRACE HOPPER')).toBe('grace-hopper');
  });

  it('trims spaces and collapses hyphens', () => {
    expect(slugify('  Grace   Hopper  ')).toBe('grace-hopper');
    expect(slugify('Grace---Hopper')).toBe('grace-hopper');
  });

  it('removes special characters', () => {
    expect(slugify("O'Reilly")).toBe('oreilly');
    expect(slugify('John (Jack) Doe')).toBe('john-jack-doe');
  });

  it('handles Korean characters', () => {
    expect(slugify('조 코딩')).toBe(''); // No ASCII equivalent, but doesn't crash
  });
});

describe('resolveSlug', () => {
  it('uses explicit slug if present', () => {
    const front: PersonFileFront = {
      name: 'Grace Hopper',
      knownFor: 'Some knownFor string that is at least 50 characters long.',
      slug: 'my-custom-slug',
    };

    const result = resolveSlug(front, 'grace-hopper.md');
    expect(result).toBe('my-custom-slug');
  });

  it('derives slug from name if absent', () => {
    const front: PersonFileFront = {
      name: 'Grace Hopper',
      knownFor: 'Some knownFor string that is at least 50 characters long.',
    };

    const result = resolveSlug(front, 'grace-hopper.md');
    expect(result).toBe('grace-hopper');
  });

  it('throws on invalid explicit slug', () => {
    const front: PersonFileFront = {
      name: 'Grace Hopper',
      knownFor: 'Some knownFor string that is at least 50 characters long.',
      slug: 'invalid_slug!',
    };

    expect(() => resolveSlug(front, 'grace-hopper.md')).toThrow();
  });

  it('throws if slug cannot be derived from name', () => {
    const front: PersonFileFront = {
      name: '!!!',
      knownFor: 'Some knownFor string that is at least 50 characters long.',
    };

    expect(() => resolveSlug(front, 'test.md')).toThrow();
  });
});
