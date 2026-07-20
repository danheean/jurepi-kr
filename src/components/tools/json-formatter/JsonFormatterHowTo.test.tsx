import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { JsonFormatterHowTo } from './JsonFormatterHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('JsonFormatterHowTo', () => {
  it('renders all four reference sub-sections in Korean', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <JsonFormatterHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesKo.tools['json-formatter'].howTo;
    expect(screen.getByRole('heading', { level: 2, name: howTo.title })).toBeInTheDocument();
    for (const title of [howTo.whatIsTitle, howTo.howToTitle, howTo.useCasesTitle, howTo.tipsTitle]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    }
    expect(screen.getByText(/브라우저 안에서 이뤄집니다/)).toBeInTheDocument();
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <JsonFormatterHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesEn.tools['json-formatter'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
