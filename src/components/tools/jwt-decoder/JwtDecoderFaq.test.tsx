import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/i18n/messages/en.json';
import { JwtDecoderFaq } from './JwtDecoderFaq';

/**
 * Test suite for JwtDecoderFaq.
 * Verifies:
 * 1. FAQPage JSON-LD is emitted EXACTLY ONCE (single owner constraint)
 * 2. JSON-LD structure is valid (context, @type, mainEntity)
 * 3. FAQ items render as visible elements
 */

describe('JwtDecoderFaq', () => {
  const messages = {
    tools: {
      'jwt-decoder': enMessages.tools['jwt-decoder'],
    },
  } as any;

  it('emits FAQPage JSON-LD exactly once', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <JwtDecoderFaq />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
  });

  it('FAQPage JSON-LD has valid schema structure', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <JwtDecoderFaq />
      </NextIntlClientProvider>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const jsonLd = JSON.parse(script!.textContent || '{}');

    // Verify schema structure
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('FAQPage');
    expect(Array.isArray(jsonLd.mainEntity)).toBe(true);
    expect(jsonLd.mainEntity.length).toBeGreaterThan(0);

    // Verify each item has required fields
    jsonLd.mainEntity.forEach((item: any) => {
      expect(item['@type']).toBe('Question');
      expect(item.name).toBeTruthy();
      expect(item.acceptedAnswer).toBeTruthy();
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(item.acceptedAnswer.text).toBeTruthy();
    });
  });

  it('renders FAQ items as visible details elements', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <JwtDecoderFaq />
      </NextIntlClientProvider>
    );

    const details = container.querySelectorAll('details');
    expect(details.length).toBeGreaterThan(0);

    // Verify each detail has summary and paragraph
    details.forEach((detail) => {
      const summary = detail.querySelector('summary');
      const p = detail.querySelector('p');
      expect(summary).toBeTruthy();
      expect(p).toBeTruthy();
      expect(summary?.textContent).toBeTruthy();
      expect(p?.textContent).toBeTruthy();
    });
  });

  it('renders section with correct aria-labelledby', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <JwtDecoderFaq />
      </NextIntlClientProvider>
    );

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'jwt-decoder-faq-heading');

    const heading = container.querySelector('#jwt-decoder-faq-heading');
    expect(heading).toBeTruthy();
  });

  it('FAQPage JSON-LD items match visible FAQ count', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <JwtDecoderFaq />
      </NextIntlClientProvider>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script!.textContent || '{}');
    const details = container.querySelectorAll('details');

    // Verify the count matches
    expect(jsonLd.mainEntity).toHaveLength(details.length);
  });
});
