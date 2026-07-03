import { describe, it, expect } from 'vitest';
import { mergePair, validatePair } from './merge';
import type { PersonFileFront } from './schema';

describe('mergePair', () => {
  const koFront: PersonFileFront = {
    name: '그레이스 호퍼',
    knownFor: 'COBOL 프로그래밍 언어 발명, 컴파일러 개념 선구자, 미 해군 최초의 여성 제독 중 한 명.',
    slug: 'grace-hopper',
    tags: ['c', 'architecture'],
    era: '1960-1980',
    nationality: 'US',
    birthYear: 1906,
    deathYear: 1992,
    achievements: [
      { year: 1952, title: '최초의 컴파일러 A-0 시스템 개발' },
      { year: 1959, title: 'COBOL 언어 설계 주도' },
    ],
    books: [{ title: 'Understanding Computers', year: 1984, url: 'https://example.com' }],
  };

  const enFront: PersonFileFront = {
    name: 'Grace Hopper',
    knownFor:
      'Inventor of COBOL programming language, pioneer of compiler concepts, groundbreaking female computer scientist.',
    birthYear: 1906,
    deathYear: 1992,
    achievements: [
      { year: 1952, title: 'Developed A-0, the first compiler system' },
      { year: 1959, title: 'Led COBOL language design' },
    ],
    books: [{ title: 'Understanding Computers', year: 1984 }],
  };

  it('merges ko + en with canonical rule', () => {
    const merged = mergePair(koFront, enFront, 'grace-hopper.md');

    expect(merged.slug).toBe('grace-hopper');
    expect(merged.tags).toEqual(['c', 'architecture']);
    expect(merged.era).toBe('1960-1980');
    expect(merged.nationality).toBe('US');
    expect(merged.ko.name).toBe('그레이스 호퍼');
    expect(merged.en.name).toBe('Grace Hopper');
    expect(merged.birthYear).toBe(1906);
    expect(merged.deathYear).toBe(1992);
  });

  it('merges achievements with ko canonical + en titles', () => {
    const merged = mergePair(koFront, enFront, 'grace-hopper.md');

    expect(merged.achievements).toHaveLength(2);
    expect(merged.achievements![0].year).toBe(1952);
    expect(merged.achievements![0].ko).toBe('최초의 컴파일러 A-0 시스템 개발');
    expect(merged.achievements![0].en).toBe('Developed A-0, the first compiler system');
  });

  it('merges books with ko canonical + en titles', () => {
    const merged = mergePair(koFront, enFront, 'grace-hopper.md');

    expect(merged.books).toHaveLength(1);
    expect(merged.books![0].ko).toBe('Understanding Computers');
    expect(merged.books![0].en).toBe('Understanding Computers');
    expect(merged.books![0].year).toBe(1984);
    expect(merged.books![0].url).toBe('https://example.com');
  });

  it('inherits en tags from ko if en lacks tags', () => {
    const enFrontNoTags = { ...enFront, tags: undefined };
    const merged = mergePair(koFront, enFrontNoTags, 'grace-hopper.md');

    expect(merged.tags).toEqual(['c', 'architecture']);
  });

  it('inherits en era from ko if en lacks era', () => {
    const enFrontNoEra = { ...enFront, era: undefined };
    const merged = mergePair(koFront, enFrontNoEra, 'grace-hopper.md');

    expect(merged.era).toBe('1960-1980');
  });
});

