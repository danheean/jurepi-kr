import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/i18n/messages/en.json';
import koMessages from '@/i18n/messages/ko.json';
import { JwtDecoderStructuredData } from './JwtDecoderStructuredData';

/**
 * Test suite for JwtDecoderStructuredData.
 * Verifies:
 * 1. SoftwareApplication JSON-LD is emitted EXACTLY ONCE (single owner constraint)
 * 2. No FAQPage JSON-LD in this component (FAQPage is owned by JwtDecoderFaq only)
 * 3. JSON-LD structure is valid
 * 4. URL is correctly formed
 */

describe('JwtDecoderStructuredData', () => {
  const messagesEn = {
    tools: {
      'jwt-decoder': enMessages.tools['jwt-decoder'],
    },
  } as any;

  const messagesKo = {
    tools: {
      'jwt-decoder': koMessages.tools['jwt-decoder'],
    },
  } as any;

  beforeEach(() => {
    // Mock NEXT_PUBLIC_SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://apps.jurepi.kr';
  });

  it('emits SoftwareApplication JSON-LD exactly once', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messagesEn}>
        <JwtDecoderStructuredData />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
  });

  it('SoftwareApplication JSON-LD has valid schema structure', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messagesEn}>
        <JwtDecoderStructuredData />
      </NextIntlClientProvider>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const jsonLd = JSON.parse(script!.textContent || '{}');

    // Verify structure
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('SoftwareApplication');
    expect(jsonLd.name).toBeTruthy();
    expect(jsonLd.description).toBeTruthy();
    expect(jsonLd.url).toMatch(/\/en\/tools\/jwt-decoder$/);
    expect(jsonLd.applicationCategory).toBe('DeveloperApplication');
  });

  it('does NOT emit FAQPage (that is owned by JwtDecoderFaq)', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messagesEn}>
        <JwtDecoderStructuredData />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach((script) => {
      const jsonLd = JSON.parse(script.textContent || '{}');
      expect(jsonLd['@type']).not.toBe('FAQPage');
    });
  });

  it('includes offer with price=0', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messagesEn}>
        <JwtDecoderStructuredData />
      </NextIntlClientProvider>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script!.textContent || '{}');

    expect(jsonLd.offers).toBeDefined();
    expect(jsonLd.offers['@type']).toBe('Offer');
    expect(jsonLd.offers.price).toBe('0');
    expect(jsonLd.offers.priceCurrency).toBe('USD');
  });

  it('handles ko locale correctly', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <JwtDecoderStructuredData />
      </NextIntlClientProvider>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const jsonLd = JSON.parse(script!.textContent || '{}');

    // Verify Korean content exists
    expect(jsonLd.name).toBeTruthy();
    expect(jsonLd.description).toBeTruthy();
    // URL should contain ko locale
    expect(jsonLd.url).toMatch(/\/ko\/tools\/jwt-decoder$/);
  });
});
