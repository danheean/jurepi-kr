import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { UnitConverterHowTo } from './UnitConverterHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('UnitConverterHowTo', () => {
  it('renders all four reference sub-sections in Korean', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <UnitConverterHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesKo.tools['unit-converter'].howTo;
    expect(screen.getByRole('heading', { level: 2, name: howTo.title })).toBeInTheDocument();
    for (const title of [howTo.whatIsTitle, howTo.howToTitle, howTo.useCasesTitle, howTo.tipsTitle]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    }
    // A distinctive phrase from the body prose is rendered (not just the key).
    expect(screen.getByText(/브라우저 안에서 이루어져/)).toBeInTheDocument();
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <UnitConverterHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesEn.tools['unit-converter'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
