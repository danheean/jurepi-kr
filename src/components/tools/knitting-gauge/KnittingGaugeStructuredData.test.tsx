import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { KnittingGaugeStructuredData } from './KnittingGaugeStructuredData';
import koMessagesRaw from '@/i18n/messages/ko.json';
import enMessagesRaw from '@/i18n/messages/en.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enMessages = enMessagesRaw as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const koMessages = koMessagesRaw as any;

describe('KnittingGaugeStructuredData', () => {
  it('renders SoftwareApplication JSON-LD with correct url', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <KnittingGaugeStructuredData />
      </NextIntlClientProvider>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const jsonLd = JSON.parse(script?.textContent || '{}');
    expect(jsonLd['@type']).toBe('SoftwareApplication');
    expect(jsonLd.url).toContain('/en/tools/knitting-gauge');
  });

  it('renders with Korean locale', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={koMessages}>
        <KnittingGaugeStructuredData />
      </NextIntlClientProvider>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script?.textContent || '{}');
    expect(jsonLd.name).toContain('뜨개 게이지');
    expect(jsonLd.url).toContain('/ko/tools/knitting-gauge');
  });

  it('emits exactly one JSON-LD script and never a FAQPage (Faq owns it)', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <KnittingGaugeStructuredData />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBe(1);
    expect(scripts[0]?.textContent).not.toContain('FAQPage');
  });
});
