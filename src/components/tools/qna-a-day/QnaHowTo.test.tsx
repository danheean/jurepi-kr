import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';
import { QnaHowTo } from './QnaHowTo';

const messages = { ko: messagesKo as any, en: messagesEn as any };

describe('QnaHowTo', () => {
  it('renders all five sections always-visible (not collapsed) in Korean', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <QnaHowTo />
      </NextIntlClientProvider>
    );

    // No collapsed <details> — content is always visible for readers/reviewers.
    expect(container.querySelector('details')).toBeNull();

    const howTo = messagesKo.tools['qna-a-day'].howTo;
    for (const title of [howTo.whatTitle, howTo.howTitle, howTo.whyTitle, howTo.useCasesTitle, howTo.tipsTitle]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    }
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <QnaHowTo />
      </NextIntlClientProvider>
    );
    const howTo = messagesEn.tools['qna-a-day'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
