import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { CharadesFaq } from './CharadesFaq';

const messagesKo = koMessages as any;
const messagesEn = enMessages as any;

function renderFaq(locale = 'ko', messages = messagesKo) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CharadesFaq />
    </NextIntlClientProvider>
  );
}

describe('CharadesFaq', () => {
  it('renders the FAQ section with heading', () => {
    renderFaq('ko');
    expect(screen.getByRole('heading', { name: /자주 묻는 질문/ })).toBeInTheDocument();
  });

  it('renders FAQ items as collapsed details elements', () => {
    const { container } = renderFaq('ko');
    const details = container.querySelectorAll('details');
    expect(details.length).toBeGreaterThanOrEqual(5);
    details.forEach((detail) => expect(detail).not.toHaveAttribute('open'));
  });

  it('injects exactly one FAQPage JSON-LD schema matching visible questions', () => {
    const { container } = renderFaq('ko');
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    const schema = JSON.parse(scripts[0].textContent!);
    expect(schema['@type']).toBe('FAQPage');
    expect(Array.isArray(schema.mainEntity)).toBe(true);

    const summaries = container.querySelectorAll('summary');
    expect(schema.mainEntity.length).toBe(summaries.length);

    schema.mainEntity.forEach((entity: any) => {
      expect(entity['@type']).toBe('Question');
      expect(entity.acceptedAnswer['@type']).toBe('Answer');
    });
  });

  it('renders in English when locale is en', () => {
    const { container } = renderFaq('en', messagesEn);
    expect(container.querySelector('h2')).toBeInTheDocument();
    expect(container.textContent).toMatch(/Frequently Asked Questions/i);
  });
});
