import { describe, it, expect } from 'vitest';
import {
  BookmarkFileFrontSchema,
  MergedTopicSchema,
  BookmarksStoreSchema,
  safeJsonParse,
  STORE_VERSION,
  RECENTS_MAX,
  SEARCH_DEBOUNCE,
  LINK_DESC_MAX,
  SECTION_MAX,
  LINKS_MIN_PER_TOPIC,
} from './schema';

describe('bookmarks/schema', () => {
  describe('constants', () => {
    it('exports expected constants', () => {
      expect(STORE_VERSION).toBe(1);
      expect(RECENTS_MAX).toBe(20);
      expect(SEARCH_DEBOUNCE).toBe(120);
      expect(LINK_DESC_MAX).toBe(100);
      expect(SECTION_MAX).toBe(10);
      expect(LINKS_MIN_PER_TOPIC).toBe(3);
    });
  });

  describe('BookmarkFileFrontSchema', () => {
    it('accepts valid frontmatter', () => {
      const valid = {
        title: '하네스 엔지니어링',
        description: '신뢰할 수 있는 하네스 엔지니어링 자료',
        sections: [
          {
            heading: '메타 스킬',
            links: [
              { label: 'Agent Orchestration', url: 'https://example.com/agent' },
              { label: 'TDD', url: 'https://example.com/tdd' },
              { label: 'Code Review', url: 'https://example.com/review' },
            ],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('하네스 엔지니어링');
      }
    });

    it('rejects title: empty', () => {
      const invalid = {
        title: '',
        description: 'test',
        sections: [
          {
            heading: 'Test',
            links: [{ label: 'Link', url: 'https://example.com' }],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects description: empty', () => {
      const invalid = {
        title: 'Title',
        description: '',
        sections: [
          {
            heading: 'Test',
            links: [{ label: 'Link', url: 'https://example.com' }],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects description: exceeds max 200 chars', () => {
      const invalid = {
        title: 'Title',
        description: 'a'.repeat(201),
        sections: [
          {
            heading: 'Test',
            links: [{ label: 'Link', url: 'https://example.com' }],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects sections: empty array', () => {
      const invalid = {
        title: 'Title',
        description: 'Description',
        sections: [],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects section heading: empty', () => {
      const invalid = {
        title: 'Title',
        description: 'Description',
        sections: [
          {
            heading: '',
            links: [{ label: 'Link', url: 'https://example.com' }],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects section links: empty array', () => {
      const invalid = {
        title: 'Title',
        description: 'Description',
        sections: [
          {
            heading: 'Section',
            links: [],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects link label: empty', () => {
      const invalid = {
        title: 'Title',
        description: 'Description',
        sections: [
          {
            heading: 'Section',
            links: [{ label: '', url: 'https://example.com' }],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects link url: not valid http(s)', () => {
      const invalid = {
        title: 'Title',
        description: 'Description',
        sections: [
          {
            heading: 'Section',
            links: [{ label: 'Link', url: 'not-a-url' }],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts link description: optional, ≤100 chars', () => {
      const valid = {
        title: 'Title',
        description: 'Description',
        sections: [
          {
            heading: 'Section',
            links: [
              {
                label: 'Link',
                url: 'https://example.com',
                description: 'A short description',
              },
            ],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects link description: exceeds 100 chars', () => {
      const invalid = {
        title: 'Title',
        description: 'Description',
        sections: [
          {
            heading: 'Section',
            links: [
              {
                label: 'Link',
                url: 'https://example.com',
                description: 'a'.repeat(101),
              },
            ],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts optional slug: alphanumeric + hyphens', () => {
      const valid = {
        title: 'Title',
        description: 'Description',
        slug: 'custom-slug-123',
        sections: [
          {
            heading: 'Section',
            links: [{ label: 'Link', url: 'https://example.com' }],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects slug: contains invalid chars', () => {
      const invalid = {
        title: 'Title',
        description: 'Description',
        slug: 'invalid_slug!',
        sections: [
          {
            heading: 'Section',
            links: [{ label: 'Link', url: 'https://example.com' }],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts optional youtubeId: 11-char ID', () => {
      const valid = {
        title: 'Title',
        description: 'Description',
        sections: [
          {
            heading: 'Section',
            links: [
              {
                label: 'Link',
                url: 'https://www.youtube.com/watch?v=hoY1Z08VhH0',
                youtubeId: 'hoY1Z08VhH0',
              },
            ],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects youtubeId: not 11 chars', () => {
      const invalid = {
        title: 'Title',
        description: 'Description',
        sections: [
          {
            heading: 'Section',
            links: [
              {
                label: 'Link',
                url: 'https://www.youtube.com/watch?v=hoY1Z08VhH0',
                youtubeId: 'short',
              },
            ],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts optional image: valid HTTPS URL', () => {
      const valid = {
        title: 'Title',
        description: 'Description',
        sections: [
          {
            heading: 'Section',
            links: [
              {
                label: 'Link',
                url: 'https://example.com',
                image: 'https://example.com/image.jpg',
              },
            ],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects image: not a valid URL', () => {
      const invalid = {
        title: 'Title',
        description: 'Description',
        sections: [
          {
            heading: 'Section',
            links: [
              {
                label: 'Link',
                url: 'https://example.com',
                image: 'not-a-url',
              },
            ],
          },
        ],
      };
      const result = BookmarkFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('MergedTopicSchema', () => {
    it('accepts valid merged topic', () => {
      const valid = {
        slug: 'harness-engineering',
        ko: {
          title: '하네스 엔지니어링',
          description: '신뢰할 수 있는 자료',
          sections: [
            {
              heading: '메타 스킬',
              links: [
                {
                  label: 'Agent',
                  url: 'https://example.com/a',
                },
              ],
            },
          ],
        },
        en: {
          title: 'Harness Engineering',
          description: 'Trusted resources',
          sections: [
            {
              heading: 'Meta Skills',
              links: [
                {
                  label: 'Agent',
                  url: 'https://example.com/a',
                },
              ],
            },
          ],
        },
      };
      const result = MergedTopicSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('harness-engineering');
      }
    });

    it('rejects slug: contains invalid chars', () => {
      const invalid = {
        slug: 'invalid_slug',
        ko: {
          title: 'Title',
          description: 'Desc',
          sections: [
            {
              heading: 'H',
              links: [{ label: 'L', url: 'https://example.com' }],
            },
          ],
        },
        en: {
          title: 'Title',
          description: 'Desc',
          sections: [
            {
              heading: 'H',
              links: [{ label: 'L', url: 'https://example.com' }],
            },
          ],
        },
      };
      const result = MergedTopicSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('BookmarksStoreSchema', () => {
    it('accepts valid store', () => {
      const valid = {
        version: 1,
        favorites: ['harness-engineering', 'frontend-resources'],
        recents: ['design-reference', 'frontend-resources'],
        meta: {
          lastQuery: 'frontend',
          createdAt: Date.now(),
        },
      };
      const result = BookmarksStoreSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts store without optional lastQuery', () => {
      const valid = {
        version: 1,
        favorites: [],
        recents: [],
        meta: {
          createdAt: Date.now(),
        },
      };
      const result = BookmarksStoreSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects version < 1', () => {
      const invalid = {
        version: 0,
        favorites: [],
        recents: [],
        meta: { createdAt: Date.now() },
      };
      const result = BookmarksStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid JSON with matching schema', () => {
      const json = JSON.stringify({
        version: 1,
        favorites: [],
        recents: [],
        meta: { createdAt: Date.now() },
      });
      const result = safeJsonParse(json, BookmarksStoreSchema);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.version).toBe(1);
      }
    });

    it('returns null on invalid JSON', () => {
      const json = 'not valid json';
      const result = safeJsonParse(json, BookmarksStoreSchema);
      expect(result).toBeNull();
    });

    it('returns null on schema mismatch', () => {
      const json = JSON.stringify({ version: 'invalid' });
      const result = safeJsonParse(json, BookmarksStoreSchema);
      expect(result).toBeNull();
    });
  });
});
