import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { NewWordHowTo } from './NewWordHowTo';

const messages = { ko: koMessages as any, en: enMessages as any };

describe('NewWordHowTo', () => {
  it('renders H2 with a stable id and accessible section', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <NewWordHowTo />
      </NextIntlClientProvider>
    );

    const h2 = container.querySelector('h2');
    expect(h2).toHaveAttribute('id', 'new-word-howto-heading');
    expect(container.querySelector('section')).toHaveAttribute(
      'aria-labelledby',
      'new-word-howto-heading'
    );
  });

  it('renders the overview body and the added use-cases / tips sub-sections (Korean)', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <NewWordHowTo />
      </NextIntlClientProvider>
    );

    const howTo = koMessages.tools['new-word'].howTo;
    expect(screen.getByText(howTo.body)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: howTo.tipsTitle })).toBeInTheDocument();
  });

  it('renders in English with no Korean leakage', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <NewWordHowTo />
      </NextIntlClientProvider>
    );

    const howTo = enMessages.tools['new-word'].howTo;
    expect(screen.getByRole('heading', { level: 3, name: howTo.useCasesTitle })).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[가-힣]/);
  });
});
