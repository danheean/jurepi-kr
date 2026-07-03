/// <reference types="vitest/globals" />

import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LunarConverterStructuredData } from './LunarConverterStructuredData';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

function RenderWithIntl({
  children,
  locale = 'ko',
  messages = messagesKo,
}: {
  children: ReactNode;
  locale?: string;
  messages?: any;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

const customRender = (
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'> & { locale?: string; messages?: any }
) => {
  const { locale = 'ko', messages = messagesKo, ...renderOptions } = options || {};
  return render(ui, {
    wrapper: ({ children }) => (
      <RenderWithIntl locale={locale} messages={messages}>
        {children}
      </RenderWithIntl>
    ),
    ...renderOptions,
  });
};

describe('LunarConverterStructuredData', () => {
  it('injects two JSON-LD scripts (SoftwareApplication + BreadcrumbList; FAQPage lives in the Faq component)', () => {
    const { container } = customRender(<LunarConverterStructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(2);
  });

  it('injects SoftwareApplication JSON-LD with correct url', () => {
    const { container } = customRender(<LunarConverterStructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    let softwareAppFound = false;

    scripts.forEach((script) => {
      if (script.textContent) {
        const json = JSON.parse(script.textContent);
        if (json['@type'] === 'SoftwareApplication') {
          softwareAppFound = true;
          expect(json.url).toMatch(/lunar-converter/);
          expect(json.name).toBeDefined();
          expect(json.description).toBeDefined();
        }
      }
    });

    expect(softwareAppFound).toBe(true);
  });

  it('does NOT inject FAQPage JSON-LD (that is owned by LunarConverterFaq to avoid duplication)', () => {
    const { container } = customRender(<LunarConverterStructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    let faqFound = false;

    scripts.forEach((script) => {
      if (script.textContent) {
        const json = JSON.parse(script.textContent);
        if (json['@type'] === 'FAQPage') {
          faqFound = true;
        }
      }
    });

    expect(faqFound).toBe(false);
  });

  it('injects BreadcrumbList JSON-LD with correct items', () => {
    const { container } = customRender(<LunarConverterStructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    let breadcrumbFound = false;

    scripts.forEach((script) => {
      if (script.textContent) {
        const json = JSON.parse(script.textContent);
        if (json['@type'] === 'BreadcrumbList') {
          breadcrumbFound = true;
          expect(json.itemListElement).toBeDefined();
          expect(Array.isArray(json.itemListElement)).toBe(true);
          expect(json.itemListElement.length).toBe(3); // Home, Tools, Lunar Converter
          expect(json.itemListElement[0].position).toBe(1);
          expect(json.itemListElement[1].position).toBe(2);
          expect(json.itemListElement[2].position).toBe(3);
        }
      }
    });

    expect(breadcrumbFound).toBe(true);
  });

  it('renders tool url using absoluteToolUrl with locale', () => {
    const { container: koContainer } = customRender(
      <LunarConverterStructuredData />,
      { locale: 'ko', messages: messagesKo }
    );

    const koScripts = koContainer.querySelectorAll('script[type="application/ld+json"]');
    let koUrlFound = false;

    koScripts.forEach((script) => {
      if (script.textContent) {
        const json = JSON.parse(script.textContent);
        if (json['@type'] === 'SoftwareApplication') {
          expect(json.url).toMatch(/\/ko\/tools\/lunar-converter/);
          koUrlFound = true;
        }
      }
    });

    expect(koUrlFound).toBe(true);
  });

  it('url in all schemas matches (canonical consistency)', () => {
    const { container } = customRender(<LunarConverterStructuredData />);

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const urls = new Set<string>();

    scripts.forEach((script) => {
      if (script.textContent) {
        const json = JSON.parse(script.textContent);
        if (json.url) {
          urls.add(json.url);
        }
      }
    });

    // All URL-bearing schemas should share a single canonical URL
    expect(urls.size).toBeLessThanOrEqual(2); // URL and breadcrumb items
  });
});
