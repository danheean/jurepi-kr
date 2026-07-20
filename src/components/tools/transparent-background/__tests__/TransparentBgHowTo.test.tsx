import { render, screen } from '@testing-library/react';
import { TransparentBgHowTo } from '../TransparentBgHowTo';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('TransparentBgHowTo', () => {
  it('renders how-to section in Korean', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgHowTo />
      </NextIntlClientProvider>
    );

    // Verify H2 heading is present
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();

    // Verify section has aria-labelledby
    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'transparent-bg-howto-heading');
  });

  it('renders the reference sub-sections (what-is / steps / when-to-use / tips)', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesKo.tools['transparent-background'].howTo;
    for (const title of [howTo.whatIsTitle, howTo.stepsTitle, howTo.useCasesTitle, howTo.tipsTitle]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    }
    // A distinctive phrase from the always-visible overview prose is rendered.
    expect(screen.getByText(/브라우저 안에서만 처리됩니다/)).toBeInTheDocument();
  });

  it('renders the six numbered steps', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgHowTo />
      </NextIntlClientProvider>
    );

    // Steps are h4 headings under the "steps" h3 group.
    const stepHeadings = screen.getAllByRole('heading', { level: 4 });
    expect(stepHeadings.length).toBeGreaterThanOrEqual(6);
  });

  it('renders when-to-use content', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <TransparentBgHowTo />
      </NextIntlClientProvider>
    );

    const container = screen.getByRole('heading', { level: 2 }).closest('section');
    const italicText = container?.querySelector('p.italic');
    expect(italicText).toBeInTheDocument();
  });

  it('renders in English with no Korean text leak', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <TransparentBgHowTo />
      </NextIntlClientProvider>
    );

    const section = screen.getByRole('heading', { level: 2 }).closest('section');
    const text = section?.textContent || '';

    // Verify no Korean characters
    const koreanRegex = /[一-鿿가-힯぀-ゟ]/g;
    const koreanMatches = text.match(koreanRegex);
    expect(koreanMatches).toBeNull();
  });
});
