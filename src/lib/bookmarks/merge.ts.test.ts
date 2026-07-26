import { describe, it, expect } from 'vitest';
import { mergePair, validatePair } from './merge';
import type { BookmarkFileFront } from './schema';

describe('bookmarks/merge', () => {
  const validKo: BookmarkFileFront = {
    title: '하네스 엔지니어링',
    description: '신뢰할 수 있는 자료',
    sections: [
      {
        heading: '메타 스킬',
        links: [
          { label: 'Agent', url: 'https://example.com/a' },
          { label: 'TDD', url: 'https://example.com/tdd' },
          { label: 'Review', url: 'https://example.com/review' },
        ],
      },
    ],
  };

  const validEn: BookmarkFileFront = {
    title: 'Harness Engineering',
    description: 'Trusted resources',
    sections: [
      {
        heading: 'Meta Skills',
        links: [
          { label: 'Agent', url: 'https://example.com/a' },
          { label: 'TDD', url: 'https://example.com/tdd' },
          { label: 'Review', url: 'https://example.com/review' },
        ],
      },
    ],
  };

  describe('mergePair', () => {
    it('merges ko + en with canonical slug from ko', () => {
      const result = mergePair(validKo, validEn, 'harness-engineering.md');
      expect(result.slug).toBe('harness-engineering');
      expect(result.ko.title).toBe('하네스 엔지니어링');
      expect(result.en.title).toBe('Harness Engineering');
    });

    it('preserves per-locale title/description', () => {
      const result = mergePair(validKo, validEn);
      expect(result.ko.description).toBe('신뢰할 수 있는 자료');
      expect(result.en.description).toBe('Trusted resources');
    });

    it('preserves per-locale sections', () => {
      const result = mergePair(validKo, validEn);
      expect(result.ko.sections[0].heading).toBe('메타 스킬');
      expect(result.en.sections[0].heading).toBe('Meta Skills');
    });

    it('uses custom slug from ko if present', () => {
      const koWithSlug: BookmarkFileFront = {
        ...validKo,
        slug: 'custom-id',
      };
      const result = mergePair(koWithSlug, validEn);
      expect(result.slug).toBe('custom-id');
    });

    it('captures per-locale long-form body when provided', () => {
      const result = mergePair(
        validKo,
        validEn,
        'x.md',
        '## 곡 이야기\n\n한국어 본문.',
        '## About\n\nEnglish body.'
      );
      expect(result.ko.body).toContain('곡 이야기');
      expect(result.en.body).toContain('English body');
    });

    it('omits body when absent or whitespace-only', () => {
      const noBody = mergePair(validKo, validEn);
      expect(noBody.ko.body).toBeUndefined();
      expect(noBody.en.body).toBeUndefined();

      const blank = mergePair(validKo, validEn, 'x.md', '   \n  ', '');
      expect(blank.ko.body).toBeUndefined();
      expect(blank.en.body).toBeUndefined();
    });

    it('trims surrounding whitespace from body', () => {
      const result = mergePair(validKo, validEn, 'x.md', '\n\n본문\n\n', '\n본문 en\n');
      expect(result.ko.body).toBe('본문');
      expect(result.en.body).toBe('본문 en');
    });

    it('strips a leading H1 from body (page owns the H1) but keeps ##', () => {
      const result = mergePair(
        validKo,
        validEn,
        'x.md',
        '# 제목\n\n## 곡 이야기\n\n본문 문단.',
        '# Title\n\n## Songs\n\nBody paragraph.'
      );
      expect(result.ko.body).toBe('## 곡 이야기\n\n본문 문단.');
      expect(result.en.body).toBe('## Songs\n\nBody paragraph.');
      expect(result.ko.body).not.toContain('# 제목');
    });

    it('merges with different link counts per locale', () => {
      const koWith2Links: BookmarkFileFront = {
        ...validKo,
        sections: [
          {
            heading: '메타',
            links: [
              { label: 'Link1', url: 'https://example.com/1' },
              { label: 'Link2', url: 'https://example.com/2' },
              { label: 'Link3', url: 'https://example.com/3' },
            ],
          },
        ],
      };
      const enWith4Links: BookmarkFileFront = {
        ...validEn,
        sections: [
          {
            heading: 'Meta',
            links: [
              { label: 'Link1', url: 'https://example.com/1' },
              { label: 'Link2', url: 'https://example.com/2' },
              { label: 'Link3', url: 'https://example.com/3' },
              { label: 'Link4', url: 'https://example.com/4' },
            ],
          },
        ],
      };
      const result = mergePair(koWith2Links, enWith4Links);
      expect(result.ko.sections[0].links.length).toBe(3);
      expect(result.en.sections[0].links.length).toBe(4);
    });
  });

  describe('validatePair', () => {
    it('validates a correct pair', () => {
      const result = validatePair('test.md', validKo, validEn);
      expect(result.topic).not.toBeNull();
      expect(result.errors.length).toBe(0);
    });

    it('catches KO parse error', () => {
      const invalidKo = {
        title: '', // Invalid: empty title
        description: 'Desc',
        sections: [{ heading: 'H', links: [{ label: 'L', url: 'https://example.com' }] }],
      };
      const result = validatePair('test.md', invalidKo, validEn);
      expect(result.topic).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('KO parse error');
    });

    it('catches EN parse error', () => {
      const invalidEn = {
        title: 'Title',
        description: '', // Invalid: empty description
        sections: [{ heading: 'H', links: [{ label: 'L', url: 'https://example.com' }] }],
      };
      const result = validatePair('test.md', validKo, invalidEn);
      expect(result.topic).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('EN parse error');
    });

    it('rejects KO with <3 total links', () => {
      const koWith2Links: BookmarkFileFront = {
        title: 'Test',
        description: 'Desc',
        sections: [
          {
            heading: 'H',
            links: [
              { label: 'L1', url: 'https://example.com/1' },
              { label: 'L2', url: 'https://example.com/2' },
            ],
          },
        ],
      };
      const result = validatePair('test.md', koWith2Links, validEn);
      expect(result.topic).toBeNull();
      expect(result.errors.some((e) => e.includes('KO') && e.includes('links'))).toBe(true);
    });

    it('rejects EN with <3 total links', () => {
      const enWith1Link: BookmarkFileFront = {
        title: 'Test',
        description: 'Desc',
        sections: [
          {
            heading: 'H',
            links: [{ label: 'L1', url: 'https://example.com/1' }],
          },
        ],
      };
      const result = validatePair('test.md', validKo, enWith1Link);
      expect(result.topic).toBeNull();
      expect(result.errors.some((e) => e.includes('EN') && e.includes('links'))).toBe(true);
    });

    it('allows exactly 3 links (min)', () => {
      const result = validatePair('test.md', validKo, validEn);
      expect(result.topic).not.toBeNull();
      expect(result.errors.length).toBe(0);
    });

    it('allows >3 links', () => {
      const koWith5Links: BookmarkFileFront = {
        ...validKo,
        sections: [
          {
            heading: 'H',
            links: [
              { label: 'L1', url: 'https://example.com/1' },
              { label: 'L2', url: 'https://example.com/2' },
              { label: 'L3', url: 'https://example.com/3' },
              { label: 'L4', url: 'https://example.com/4' },
              { label: 'L5', url: 'https://example.com/5' },
            ],
          },
        ],
      };
      const enWith5Links: BookmarkFileFront = {
        ...validEn,
        sections: [
          {
            heading: 'H',
            links: [
              { label: 'L1', url: 'https://example.com/1' },
              { label: 'L2', url: 'https://example.com/2' },
              { label: 'L3', url: 'https://example.com/3' },
              { label: 'L4', url: 'https://example.com/4' },
              { label: 'L5', url: 'https://example.com/5' },
            ],
          },
        ],
      };
      const result = validatePair('test.md', koWith5Links, enWith5Links);
      expect(result.topic).not.toBeNull();
      expect(result.errors.length).toBe(0);
    });

    it('collects errors from parse failure and link count', () => {
      const koWith1Link = {
        title: '', // Invalid: empty title
        description: 'Valid description',
        sections: [
          {
            heading: 'H',
            links: [{ label: 'L1', url: 'https://example.com' }], // Only 1 link (invalid)
          },
        ],
      };
      const result = validatePair('test.md', koWith1Link, validEn);
      // Should have parse error (empty title) + link count error
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('title'))).toBe(true);
    });
  });
});
