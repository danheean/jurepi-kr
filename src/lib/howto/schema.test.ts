import { describe, it, expect } from 'vitest';
import {
  GuideFileFrontSchema,
  MergedGuideSchema,
  HowtoStoreSchema,
  STORE_VERSION,
  parseGuideFileFront,
  parseMergedGuide,
  parseHowtoStore
} from './schema';

describe('GuideFileFrontSchema', () => {
  it('accepts valid frontmatter', () => {
    const data = {
      title: 'How to Install',
      summary: 'A guide to installing',
      slug: 'install-guide',
      topic: 'setup',
      tags: ['installation', 'cli'],
      order: 1,
      updated: '2026-07-06',
      difficulty: 'beginner',
      coverImage: '/images/howto/install/cover.png',
      related: ['another-guide']
    };
    const result = GuideFileFrontSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('requires title and summary', () => {
    const data = { slug: 'test' };
    const result = GuideFileFrontSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const data = { title: '', summary: 'test' };
    const result = GuideFileFrontSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('allows optional fields', () => {
    const data = {
      title: 'Test',
      summary: 'Summary'
    };
    const result = GuideFileFrontSchema.safeParse(data);
    expect(result.success).toBe(true);
    const parsed = result.data as any;
    expect(parsed.tags).toEqual([]);
    expect(parsed.order).toBe(999);
    expect(parsed.slug).toBeUndefined();
  });

  it('validates slug format', () => {
    const data = {
      title: 'Test',
      summary: 'Summary',
      slug: 'Invalid_Slug_123'
    };
    const result = GuideFileFrontSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('validates topic enum', () => {
    const data = {
      title: 'Test',
      summary: 'Summary',
      topic: 'invalid-topic'
    };
    const result = GuideFileFrontSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('validates updated date format', () => {
    const data = {
      title: 'Test',
      summary: 'Summary',
      updated: '2026/07/06'
    };
    const result = GuideFileFrontSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('parseGuideFileFront', () => {
  it('returns ok true on valid data', () => {
    const result = parseGuideFileFront({
      title: 'Test',
      summary: 'Summary'
    });
    expect(result.ok).toBe(true);
    expect(result).toHaveProperty('value');
  });

  it('returns ok false on invalid data with error message', () => {
    const result = parseGuideFileFront({ title: '' });
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty('error');
    expect((result as any).error).toMatch(/title/);
  });
});

describe('MergedGuideSchema', () => {
  it('accepts valid merged guide', () => {
    const data = {
      slug: 'test-guide',
      topic: 'setup',
      tags: [],
      order: 1,
      related: [],
      ko: {
        title: '테스트',
        summary: '요약',
        body: '본문'
      },
      en: {
        title: 'Test',
        summary: 'Summary',
        body: 'Body'
      }
    };
    const result = MergedGuideSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('requires ko and en with title, summary, body', () => {
    const data = {
      slug: 'test',
      topic: 'setup',
      ko: { title: 'Test' }
    };
    const result = MergedGuideSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects empty body', () => {
    const data = {
      slug: 'test',
      topic: 'setup',
      ko: { title: 'T', summary: 'S', body: '' },
      en: { title: 'T', summary: 'S', body: 'B' }
    };
    const result = MergedGuideSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('parseMergedGuide', () => {
  it('returns ok true on valid data', () => {
    const result = parseMergedGuide({
      slug: 'test',
      topic: 'setup',
      tags: [],
      order: 1,
      related: [],
      ko: { title: 'T', summary: 'S', body: 'B' },
      en: { title: 'T', summary: 'S', body: 'B' }
    });
    expect(result.ok).toBe(true);
  });

  it('returns ok false on invalid data', () => {
    const result = parseMergedGuide({
      slug: 'Invalid_Slug',
      topic: 'setup',
      ko: { title: 'T', summary: 'S', body: 'B' },
      en: { title: 'T', summary: 'S', body: 'B' }
    });
    expect(result.ok).toBe(false);
  });
});

describe('HowtoStoreSchema', () => {
  it('accepts valid store', () => {
    const data = {
      version: STORE_VERSION,
      favorites: ['guide1', 'guide2'],
      recents: ['guide3'],
      meta: {
        lastTopic: 'setup',
        createdAt: Date.now()
      }
    };
    const result = HowtoStoreSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('requires version to match STORE_VERSION', () => {
    const data = {
      version: 99,
      favorites: []
    };
    const result = HowtoStoreSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('defaults to empty favorites/recents', () => {
    const data = { version: STORE_VERSION };
    const result = HowtoStoreSchema.safeParse(data);
    expect(result.success).toBe(true);
    expect((result.data as any).favorites).toEqual([]);
    expect((result.data as any).recents).toEqual([]);
  });
});

describe('parseHowtoStore', () => {
  it('returns ok true on valid data', () => {
    const result = parseHowtoStore({
      version: STORE_VERSION,
      favorites: [],
      recents: []
    });
    expect(result.ok).toBe(true);
  });

  it('returns ok false on invalid data', () => {
    const result = parseHowtoStore({
      version: 99
    });
    expect(result.ok).toBe(false);
  });
});
