import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { NewWordStructuredData } from './NewWordStructuredData';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';

const messagesKo = {
  'tools.new-word': koMessages.tools['new-word'],
} as any;

const messagesEn = {
  'tools.new-word': enMessages.tools['new-word'],
} as any;

const mockCatalog = [
  {
    slug: 'vibe-coding',
    topic: 'tech' as const,
    ko: {
      term: '바이브 코딩',
      definition: 'AI에게 자연어로 원하는 바를 설명하고 느낌대로 받아들이며 코드를 만드는 방식.',
    },
    en: {
      term: 'Vibe Coding',
      definition:
        'Building software by describing intent to an AI in natural language and accepting output by vibe.',
    },
  },
  {
    slug: 'god-saeng',
    topic: 'mz' as const,
    ko: {
      term: '갓생',
      definition: '신처럼 살아가는 인생. 규칙 있고 생산적인 삶을 의미한다.',
    },
    en: {
      term: 'God Life',
      definition: 'Living a disciplined and productive life with purpose.',
    },
  },
];

describe('NewWordStructuredData', () => {
  it('renders SoftwareApplication JSON-LD script', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordStructuredData catalog={mockCatalog} />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const appScript = Array.from(scripts).find((s) => {
      try {
        const data = JSON.parse(s.textContent || '');
        return data['@type'] === 'SoftwareApplication';
      } catch {
        return false;
      }
    });

    expect(appScript).toBeDefined();
    if (appScript) {
      const data = JSON.parse(appScript.textContent || '');
      expect(data['@type']).toBe('SoftwareApplication');
      expect(data.applicationCategory).toBe('UtilityApplication');
      expect(data.offers.price).toBe('0');
    }
  });

  it('renders DefinedTermSet JSON-LD script', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordStructuredData catalog={mockCatalog} />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const termSetScript = Array.from(scripts).find((s) => {
      try {
        const data = JSON.parse(s.textContent || '');
        return data['@type'] === 'DefinedTermSet';
      } catch {
        return false;
      }
    });

    expect(termSetScript).toBeDefined();
    if (termSetScript) {
      const data = JSON.parse(termSetScript.textContent || '');
      expect(data['@type']).toBe('DefinedTermSet');
      expect(data.hasDefinedTerm).toBeDefined();
      expect(Array.isArray(data.hasDefinedTerm)).toBe(true);
    }
  });

  it('DefinedTermSet url uses absoluteToolUrl pattern', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordStructuredData catalog={mockCatalog} />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const termSetScript = Array.from(scripts).find((s) => {
      try {
        const data = JSON.parse(s.textContent || '');
        return data['@type'] === 'DefinedTermSet';
      } catch {
        return false;
      }
    });

    if (termSetScript) {
      const data = JSON.parse(termSetScript.textContent || '');
      // URL should contain locale and slug
      expect(data.url).toContain('tools');
      expect(data.url).toContain('new-word');
    }
  });

  it('DefinedTermSet has correct number of terms', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordStructuredData catalog={mockCatalog} />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const termSetScript = Array.from(scripts).find((s) => {
      try {
        const data = JSON.parse(s.textContent || '');
        return data['@type'] === 'DefinedTermSet';
      } catch {
        return false;
      }
    });

    if (termSetScript) {
      const data = JSON.parse(termSetScript.textContent || '');
      expect(data.hasDefinedTerm.length).toBe(mockCatalog.length);
    }
  });

  it('each DefinedTerm has required fields', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordStructuredData catalog={mockCatalog} />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const termSetScript = Array.from(scripts).find((s) => {
      try {
        const data = JSON.parse(s.textContent || '');
        return data['@type'] === 'DefinedTermSet';
      } catch {
        return false;
      }
    });

    if (termSetScript) {
      const data = JSON.parse(termSetScript.textContent || '');
      data.hasDefinedTerm.forEach((term: any) => {
        expect(term['@type']).toBe('DefinedTerm');
        expect(term.name).toBeDefined();
        expect(typeof term.name).toBe('string');
        expect(term.description).toBeDefined();
        expect(typeof term.description).toBe('string');
        expect(term.url).toBeDefined();
        expect(term.url).toContain('#');
      });
    }
  });

  it('renders two separate JSON-LD scripts (SoftwareApplication and DefinedTermSet)', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordStructuredData catalog={mockCatalog} />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    let appCount = 0;
    let termSetCount = 0;

    Array.from(scripts).forEach((s) => {
      try {
        const data = JSON.parse(s.textContent || '');
        if (data['@type'] === 'SoftwareApplication') appCount++;
        if (data['@type'] === 'DefinedTermSet') termSetCount++;
      } catch {
        // ignore parse errors
      }
    });

    expect(appCount).toBeGreaterThanOrEqual(1);
    expect(termSetCount).toBeGreaterThanOrEqual(1);
  });
});
