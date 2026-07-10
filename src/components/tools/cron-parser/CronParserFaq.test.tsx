import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { CronParserFaq } from './CronParserFaq';

// Render against the REAL ko catalog (no mock) so the FAQ questions, answers,
// and FAQPage JSON-LD are validated against the shipping strings.
function renderFaq() {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages as never}>
      <CronParserFaq />
    </NextIntlClientProvider>
  );
}

describe('CronParserFaq', () => {
  it('renders FAQ heading', () => {
    const { getByRole } = renderFaq();
    const heading = getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe('FAQ');
  });

  it('renders FAQPage JSON-LD script', () => {
    const { container } = renderFaq();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();

    const json = JSON.parse(script!.textContent || '{}');
    expect(json['@type']).toBe('FAQPage');
    expect(json.mainEntity).toBeDefined();
    expect(Array.isArray(json.mainEntity)).toBe(true);
    expect(json.mainEntity.length).toBeGreaterThan(0);
  });

  it('renders FAQ items as details elements', () => {
    const { container } = renderFaq();
    const details = container.querySelectorAll('details');
    expect(details.length).toBeGreaterThan(0);
  });

  it('has proper semantic markup', () => {
    const { container } = renderFaq();
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'cron-parser-faq-heading');
  });

  it('renders question and answer in each FAQ item', () => {
    const { container } = renderFaq();
    const details = container.querySelector('details');
    expect(details).toBeTruthy();
    const summary = details!.querySelector('summary');
    const paragraph = details!.querySelector('p');
    expect(summary).toBeInTheDocument();
    expect(paragraph).toBeInTheDocument();
    expect(summary!.textContent).toBeTruthy();
    expect(paragraph!.textContent).toBeTruthy();
  });
});
