import { describe, it, expect } from 'vitest';
import {
  PersonFileFromSchema,
  MergedPersonSchema,
  DevPeopleStoreSchema,
  TAG_VOCABULARY,
  ERA_VALUES,
  BIO_MIN_LENGTH,
  BIRTH_YEAR_MIN,
  safeJsonParse,
} from './schema';

describe('PersonFileFromSchema', () => {
  it('accepts valid person frontmatter', () => {
    const valid = {
      name: 'Grace Hopper',
      knownFor: 'Inventor of COBOL, pioneer of compiler concepts, groundbreaking female computer scientist.',
      tags: ['c', 'architecture'],
      era: '1960-1980',
      nationality: 'US',
      birthYear: 1906,
      deathYear: 1992,
    };

    const result = PersonFileFromSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const invalid = {
      knownFor: 'Some achievement',
      tags: ['java'],
      era: '2000-present',
      nationality: 'US',
    };

    const result = PersonFileFromSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects knownFor < 50 chars', () => {
    const invalid = {
      name: 'Grace Hopper',
      knownFor: 'Short bio',
      tags: ['java'],
      era: '2000-present',
      nationality: 'US',
    };

    const result = PersonFileFromSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid tag', () => {
    const invalid = {
      name: 'Grace Hopper',
      knownFor: 'This is a long enough knownFor string with at least 50 characters in it.',
      tags: ['java', 'invalid-tag'],
      era: '2000-present',
      nationality: 'US',
    };

    const result = PersonFileFromSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid era', () => {
    const invalid = {
      name: 'Grace Hopper',
      knownFor: 'This is a long enough knownFor string with at least 50 characters in it.',
      tags: ['java'],
      era: '1970-1990',
      nationality: 'US',
    };

    const result = PersonFileFromSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects birthYear < 1800', () => {
    const invalid = {
      name: 'Grace Hopper',
      knownFor: 'This is a long enough knownFor string with at least 50 characters in it.',
      tags: ['java'],
      era: '1960-1980',
      nationality: 'US',
      birthYear: 1799,
    };

    const result = PersonFileFromSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects birthYear > current year', () => {
    const futureYear = new Date().getFullYear() + 1;
    const invalid = {
      name: 'Grace Hopper',
      knownFor: 'This is a long enough knownFor string with at least 50 characters in it.',
      tags: ['java'],
      era: '1960-1980',
      nationality: 'US',
      birthYear: futureYear,
    };

    const result = PersonFileFromSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts optional slug if ASCII', () => {
    const valid = {
      name: 'Grace Hopper',
      slug: 'grace-hopper',
      knownFor: 'This is a long enough knownFor string with at least 50 characters in it.',
      tags: ['java'],
      era: '2000-present',
      nationality: 'US',
    };

    const result = PersonFileFromSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts achievements array', () => {
    const valid = {
      name: 'Grace Hopper',
      knownFor: 'This is a long enough knownFor string with at least 50 characters in it.',
      tags: ['java'],
      era: '2000-present',
      nationality: 'US',
      achievements: [
        { year: 1952, title: 'Developed A-0' },
        { year: 1959, title: 'Led COBOL design' },
      ],
    };

    const result = PersonFileFromSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.achievements).toHaveLength(2);
    }
  });

  it('accepts books array', () => {
    const valid = {
      name: 'Grace Hopper',
      knownFor: 'This is a long enough knownFor string with at least 50 characters in it.',
      tags: ['java'],
      era: '2000-present',
      nationality: 'US',
      books: [
        { title: 'Understanding Computers', year: 1984, url: 'https://example.com' },
      ],
    };

    const result = PersonFileFromSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects link with invalid URL format', () => {
    const invalid = {
      name: 'Grace Hopper',
      knownFor: 'This is a long enough knownFor string with at least 50 characters in it.',
      tags: ['java'],
      era: '2000-present',
      nationality: 'US',
      links: [
        { label: 'Example', url: 'not a valid url' },
      ],
    };

    const result = PersonFileFromSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('MergedPersonSchema', () => {
  it('accepts valid merged person', () => {
    const valid = {
      slug: 'grace-hopper',
      tags: ['c', 'architecture'],
      era: '1960-1980',
      nationality: 'US',
      ko: {
        name: '그레이스 호퍼',
        knownFor: 'COBOL 개발자이며 컴파일러 개념의 선구자.',
      },
      en: {
        name: 'Grace Hopper',
        knownFor: 'Inventor of COBOL and pioneer of compiler concepts.',
      },
      birthYear: 1906,
      deathYear: 1992,
    };

    const result = MergedPersonSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects missing ko.name', () => {
    const invalid = {
      slug: 'grace-hopper',
      tags: ['c'],
      era: '1960-1980',
      nationality: 'US',
      ko: {
        knownFor: 'Some knownFor string.',
      },
      en: {
        name: 'Grace Hopper',
        knownFor: 'Some knownFor.',
      },
    };

    const result = MergedPersonSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('DevPeopleStoreSchema', () => {
  it('accepts valid store', () => {
    const valid = {
      version: 1,
      favorites: ['grace-hopper', 'alan-turing'],
      recents: ['ada-lovelace', 'grace-hopper'],
      meta: {
        lastQuery: 'hopper',
        lastTag: 'c',
        lastEra: '1960-1980',
        createdAt: Date.now(),
      },
    };

    const result = DevPeopleStoreSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    const json = JSON.stringify({
      version: 1,
      favorites: [],
      recents: [],
      meta: { createdAt: Date.now() },
    });

    const result = safeJsonParse(json, DevPeopleStoreSchema);
    expect(result).not.toBeNull();
    expect(result?.version).toBe(1);
  });

  it('returns null on invalid JSON', () => {
    const result = safeJsonParse('not json', DevPeopleStoreSchema);
    expect(result).toBeNull();
  });

  it('returns null on schema mismatch', () => {
    const json = JSON.stringify({ version: 1 }); // Missing required fields
    const result = safeJsonParse(json, DevPeopleStoreSchema);
    expect(result).toBeNull();
  });
});
