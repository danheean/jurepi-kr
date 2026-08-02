import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { BirthdaySecretFaq } from './BirthdaySecretFaq';

function withLocale(node: React.ReactElement, locale: 'ko' | 'en') {
  const messages = locale === 'ko' ? koMessages : enMessages;
  return render(<NextIntlClientProvider locale={locale} messages={messages as any}>{node}</NextIntlClientProvider>);
}

describe('BirthdaySecretFaq', () => {
  it('renders the section heading', () => {
    withLocale(<BirthdaySecretFaq />, 'ko');
    expect(screen.getByRole('heading', { level: 2, name: '자주 묻는 질문' })).toBeInTheDocument();
  });

  it('renders one visible question/answer per catalog item', () => {
    withLocale(<BirthdaySecretFaq />, 'ko');
    const koFaq = (koMessages as any).tools['birthday-secret'].faq.items as Array<{ q: string; a: string }>;
    expect(koFaq.length).toBeGreaterThan(0);
    koFaq.forEach((item) => {
      expect(screen.getByRole('heading', { level: 3, name: item.q })).toBeInTheDocument();
    });
  });

  it('emits exactly one FAQPage JSON-LD block, matching the visible items (single-owner)', () => {
    const { container } = withLocale(<BirthdaySecretFaq />, 'ko');
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    const schema = JSON.parse(scripts[0].textContent || '{}');
    expect(schema['@type']).toBe('FAQPage');
    const koFaq = (koMessages as any).tools['birthday-secret'].faq.items as Array<{ q: string; a: string }>;
    expect(schema.mainEntity).toHaveLength(koFaq.length);
  });

  it('renders English content with no Korean leakage', () => {
    const { container } = withLocale(<BirthdaySecretFaq />, 'en');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Frequently asked questions');
    expect(container.querySelector('h2')?.textContent).not.toMatch(/[가-힣]/);
  });
});
