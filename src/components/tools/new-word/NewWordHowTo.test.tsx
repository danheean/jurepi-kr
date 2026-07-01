import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewWordHowTo } from './NewWordHowTo';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';

const messagesKo = {
  'tools.new-word': koMessages.tools['new-word'],
} as any;

describe('NewWordHowTo', () => {
  it('renders H2 with aria-labelledby reference', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordHowTo />
      </NextIntlClientProvider>
    );

    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    expect(h2).toHaveAttribute('id', 'new-word-howto-heading');
    expect(h2).toHaveClass('font-display', 'font-bold');
  });

  it('section has aria-labelledby pointing to H2', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordHowTo />
      </NextIntlClientProvider>
    );

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'new-word-howto-heading');
  });

  it('renders prose content container', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordHowTo />
      </NextIntlClientProvider>
    );

    const prose = container.querySelector('div.prose');
    expect(prose).toBeInTheDocument();

    const p = prose?.querySelector('p');
    expect(p).toBeInTheDocument();
  });

  it('has semantic HTML with border separator', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordHowTo />
      </NextIntlClientProvider>
    );

    const section = container.querySelector('section');
    expect(section).toHaveClass('border-t', 'border-hairline');
  });
});
