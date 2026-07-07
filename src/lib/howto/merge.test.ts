import { describe, it, expect } from 'vitest';
import { mergePair, validatePair } from './merge';
import { MergedGuide } from './schema';

describe('mergePair', () => {
  it('merges valid ko/en pair', () => {
    const koFront = {
      title: 'Installation',
      summary: 'How to install',
      slug: 'install-guide',
      topic: 'setup' as const,
      tags: ['setup', 'cli'],
      order: 1,
      updated: '2026-07-06',
      difficulty: 'beginner' as const,
      coverImage: '/images/howto/install/cover.png',
      related: ['other-guide']
    };
    const koBody = 'Korean body content';
    const enFront = {
      title: 'Installation',
      summary: 'How to install'
    };
    const enBody = 'English body content';

    const result = mergePair(koFront, koBody, enFront, enBody, 'install-guide.md');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.slug).toBe('install-guide');
      expect(result.value.topic).toBe('setup');
      expect(result.value.tags).toEqual(['setup', 'cli']);
      expect(result.value.order).toBe(1);
      expect(result.value.updated).toBe('2026-07-06');
      expect(result.value.difficulty).toBe('beginner');
      expect(result.value.coverImage).toBe('/images/howto/install/cover.png');
      expect(result.value.related).toEqual(['other-guide']);
      expect(result.value.ko.title).toBe('Installation');
      expect(result.value.ko.body).toBe('Korean body content');
      expect(result.value.en.title).toBe('Installation');
      expect(result.value.en.body).toBe('English body content');
    }
  });

  it('inherits structural metadata from KO to EN', () => {
    const koFront = {
      title: 'KO Title',
      summary: 'KO Summary',
      topic: 'setup' as const,
      tags: ['tag1'],
      order: 5,
      updated: '2026-01-01',
      difficulty: 'intermediate' as const,
      coverImage: '/images/howto/test/cover.png',
      related: ['ref1']
    };
    const enFront = {
      title: 'EN Title',
      summary: 'EN Summary'
    };

    const result = mergePair(koFront, 'KO body', enFront, 'EN body', 'test.md');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.topic).toBe('setup');
      expect(result.value.tags).toEqual(['tag1']);
      expect(result.value.order).toBe(5);
      expect(result.value.updated).toBe('2026-01-01');
      expect(result.value.difficulty).toBe('intermediate');
      expect(result.value.coverImage).toBe('/images/howto/test/cover.png');
      expect(result.value.related).toEqual(['ref1']);
    }
  });

  it('fails if KO missing topic', () => {
    const koFront = {
      title: 'Test',
      summary: 'Summary'
    };
    const enFront = {
      title: 'Test',
      summary: 'Summary'
    };

    const result = mergePair(koFront, 'Body', enFront, 'Body', 'test.md');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'topic')).toBe(true);
    }
  });

  it('fails if KO missing title', () => {
    const koFront = {
      title: '',
      summary: 'Summary',
      topic: 'setup' as const
    };
    const enFront = {
      title: 'Test',
      summary: 'Summary'
    };

    const result = mergePair(koFront, 'Body', enFront, 'Body', 'test.md');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'ko.title')).toBe(true);
    }
  });

  it('fails if EN missing title', () => {
    const koFront = {
      title: 'Test',
      summary: 'Summary',
      topic: 'setup' as const
    };
    const enFront = {
      title: '',
      summary: 'Summary'
    };

    const result = mergePair(koFront, 'Body', enFront, 'Body', 'test.md');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'en.title')).toBe(true);
    }
  });

  it('fails if body is empty', () => {
    const koFront = {
      title: 'Test',
      summary: 'Summary',
      topic: 'setup' as const
    };
    const enFront = {
      title: 'Test',
      summary: 'Summary'
    };

    const result = mergePair(koFront, '', enFront, 'EN Body', 'test.md');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'ko.body')).toBe(true);
    }
  });

  it('derives slug from filename if not provided', () => {
    const koFront = {
      title: 'Test',
      summary: 'Summary',
      topic: 'setup' as const
    };
    const enFront = {
      title: 'Test',
      summary: 'Summary'
    };

    const result = mergePair(koFront, 'Body', enFront, 'Body', 'my-guide.md');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.slug).toBe('my-guide');
    }
  });
});

describe('validatePair', () => {
  it('passes validation for new unique slug', () => {
    const catalog: MergedGuide[] = [
      {
        slug: 'existing',
        topic: 'setup',
        tags: [],
        order: 1,
        related: [],
        ko: { title: 'T', summary: 'S', body: 'B' },
        en: { title: 'T', summary: 'S', body: 'B' }
      }
    ];
    const guide: MergedGuide = {
      slug: 'new-guide',
      topic: 'setup',
      tags: [],
      order: 1,
      related: [],
      ko: { title: 'T', summary: 'S', body: 'B' },
      en: { title: 'T', summary: 'S', body: 'B' }
    };

    const errors = validatePair('new-guide', guide, catalog);
    expect(errors).toHaveLength(0);
  });

  it('fails if slug is not unique', () => {
    const catalog: MergedGuide[] = [
      {
        slug: 'duplicate',
        topic: 'setup',
        tags: [],
        order: 1,
        related: [],
        ko: { title: 'T', summary: 'S', body: 'B' },
        en: { title: 'T', summary: 'S', body: 'B' }
      }
    ];
    const guide: MergedGuide = {
      slug: 'duplicate',
      topic: 'setup',
      tags: [],
      order: 1,
      related: [],
      ko: { title: 'T', summary: 'S', body: 'B' },
      en: { title: 'T', summary: 'S', body: 'B' }
    };

    const errors = validatePair('duplicate', guide, catalog);
    expect(errors).toContainEqual(expect.objectContaining({
      field: 'slug',
      reason: expect.stringContaining('not unique')
    }));
  });

  it('fails if related guide does not exist', () => {
    const catalog: MergedGuide[] = [
      {
        slug: 'guide1',
        topic: 'setup',
        tags: [],
        order: 1,
        related: [],
        ko: { title: 'T', summary: 'S', body: 'B' },
        en: { title: 'T', summary: 'S', body: 'B' }
      }
    ];
    const guide: MergedGuide = {
      slug: 'guide2',
      topic: 'setup',
      tags: [],
      order: 1,
      related: ['nonexistent'],
      ko: { title: 'T', summary: 'S', body: 'B' },
      en: { title: 'T', summary: 'S', body: 'B' }
    };

    const errors = validatePair('guide2', guide, catalog);
    expect(errors).toContainEqual(expect.objectContaining({
      field: 'related',
      reason: expect.stringContaining('nonexistent')
    }));
  });

  it('allows related reference to itself (being added)', () => {
    const catalog: MergedGuide[] = [
      {
        slug: 'other',
        topic: 'setup',
        tags: [],
        order: 1,
        related: [],
        ko: { title: 'T', summary: 'S', body: 'B' },
        en: { title: 'T', summary: 'S', body: 'B' }
      }
    ];
    const guide: MergedGuide = {
      slug: 'guide1',
      topic: 'setup',
      tags: [],
      order: 1,
      related: ['guide1', 'other'],
      ko: { title: 'T', summary: 'S', body: 'B' },
      en: { title: 'T', summary: 'S', body: 'B' }
    };

    const errors = validatePair('guide1', guide, catalog);
    expect(errors).toHaveLength(0);
  });
});
