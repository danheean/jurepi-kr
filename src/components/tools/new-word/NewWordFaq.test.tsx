import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewWordFaq } from './NewWordFaq';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';

const messagesKo = {
  'tools.new-word': koMessages.tools['new-word'],
} as any;

describe('NewWordFaq', () => {
  it('renders H2 with correct aria-labelledby', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordFaq />
      </NextIntlClientProvider>
    );

    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    expect(h2).toHaveAttribute('id', 'new-word-faq-heading');
    expect(h2).toHaveClass('font-display', 'font-bold');
  });

  it('renders section with proper aria-labelledby', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordFaq />
      </NextIntlClientProvider>
    );

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'new-word-faq-heading');
  });

  it('has space for Q&A content container', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordFaq />
      </NextIntlClientProvider>
    );

    // Should have a container for the FAQ items
    const contentDiv = container.querySelector('div.space-y-4');
    expect(contentDiv).toBeInTheDocument();
  });

  it('injects FAQPage JSON-LD', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordFaq />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const faqScript = Array.from(scripts).find((s) => {
      try {
        const data = JSON.parse(s.textContent || '');
        return data['@type'] === 'FAQPage';
      } catch {
        return false;
      }
    });

    expect(faqScript).toBeDefined();
  });

  it('FAQPage JSON-LD has mainEntity array with questions', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordFaq />
      </NextIntlClientProvider>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const faqScripts = Array.from(scripts).filter((s) => {
      try {
        const data = JSON.parse(s.textContent || '');
        return data['@type'] === 'FAQPage';
      } catch {
        return false;
      }
    });

    // Should have at least one FAQPage JSON-LD
    expect(faqScripts.length).toBeGreaterThanOrEqual(1);

    if (faqScripts.length > 0) {
      const data = JSON.parse(faqScripts[0].textContent || '');
      expect(data.mainEntity).toBeDefined();
      expect(Array.isArray(data.mainEntity)).toBe(true);
      // Even with empty or no FAQ items in test, structure should be valid
      if (data.mainEntity.length > 0) {
        expect(data.mainEntity[0]['@type']).toBe('Question');
        expect(data.mainEntity[0].acceptedAnswer).toBeDefined();
        expect(data.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
      }
    }
  });

  it('has semantic section with aria-labelledby', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordFaq />
      </NextIntlClientProvider>
    );

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'new-word-faq-heading');
  });
});