describe('validatePair', () => {
  const koFront: PersonFileFront = {
    name: '그레이스 호퍼',
    knownFor: 'COBOL 프로그래밍 언어 발명, 컴파일러 개념 선구자, 미 해군 최초의 여성 제독 중 한 명.',
    slug: 'grace-hopper',
    tags: ['c', 'architecture'],
    era: '1960-1980',
    nationality: 'US',
    birthYear: 1906,
    deathYear: 1992,
    biography_body: `## 소개

그레이스 호퍼는 미국 컴퓨터 과학자이자 미 해군 장성으로, COBOL 프로그래밍 언어 발명과 컴파일러 개념의 선구자로 알려져 있습니다. 1906년 뉴욕에서 태어나 수학과 물리학을 공부했으며, 제2차 세계대전 중 해군에 입대하여 ENIAC 프로젝트에 참여했습니다.

## 일화

호퍼는 프로그래밍의 선구자로서 많은 혁신을 이뤘습니다.`,
  };

  const enFront: PersonFileFront = {
    name: 'Grace Hopper',
    knownFor: 'Inventor of COBOL and pioneer of compiler concepts.',
    birthYear: 1906,
    deathYear: 1992,
    biography_body: `## About

Grace Hopper was an American computer scientist and rear admiral in the United States Navy. She was a pioneer of computer programming and is famous for her work on the COBOL programming language. Born in New York in 1906, she studied mathematics and physics before enlisting in the Navy during World War II.

## Anecdotes

Hopper made many innovations as a pioneer in programming.`,
  };

  it('validates valid pair', () => {
    const result = validatePair('grace-hopper.md', koFront, enFront);

    expect(result.errors).toHaveLength(0);
    expect(result.person).not.toBeNull();
    expect(result.person?.slug).toBe('grace-hopper');
  });

  it('reports year sanity error (birthYear > deathYear)', () => {
    const invalid = {
      ...koFront,
      birthYear: 1992,
      deathYear: 1906,
    };

    const result = validatePair('grace-hopper.md', invalid, enFront);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('birthYear');
    expect(result.errors[0]).toContain('deathYear');
  });

  it('reports photoCredit missing error if photo present', () => {
    const invalid = {
      ...koFront,
      photo: 'grace-hopper.jpg',
      photoCredit: undefined,
    };

    const result = validatePair('grace-hopper.md', invalid, enFront);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('photoCredit');
  });

  it('reports achievements count mismatch', () => {
    const koWithAch = {
      ...koFront,
      achievements: [
        { year: 1952, title: 'Achievement 1' },
        { year: 1959, title: 'Achievement 2' },
      ],
    };

    const enWithDiffAch = {
      ...enFront,
      achievements: [{ year: 1952, title: 'Achievement 1' }],
    };

    const result = validatePair('grace-hopper.md', koWithAch, enWithDiffAch);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('achievements');
    expect(result.errors[0]).toContain('count mismatch');
  });

  it('reports achievements year mismatch', () => {
    const koWithAch = {
      ...koFront,
      achievements: [
        { year: 1952, title: 'Achievement 1' },
        { year: 1959, title: 'Achievement 2' },
      ],
    };

    const enWithMismatchYear = {
      ...enFront,
      achievements: [
        { year: 1952, title: 'Achievement 1' },
        { year: 1960, title: 'Achievement 2' }, // Wrong year
      ],
    };

    const result = validatePair('grace-hopper.md', koWithAch, enWithMismatchYear);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('year mismatch');
  });

  it('reports books count mismatch', () => {
    const koWithBooks = {
      ...koFront,
      books: [
        { title: 'Book 1', year: 1984 },
        { title: 'Book 2', year: 1990 },
      ],
    };

    const enWithDiffBooks = {
      ...enFront,
      books: [{ title: 'Book 1', year: 1984 }],
    };

    const result = validatePair('grace-hopper.md', koWithBooks, enWithDiffBooks);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('books');
  });

  // === NEW VALIDATION TESTS ===

  it('reports missing tags in ko file', () => {
    const invalid = { ...koFront, tags: undefined };
    const result = validatePair('grace-hopper.md', invalid, enFront);
    expect(result.errors.some((e) => e.includes('tag'))).toBe(true);
  });

  it('reports missing era in ko file', () => {
    const invalid = { ...koFront, era: undefined };
    const result = validatePair('grace-hopper.md', invalid, enFront);
    expect(result.errors.some((e) => e.includes('era'))).toBe(true);
  });

  it('reports missing nationality in ko file', () => {
    const invalid = { ...koFront, nationality: undefined };
    const result = validatePair('grace-hopper.md', invalid, enFront);
    expect(result.errors.some((e) => e.includes('nationality'))).toBe(true);
  });

  it('reports missing ko biography body', () => {
    const invalid = { ...koFront, biography_body: undefined };
    const result = validatePair('grace-hopper.md', invalid, enFront);
    expect(result.errors.some((e) => e.includes('biography'))).toBe(true);
  });

  it('reports empty ko biography body', () => {
    const invalid = { ...koFront, biography_body: '   ' };
    const result = validatePair('grace-hopper.md', invalid, enFront);
    expect(result.errors.some((e) => e.includes('biography'))).toBe(true);
  });

  it('reports ko biography too short', () => {
    const invalid = { ...koFront, biography_body: '## 소개\n아주 짧은 본문' };
    const result = validatePair('grace-hopper.md', invalid, enFront);
    expect(result.errors.some((e) => e.includes('too short'))).toBe(true);
  });

  it('reports missing "## 소개" heading in ko biography', () => {
    const tooLong = 'A'.repeat(150);
    const invalid = { ...koFront, biography_body: `## 다른제목\n${tooLong}` };
    const result = validatePair('grace-hopper.md', invalid, enFront);
    expect(result.errors.some((e) => e.includes('소개'))).toBe(true);
  });

  it('reports missing "## About" heading in en biography', () => {
    const tooLong = 'A'.repeat(150);
    const invalid = { ...enFront, biography_body: `## Different Heading\n${tooLong}` };
    const result = validatePair('grace-hopper.md', koFront, invalid);
    expect(result.errors.some((e) => e.includes('About'))).toBe(true);
  });

  it('accepts non-http link URL', () => {
    const koWithFtpLink = {
      ...koFront,
      links: [{ label: 'FTP', url: 'ftp://example.com' }],
    };
    const result = validatePair('grace-hopper.md', koWithFtpLink, enFront);
    // Should fail due to non-http scheme
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('http'))).toBe(true);
  });

  it('accepts valid https link URL', () => {
    const koWithHttpsLink = {
      ...koFront,
      links: [{ label: 'Example', url: 'https://example.com' }],
    };
    const result = validatePair('grace-hopper.md', koWithHttpsLink, enFront);
    // Should not fail for https
    const httpErrors = result.errors.filter((e) => e.includes('http'));
    expect(httpErrors).toHaveLength(0);
  });
});
