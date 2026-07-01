import { describe, it, expect } from 'vitest';
import {
  STORE_VERSION,
  TermFileFrontSchema,
  MergedTermSchema,
  GlossaryStoreSchema,
  safeJsonParse,
} from './schema';

describe('schema — zod validation', () => {
  describe('TermFileFrontSchema', () => {
    it('accepts valid Korean frontmatter', () => {
      const valid = {
        term: '갓생',
        definition: '모든 일에 열심히 하는 모습',
        examples: ['갓생을 살고 싶다'],
      };
      const result = TermFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts optional fields', () => {
      const valid = {
        term: '바이브 코딩',
        definition: 'AI와 함께 느낌대로 코딩하기',
        examples: ['바이브 코딩으로 빠르게 만든다'],
        slug: 'vibe-coding',
        topic: 'tech',
        reading: '바이브 코딩',
        aliases: ['바코'],
        tags: ['AI', '개발'],
        origin: '2025년 개발자 커뮤니티',
        coinedYear: 2025,
        related: ['prompt-engineering'],
      };
      const result = TermFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects empty term', () => {
      const invalid = {
        term: '',
        definition: '정의',
        examples: ['예시'],
      };
      const result = TermFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects empty definition', () => {
      const invalid = {
        term: '용어',
        definition: '',
        examples: ['예시'],
      };
      const result = TermFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects empty examples array', () => {
      const invalid = {
        term: '용어',
        definition: '정의',
        examples: [],
      };
      const result = TermFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects examples with empty string', () => {
      const invalid = {
        term: '용어',
        definition: '정의',
        examples: ['', '정상 예시'],
      };
      const result = TermFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid topic', () => {
      const invalid = {
        term: '용어',
        definition: '정의',
        examples: ['예시'],
        topic: 'invalid',
      };
      const result = TermFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts topic mz and tech', () => {
      const mz = {
        term: '갓생',
        definition: '열심',
        examples: ['예'],
        topic: 'mz',
      };
      const tech = {
        term: '바이브 코딩',
        definition: '코딩',
        examples: ['예'],
        topic: 'tech',
      };
      expect(TermFileFrontSchema.safeParse(mz).success).toBe(true);
      expect(TermFileFrontSchema.safeParse(tech).success).toBe(true);
    });

    it('rejects invalid slug format', () => {
      const invalid = {
        term: '용어',
        definition: '정의',
        examples: ['예시'],
        slug: 'Invalid Slug!',
      };
      const result = TermFileFrontSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts valid slug format', () => {
      const valid = {
        term: '용어',
        definition: '정의',
        examples: ['예시'],
        slug: 'valid-slug-123',
      };
      const result = TermFileFrontSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('MergedTermSchema', () => {
    it('accepts valid merged term', () => {
      const valid = {
        slug: 'god-saeng',
        topic: 'mz',
        tags: ['생활'],
        related: [],
        ko: {
          term: '갓생',
          definition: '열심히 사는 삶',
          examples: ['갓생을 산다'],
          body: '',
        },
        en: {
          term: 'god life',
          definition: 'living productively',
          examples: ['living god life'],
          body: '',
        },
      };
      const result = MergedTermSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts optional coinedYear', () => {
      const valid = {
        slug: 'vibe-coding',
        topic: 'tech',
        tags: ['AI'],
        coinedYear: 2025,
        related: [],
        ko: {
          term: '바이브 코딩',
          definition: '느낌대로 코딩',
          examples: ['바이브 코딩'],
          body: '',
        },
        en: {
          term: 'Vibe Coding',
          definition: 'coding by vibe',
          examples: ['vibe coding'],
          body: '',
        },
      };
      const result = MergedTermSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid topic', () => {
      const invalid = {
        slug: 'test',
        topic: 'invalid',
        tags: [],
        related: [],
        ko: { term: 't', definition: 'd', examples: ['e'], body: '' },
        en: { term: 't', definition: 'd', examples: ['e'], body: '' },
      };
      const result = MergedTermSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid slug', () => {
      const invalid = {
        slug: 'Invalid Slug!',
        topic: 'mz',
        tags: [],
        related: [],
        ko: { term: 't', definition: 'd', examples: ['e'], body: '' },
        en: { term: 't', definition: 'd', examples: ['e'], body: '' },
      };
      const result = MergedTermSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('GlossaryStoreSchema', () => {
    it('accepts valid store', () => {
      const valid = {
        version: STORE_VERSION,
        favorites: [],
        recents: [],
        meta: { createdAt: 1000 },
      };
      const result = GlossaryStoreSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts store with lastTopic and lastLang', () => {
      const valid = {
        version: STORE_VERSION,
        favorites: ['slug1'],
        recents: ['slug2'],
        meta: { createdAt: 1000, lastTopic: 'mz', lastLang: 'ko' },
      };
      const result = GlossaryStoreSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid version', () => {
      const invalid = {
        version: 0,
        favorites: [],
        recents: [],
        meta: { createdAt: 1000 },
      };
      const result = GlossaryStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid lastLang', () => {
      const invalid = {
        version: STORE_VERSION,
        favorites: [],
        recents: [],
        meta: { createdAt: 1000, lastLang: 'invalid' },
      };
      const result = GlossaryStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid JSON matching schema', () => {
      const json = JSON.stringify({
        version: STORE_VERSION,
        favorites: [],
        recents: [],
        meta: { createdAt: 1000 },
      });
      const result = safeJsonParse(json, GlossaryStoreSchema);
      expect(result).not.toBeNull();
      expect(result?.favorites).toEqual([]);
    });

    it('returns null for invalid JSON', () => {
      const result = safeJsonParse('invalid json', GlossaryStoreSchema);
      expect(result).toBeNull();
    });

    it('returns null for JSON not matching schema', () => {
      const json = JSON.stringify({ version: 0, favorites: [] });
      const result = safeJsonParse(json, GlossaryStoreSchema);
      expect(result).toBeNull();
    });

    it('returns null for corrupt data', () => {
      const result = safeJsonParse('', GlossaryStoreSchema);
      expect(result).toBeNull();
    });
  });
});
