import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewWordIntro } from './NewWordIntro';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';

const messagesKo = {
  'tools.new-word': koMessages.tools['new-word'],
} as any;

describe('NewWordIntro', () => {
  it('renders eyebrow with correct styling', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordIntro />
      </NextIntlClientProvider>
    );

    const eyebrow = container.querySelector('div.text-accent-mint-ink');
    expect(eyebrow).toBeInTheDocument();
    expect(eyebrow).toHaveClass('uppercase', 'tracking-widest');
  });

  it('renders H1 with correct styling classes', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordIntro />
      </NextIntlClientProvider>
    );

    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveClass('font-display', 'font-bold', 'text-display-lg', 'text-text');
  });

  it('renders lead paragraph with correct styling', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordIntro />
      </NextIntlClientProvider>
    );

    const paragraph = container.querySelector('p.text-body-lg');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveClass('text-text-secondary');
  });

  it('renders in a semantic section', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ko" messages={messagesKo}>
        <NewWordIntro />
      </NextIntlClientProvider>
    );

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });
});
