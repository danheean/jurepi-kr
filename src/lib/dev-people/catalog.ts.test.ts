import { describe, it, expect } from 'vitest';
import {
  allPeople,
  byId,
  byTag,
  byEra,
  peoples,
  hasSlug,
  validateRelated,
} from './catalog';
import type { MergedPerson } from './schema';

const mockCatalog: MergedPerson[] = [
  {
    slug: 'grace-hopper',
    tags: ['c', 'architecture'],
    era: '1960-1980',
    nationality: 'US',
    ko: { name: '그레이스 호퍼', knownFor: 'COBOL 발명자' },
    en: { name: 'Grace Hopper', knownFor: 'COBOL inventor' },
    birthYear: 1906,
    deathYear: 1992,
  },
  {
    slug: 'guido-van-rossum',
    tags: ['python'],
    era: '2000-present',
    nationality: 'NL',
    ko: { name: '귀도 판 로섬', knownFor: 'Python 발명자' },
    en: { name: 'Guido van Rossum', knownFor: 'Python creator' },
    birthYear: 1956,
  },
  {
    slug: 'linus-torvalds',
    tags: ['linux', 'c', 'git'],
    era: '1980-2000',
    nationality: 'FI',
    ko: { name: '리누스 토르발즈', knownFor: 'Linux 및 Git 창시자' },
    en: { name: 'Linus Torvalds', knownFor: 'Linux and Git creator' },
    birthYear: 1969,
  },
];

describe('catalog functions', () => {
  describe('allPeople', () => {
    it('returns all people in order', () => {
      const result = allPeople(mockCatalog);
      expect(result).toHaveLength(3);
      expect(result[0].slug).toBe('grace-hopper');
      expect(result[1].slug).toBe('guido-van-rossum');
      expect(result[2].slug).toBe('linus-torvalds');
    });
  });

  describe('byId', () => {
    it('finds person by slug', () => {
      const result = byId(mockCatalog, 'grace-hopper');
      expect(result?.ko.name).toBe('그레이스 호퍼');
    });

    it('returns undefined if not found', () => {
      const result = byId(mockCatalog, 'nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('byTag', () => {
    it('filters people by tag', () => {
      const result = byTag(mockCatalog, 'c');
      expect(result).toHaveLength(2); // grace-hopper, linus-torvalds
      expect(result.map((p) => p.slug)).toEqual(['grace-hopper', 'linus-torvalds']);
    });

    it('returns empty array if no match', () => {
      const result = byTag(mockCatalog, 'java');
      expect(result).toHaveLength(0);
    });

    it('filters by other tags', () => {
      const result = byTag(mockCatalog, 'python');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('guido-van-rossum');
    });
  });

  describe('byEra', () => {
    it('filters people by era', () => {
      const result = byEra(mockCatalog, '1960-1980');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('grace-hopper');
    });

    it('returns empty array if no match', () => {
      const result = byEra(mockCatalog, '1940-1960');
      expect(result).toHaveLength(0);
    });
  });

  describe('peoples', () => {
    it('returns list of all person slugs', () => {
      const result = peoples(mockCatalog);
      expect(result).toEqual(['grace-hopper', 'guido-van-rossum', 'linus-torvalds']);
    });
  });

  describe('hasSlug', () => {
    it('returns true if slug exists', () => {
      expect(hasSlug(mockCatalog, 'grace-hopper')).toBe(true);
    });

    it('returns false if slug not found', () => {
      expect(hasSlug(mockCatalog, 'nonexistent')).toBe(false);
    });
  });

  describe('validateRelated', () => {
    it('returns empty array if all related slugs exist', () => {
      const relatedSlugs = ['guido-van-rossum', 'linus-torvalds'];
      const result = validateRelated(mockCatalog, relatedSlugs);
      expect(result).toEqual([]);
    });

    it('returns missing slugs', () => {
      const relatedSlugs = ['guido-van-rossum', 'nonexistent', 'also-missing'];
      const result = validateRelated(mockCatalog, relatedSlugs);
      expect(result).toEqual(['nonexistent', 'also-missing']);
    });

    it('returns empty array if related is undefined', () => {
      const result = validateRelated(mockCatalog, undefined);
      expect(result).toEqual([]);
    });
  });
});
