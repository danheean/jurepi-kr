import { describe, it, expect, vi } from 'vitest';
import { render } from '@/__test__/test-utils';
import { HowtoStructuredData } from './HowtoStructuredData';
import type { MergedGuide } from '@/lib/howto/schema';

// Mock the seo library
vi.mock('@/lib/seo', () => ({
  absoluteToolUrl: (locale: string, tool: string) =>
    `https://apps.example.com/${locale}/tools/${tool}`,
}));

const mockCatalog: MergedGuide[] = [
  {
    slug: 'install-claude-code',
    topic: 'setup',
    order: 1,    tags: ['claude-code'],
    related: [],
    updated: '2026-07-06T00:00:00.000Z',
    difficulty: 'beginner',
    ko: {
      title: '클로드 코드 설치하는 법',
      summary: 'Installation guide.',
      body: 'Body...',
    },
    en: {
      title: 'How to Install Claude Code',
      summary: 'Installation guide.',
      body: 'Body...',
    },
  },
  {
    slug: 'issue-api-token',
    topic: 'api',
    order: 1,    tags: ['api', 'token'],
    related: [],
    updated: '2026-07-06T00:00:00.000Z',
    difficulty: 'beginner',
    ko: {
      title: 'API 토큰 발급하는 법',
      summary: 'Token guide.',
      body: 'Body...',
    },
    en: {
      title: 'How to Issue an API Token',
      summary: 'Token guide.',
      body: 'Body...',
    },
  },
];

describe('HowtoStructuredData', () => {
  it('emits SoftwareApplication JSON-LD in English', () => {
    const { container } = render(
      <HowtoStructuredData catalog={mockCatalog} />,
      { locale: 'en' }
    );

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBeGreaterThanOrEqual(1);

    // Find SoftwareApplication
    let softwareApp: any = null;
    scripts.forEach((script) => {
      const data = JSON.parse(script.textContent || '{}');
      if (data['@type'] === 'SoftwareApplication') {
        softwareApp = data;
      }
    });

    expect(softwareApp).toBeTruthy();
    expect(softwareApp.name).toBe('How-To Guides');
    expect(softwareApp.description).toContain('Step-by-step guides');
    expect(softwareApp.url).toContain('/en/tools/howto');
    expect(softwareApp.applicationCategory).toBe('Utility');
  });

  it('emits SoftwareApplication JSON-LD in Korean', () => {
    const { container } = render(
      <HowtoStructuredData catalog={mockCatalog} />,
      { locale: 'ko' }
    );

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    let softwareApp: any = null;
    scripts.forEach((script) => {
      const data = JSON.parse(script.textContent || '{}');
      if (data['@type'] === 'SoftwareApplication') {
        softwareApp = data;
      }
    });

    expect(softwareApp).toBeTruthy();
    expect(softwareApp.name).toBe('하우투 가이드');
  });

  it('emits ItemList JSON-LD with all catalog guides', () => {
    const { container } = render(
      <HowtoStructuredData catalog={mockCatalog} />,
      { locale: 'en' }
    );

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    let itemList: any = null;
    scripts.forEach((script) => {
      const data = JSON.parse(script.textContent || '{}');
      if (data['@type'] === 'ItemList') {
        itemList = data;
      }
    });

    expect(itemList).toBeTruthy();
    expect(itemList.itemListElement).toHaveLength(2);
  });

  it('ItemList items have correct position, name, and url', () => {
    const { container } = render(
      <HowtoStructuredData catalog={mockCatalog} />,
      { locale: 'en' }
    );

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    let itemList: any = null;
    scripts.forEach((script) => {
      const data = JSON.parse(script.textContent || '{}');
      if (data['@type'] === 'ItemList') {
        itemList = data;
      }
    });

    const items = itemList.itemListElement;

    // First item
    expect(items[0].position).toBe(1);
    expect(items[0].name).toBe('How to Install Claude Code');
    expect(items[0].url).toContain('install-claude-code');
    expect(items[0]['@type']).toBe('ListItem');

    // Second item
    expect(items[1].position).toBe(2);
    expect(items[1].name).toBe('How to Issue an API Token');
    expect(items[1].url).toContain('issue-api-token');
  });

  it('ItemList uses locale-specific guide titles in Korean', () => {
    const { container } = render(
      <HowtoStructuredData catalog={mockCatalog} />,
      { locale: 'ko' }
    );

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    let itemList: any = null;
    scripts.forEach((script) => {
      const data = JSON.parse(script.textContent || '{}');
      if (data['@type'] === 'ItemList') {
        itemList = data;
      }
    });

    const items = itemList.itemListElement;

    expect(items[0].name).toBe('클로드 코드 설치하는 법');
    expect(items[1].name).toBe('API 토큰 발급하는 법');
  });

  it('emits exactly 2 JSON-LD scripts (SoftwareApplication + ItemList)', () => {
    const { container } = render(
      <HowtoStructuredData catalog={mockCatalog} />,
      { locale: 'en' }
    );

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    expect(scripts).toHaveLength(2);

    const types: string[] = [];
    scripts.forEach((script) => {
      const data = JSON.parse(script.textContent || '{}');
      types.push(data['@type']);
    });

    expect(types).toContain('SoftwareApplication');
    expect(types).toContain('ItemList');
  });

  it('handles empty catalog', () => {
    const { container } = render(<HowtoStructuredData catalog={[]} />, {
      locale: 'en',
    });

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    let itemList: any = null;
    scripts.forEach((script) => {
      const data = JSON.parse(script.textContent || '{}');
      if (data['@type'] === 'ItemList') {
        itemList = data;
      }
    });

    expect(itemList.itemListElement).toHaveLength(0);
  });

  it('SoftwareApplication URL equals ItemList item URLs base', () => {
    const { container } = render(
      <HowtoStructuredData catalog={mockCatalog} />,
      { locale: 'en' }
    );

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    let softwareApp: any = null;
    let itemList: any = null;

    scripts.forEach((script) => {
      const data = JSON.parse(script.textContent || '{}');
      if (data['@type'] === 'SoftwareApplication') {
        softwareApp = data;
      } else if (data['@type'] === 'ItemList') {
        itemList = data;
      }
    });

    // All item URLs should start with the tool URL
    itemList.itemListElement.forEach((item: any) => {
      expect(item.url).toContain(softwareApp.url);
    });
  });
});
