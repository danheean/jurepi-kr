import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { QRCodeHowTo } from './QRCodeHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('QRCodeHowTo', () => {
  it('renders the added what-is / use-cases / tips sections (Korean)', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <QRCodeHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesKo.tools['qr-code'].howTo;
    for (const title of [howTo.whatIsTitle, howTo.useCasesTitle, howTo.tipsTitle]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    }
    expect(screen.getByText(/브라우저 안에서 이뤄집니다/)).toBeInTheDocument();
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <QRCodeHowTo />
      </NextIntlClientProvider>
    );

    const howTo = messagesEn.tools['qr-code'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
