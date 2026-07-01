import { describe, it, expect } from 'vitest';
import {
  buildToolMetadata,
  buildPageMetadata,
  softwareApplicationJsonLd,
  faqPageJsonLd,
  definedTermSetJsonLd,
} from './seo';

describe('SEO Builders', () => {
  describe('buildToolMetadata', () => {
    it('builds metadata with canonical URL and hreflang alternates', () => {
      const metadata = buildToolMetadata({
        locale: 'en',
        slug: 'ladder',
        title: 'Ladder Game',
        description: 'Fair decision making tool',
      });

      expect(metadata.title).toBe('Ladder Game');
      expect(metadata.description).toBe('Fair decision making tool');
      expect(metadata.alternates?.canonical).toBe('https://jurepi.kr/en/tools/ladder');
      expect(metadata.alternates?.languages).toEqual({
        ko: 'https://jurepi.kr/ko/tools/ladder',
        en: 'https://jurepi.kr/en/tools/ladder',
      });
    });

    it('builds Open Graph tags correctly', () => {
      const metadata = buildToolMetadata({
        locale: 'ko',
        slug: 'ladder',
        title: '사다리 게임',
        description: '공정한 결정 도구',
      });

      expect(metadata.openGraph?.title).toBe('사다리 게임');
      expect(metadata.openGraph?.description).toBe('공정한 결정 도구');
      expect((metadata.openGraph as any)?.type).toBe('website');
      expect(metadata.openGraph?.siteName).toBe('Jurepi');
      expect(metadata.openGraph?.url).toBe('https://jurepi.kr/ko/tools/ladder');
      expect(metadata.openGraph?.locale).toBe('ko_KR');
    });

    it('maps en locale to en_US in Open Graph', () => {
      const metadata = buildToolMetadata({
        locale: 'en',
        slug: 'test',
        title: 'Test',
        description: 'Test desc',
      });

      expect(metadata.openGraph?.locale).toBe('en_US');
    });

    it('includes Open Graph image with correct dimensions', () => {
      const metadata = buildToolMetadata({
        locale: 'en',
        slug: 'test',
        title: 'Test',
        description: 'Test',
      });

      const images = metadata.openGraph?.images;
      expect(Array.isArray(images)).toBe(true);
      if (Array.isArray(images)) {
        expect(images).toHaveLength(1);
        expect(images[0]).toEqual({
          url: 'https://jurepi.kr/og-default.png',
          width: 1200,
          height: 630,
          alt: 'Test',
        });
      }
    });

    it('includes Twitter card metadata', () => {
      const metadata = buildToolMetadata({
        locale: 'en',
        slug: 'test',
        title: 'My Tool',
        description: 'Tool description',
      });

      expect((metadata.twitter as any)?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBe('My Tool');
      expect(metadata.twitter?.description).toBe('Tool description');
      const images = metadata.twitter?.images;
      expect(Array.isArray(images) ? images : [images]).toContain('https://jurepi.kr/og-default.png');
    });

    it('respects NEXT_PUBLIC_SITE_URL environment variable', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.site';

      const metadata = buildToolMetadata({
        locale: 'en',
        slug: 'test',
        title: 'Test',
        description: 'Test',
      });

      expect(metadata.alternates?.canonical).toBe('https://custom.site/en/tools/test');
      expect(metadata.alternates?.languages?.ko).toBe('https://custom.site/ko/tools/test');

      // Assigning `undefined` to process.env coerces to the string "undefined",
      // which would leak into later tests as a truthy siteUrl. Delete instead.
      if (originalEnv === undefined) {
        delete process.env.NEXT_PUBLIC_SITE_URL;
      } else {
        process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
      }
    });
  });

  describe('buildPageMetadata', () => {
    it('builds home canonical (empty path) with locale root and hreflang alternates', () => {
      const metadata = buildPageMetadata({
        locale: 'ko',
        path: '',
        title: 'Jurepi · 무료 온라인 도구 모음',
        description: '무료 온라인 도구 모음',
      });

      expect(metadata.alternates?.canonical).toBe('https://jurepi.kr/ko');
      expect(metadata.alternates?.languages).toEqual({
        ko: 'https://jurepi.kr/ko',
        en: 'https://jurepi.kr/en',
      });
      expect(metadata.openGraph?.url).toBe('https://jurepi.kr/ko');
    });

    it('builds a sub-page canonical from its path', () => {
      const metadata = buildPageMetadata({
        locale: 'en',
        path: '/about',
        title: 'About',
        description: 'About page',
      });

      expect(metadata.alternates?.canonical).toBe('https://jurepi.kr/en/about');
      expect(metadata.alternates?.languages?.ko).toBe('https://jurepi.kr/ko/about');
    });
  });

  describe('softwareApplicationJsonLd', () => {
    it('builds SoftwareApplication JSON-LD with correct @type', () => {
      const jsonLd = softwareApplicationJsonLd({
        name: 'Ladder Game',
        description: 'Fair decision making tool',
        url: 'https://jurepi.kr/tools/ladder',
      });

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('SoftwareApplication');
    });

    it('includes all required fields', () => {
      const jsonLd = softwareApplicationJsonLd({
        name: 'Test Tool',
        description: 'Test Description',
        url: 'https://example.com/test',
      });

      expect(jsonLd.name).toBe('Test Tool');
      expect(jsonLd.description).toBe('Test Description');
      expect(jsonLd.url).toBe('https://example.com/test');
      expect(jsonLd.applicationCategory).toBe('UtilityApplication');
      expect(jsonLd.downloadUrl).toBe('https://example.com/test');
      expect(jsonLd.operatingSystem).toBe('Any');
    });

    it('includes free offer information', () => {
      const jsonLd = softwareApplicationJsonLd({
        name: 'Tool',
        description: 'Desc',
        url: 'https://example.com',
      });

      expect(jsonLd.offers).toEqual({
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      });
    });
  });

  describe('faqPageJsonLd', () => {
    it('builds FAQPage JSON-LD with correct @type', () => {
      const jsonLd = faqPageJsonLd([]);

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('FAQPage');
    });

    it('maps FAQ items to Question/Answer structure', () => {
      const items = [
        { q: 'Is it fair?', a: 'Yes, absolutely.' },
        { q: 'How many players?', a: 'Up to 10.' },
      ];

      const jsonLd = faqPageJsonLd(items);
      const mainEntity = jsonLd.mainEntity as any[];

      expect(mainEntity).toHaveLength(2);
      expect(mainEntity[0]).toEqual({
        '@type': 'Question',
        name: 'Is it fair?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, absolutely.',
        },
      });
      expect(mainEntity[1]).toEqual({
        '@type': 'Question',
        name: 'How many players?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Up to 10.',
        },
      });
    });

    it('handles empty FAQ items', () => {
      const jsonLd = faqPageJsonLd([]);

      expect(jsonLd.mainEntity).toEqual([]);
    });

    it('handles single FAQ item', () => {
      const items = [{ q: 'Question?', a: 'Answer.' }];

      const jsonLd = faqPageJsonLd(items);
      const mainEntity = jsonLd.mainEntity as any[];

      expect(mainEntity).toHaveLength(1);
      expect(mainEntity[0]?.name).toBe('Question?');
    });
  });

  describe('definedTermSetJsonLd', () => {
    it('builds DefinedTermSet JSON-LD with correct @type', () => {
      const jsonLd = definedTermSetJsonLd({
        name: 'Example Glossary',
        description: 'A glossary of terms',
        url: 'https://example.com/glossary',
        terms: [],
      });

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('DefinedTermSet');
    });

    it('includes all required fields', () => {
      const jsonLd = definedTermSetJsonLd({
        name: 'Tech Terms',
        description: 'Modern technology terminology',
        url: 'https://jurepi.kr/ko/tools/new-word',
        terms: [],
      });

      expect(jsonLd.name).toBe('Tech Terms');
      expect(jsonLd.description).toBe('Modern technology terminology');
      expect(jsonLd.url).toBe('https://jurepi.kr/ko/tools/new-word');
      expect(jsonLd['@id']).toBe('https://jurepi.kr/ko/tools/new-word');
    });

    it('maps terms to DefinedTerm structure with slug anchors', () => {
      const terms = [
        { slug: 'vibe-coding', term: 'Vibe Coding', definition: 'Building software by feel' },
        { slug: 'ai-agent', term: 'AI Agent', definition: 'An autonomous AI system' },
      ];

      const jsonLd = definedTermSetJsonLd({
        name: 'Glossary',
        description: 'Description',
        url: 'https://example.com/glossary',
        terms,
      });

      const hasDefinedTerm = jsonLd.hasDefinedTerm as any[];
      expect(hasDefinedTerm).toHaveLength(2);
      expect(hasDefinedTerm[0]).toEqual({
        '@type': 'DefinedTerm',
        name: 'Vibe Coding',
        description: 'Building software by feel',
        inDefinedTermSet: { '@id': 'https://example.com/glossary' },
        url: 'https://example.com/glossary#vibe-coding',
      });
      expect(hasDefinedTerm[1]).toEqual({
        '@type': 'DefinedTerm',
        name: 'AI Agent',
        description: 'An autonomous AI system',
        inDefinedTermSet: { '@id': 'https://example.com/glossary' },
        url: 'https://example.com/glossary#ai-agent',
      });
    });

    it('handles empty terms array', () => {
      const jsonLd = definedTermSetJsonLd({
        name: 'Empty Glossary',
        description: 'No terms yet',
        url: 'https://example.com/glossary',
        terms: [],
      });

      expect(jsonLd.hasDefinedTerm).toEqual([]);
    });

    it('preserves description as plain text (not escaped HTML)', () => {
      const jsonLd = definedTermSetJsonLd({
        name: 'Glossary',
        description: 'A glossary of MZ & tech terms',
        url: 'https://example.com',
        terms: [
          { slug: 'test', term: 'Test', definition: 'A test definition' },
        ],
      });

      expect(jsonLd.description).toBe('A glossary of MZ & tech terms');
      const hasDefinedTerm = jsonLd.hasDefinedTerm as any[];
      expect(hasDefinedTerm[0]?.description).toBe('A test definition');
    });
  });
});
