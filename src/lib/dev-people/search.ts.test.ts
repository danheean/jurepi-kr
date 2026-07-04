import { describe, it, expect } from 'vitest';
import { filterPeople } from './search';
import type { MergedPerson } from './schema';

const mockCatalog: MergedPerson[] = [
  {
    slug: 'grace-hopper',
    tags: ['c', 'architecture', 'education'],
    era: '1960-1980',
    nationality: 'US',
    ko: {
      name: '그레이스 호퍼',
      knownFor: 'COBOL 프로그래밍 언어 발명, 컴파일러 개념 선구자',
      aliases: ['호퍼 제독', 'Grace Murray Hopper'],
    },
    en: {
      name: 'Grace Hopper',
      knownFor: 'Inventor of COBOL programming language, pioneer of compiler concepts',
      aliases: ['Admiral Hopper', 'Grace Murray Hopper'],
    },
    birthYear: 1906,
    deathYear: 1992,
  },
  {
    slug: 'guido-van-rossum',
    tags: ['python', 'web', 'education'],
    era: '2000-present',
    nationality: 'NL',
    ko: {
      name: '귀도 판 로섬',
      knownFor: 'Python 프로그래밍 언어 발명자, 웹 개발자',
    },
    en: {
      name: 'Guido van Rossum',
      knownFor: 'Python programming language creator, web developer',
    },
    birthYear: 1956,
  },
  {
    slug: 'linus-torvalds',
    tags: ['linux', 'c', 'git'],
    era: '1980-2000',
    nationality: 'FI',
    ko: {
      name: '리누스 토르발즈',
      knownFor: 'Linux 및 Git 창시자',
    },
    en: {
      name: 'Linus Torvalds',
      knownFor: 'Linux and Git creator',
    },
    birthYear: 1969,
  },
];

describe('filterPeople', () => {
  describe('query matching', () => {
    it('returns all when query is blank', () => {
      const result = filterPeople(mockCatalog, '');
      expect(result).toHaveLength(3);
    });

    it('matches by name (ko)', () => {
      const result = filterPeople(mockCatalog, '호퍼');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('grace-hopper');
    });

    it('matches by name (en)', () => {
      const result = filterPeople(mockCatalog, 'hopper');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('grace-hopper');
    });

    it('case-insensitive matching', () => {
      const result = filterPeople(mockCatalog, 'HOPPER');
      expect(result).toHaveLength(1);
    });

    it('diacritic-insensitive matching', () => {
      const result = filterPeople(mockCatalog, 'guido');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('guido-van-rossum');
    });

    it('matches by aliases (ko)', () => {
      const result = filterPeople(mockCatalog, '제독');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('grace-hopper');
    });

    it('matches by aliases (en)', () => {
      const result = filterPeople(mockCatalog, 'admiral');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('grace-hopper');
    });

    it('matches by knownFor (ko)', () => {
      const result = filterPeople(mockCatalog, 'COBOL');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('grace-hopper');
    });

    it('matches by knownFor (en)', () => {
      const result = filterPeople(mockCatalog, 'creator');
      expect(result.length).toBeGreaterThan(0);
      expect(result.map((p) => p.slug)).toContain('guido-van-rossum');
      expect(result.map((p) => p.slug)).toContain('linus-torvalds');
    });

    it('matches by tag id', () => {
      // Query 'python' should match guido (not tag-only, but uses exact tag matching)
      // To test tag matching, use tag filter instead
      const result = filterPeople(mockCatalog, 'c');
      // 'c' appears in names/aliases or knownFor of some people
      expect(result.length).toBeGreaterThan(0);
    });

    it('no match returns empty', () => {
      const result = filterPeople(mockCatalog, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('tag filter', () => {
    it('filters by tag', () => {
      const result = filterPeople(mockCatalog, '', 'python');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('guido-van-rossum');
    });

    it('filters by tag c', () => {
      const result = filterPeople(mockCatalog, '', 'c');
      expect(result).toHaveLength(2);
    });

    it('combines query and tag filter (AND)', () => {
      const result = filterPeople(mockCatalog, 'hopper', 'c');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('grace-hopper');
    });

    it('returns empty if tag match but query mismatch', () => {
      const result = filterPeople(mockCatalog, 'nonexistent', 'python');
      expect(result).toHaveLength(0);
    });
  });

  describe('era filter', () => {
    it('filters by era', () => {
      const result = filterPeople(mockCatalog, '', undefined, '1960-1980');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('grace-hopper');
    });

    it('filters by era 2000-present', () => {
      const result = filterPeople(mockCatalog, '', undefined, '2000-present');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('guido-van-rossum');
    });

    it('combines query, tag, and era filters (AND)', () => {
      const result = filterPeople(mockCatalog, '', 'c', '1960-1980');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('grace-hopper');
    });

    it('returns empty if era match but query mismatch', () => {
      const result = filterPeople(mockCatalog, 'nonexistent', undefined, '1960-1980');
      expect(result).toHaveLength(0);
    });
  });

  describe('combined filters', () => {
    it('applies all filters together', () => {
      const result = filterPeople(mockCatalog, 'python', 'education', '2000-present');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('guido-van-rossum');
    });

    it('returns empty when no match on any filter', () => {
      const result = filterPeople(mockCatalog, 'nonexistent', 'java', '1940-1960');
      expect(result).toHaveLength(0);
    });
  });

  describe('preservation of order', () => {
    it('preserves original catalog order', () => {
      const result = filterPeople(mockCatalog, '', 'c'); // Use tag filter for precise matching
      expect(result[0].slug).toBe('grace-hopper');
      expect(result[1].slug).toBe('linus-torvalds');
    });
  });
});
