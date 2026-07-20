import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { RouletteHowTo } from './RouletteHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('RouletteHowTo', () => {
  it('renders the added what-is / use-cases / tips sections (Korean)', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <RouletteHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesKo.tools['roulette'].howTo;
    for (const title of [howTo.whatIsTitle, howTo.useCasesTitle, howTo.tipsTitle]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    }
    expect(screen.getByText(/브라우저 안에서 이뤄집니다/)).toBeInTheDocument();
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <RouletteHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesEn.tools['roulette'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
