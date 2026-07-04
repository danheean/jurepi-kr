import { render, screen } from '@testing-library/react';
import { TransparentBgIntro } from '../TransparentBgIntro';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('TransparentBgIntro', () => {
  it('renders intro in Korean', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgIntro />
      </NextIntlClientProvider>
    );

    // Verify H1 is present (title from i18n)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    // Verify eyebrow text is present, using the contrast-safe ink variant.
    // --accent-sky alone is ~2.14:1 on white (fails WCAG AA); --accent-sky-ink
    // is the token built for text use (~5.95:1).
    const eyebrow = screen.getByText((_, el) =>
      Boolean(el?.className?.includes('text-accent-sky-ink'))
    );
    expect(eyebrow).toBeInTheDocument();
  });

  it('renders intro in English with no Korean text leak', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <TransparentBgIntro />
      </NextIntlClientProvider>
    );

    const container = screen.getByRole('heading', { level: 1 }).closest('header');
    const text = container?.textContent || '';

    // Verify no Korean characters in English render
    const koreanRegex = /[一-鿿가-힯぀-ゟ]/g;
    const koreanMatches = text.match(koreanRegex);
    expect(koreanMatches).toBeNull();

    // Verify H1 exists
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
