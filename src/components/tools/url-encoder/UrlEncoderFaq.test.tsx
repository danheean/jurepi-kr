import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { UrlEncoderFaq } from './UrlEncoderFaq';

const urlEncoder = koMessages.tools['url-encoder'] as any;
const faqItems = urlEncoder.faq.items as Array<{ q: string; a: string }>;

const messagesKo = koMessages as any;

function renderFaq() {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo}>
      <UrlEncoderFaq />
    </NextIntlClientProvider>
  );
}

describe('UrlEncoderFaq', () => {
  it('renders a FAQ section heading', () => {
    const { container } = renderFaq();
    const h2 = container.querySelector('h2');
    expect(h2).toHaveTextContent('FAQ');
  });

  it('renders every FAQ item as a details/summary (crawlable, SSR-safe)', () => {
    const { container } = renderFaq();
    const details = container.querySelectorAll('details');
    expect(details).toHaveLength(faqItems.length);
    // first question text present
    expect(container.textContent).toContain(faqItems[0].q);
  });

  it('embeds valid FAQPage JSON-LD in the prerendered HTML', () => {
    const { container } = renderFaq();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const schema = JSON.parse(script?.innerHTML || '{}');
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(faqItems.length);
    expect(schema.mainEntity[0]['@type']).toBe('Question');
    expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
  });
});
