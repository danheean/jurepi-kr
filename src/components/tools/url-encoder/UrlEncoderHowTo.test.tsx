import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { UrlEncoderHowTo } from './UrlEncoderHowTo';

const messagesKo = koMessages as any;

function renderHowTo() {
  return render(
    <NextIntlClientProvider locale="ko" messages={messagesKo}>
      <UrlEncoderHowTo />
    </NextIntlClientProvider>
  );
}

describe('UrlEncoderHowTo', () => {
  it('renders the main heading with a stable id (aria target)', () => {
    const { container } = renderHowTo();
    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    expect(h2).toHaveAttribute('id', 'url-encoder-howto-heading');
  });

  it('section references the heading via aria-labelledby (SSR-safe)', () => {
    const { container } = renderHowTo();
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'url-encoder-howto-heading');
  });

  it('renders three sub-section headings (what/component/charset)', () => {
    const { container } = renderHowTo();
    const h3s = container.querySelectorAll('h3');
    expect(h3s).toHaveLength(3);
  });

  it('renders answer-first body paragraphs', () => {
    const { container } = renderHowTo();
    const paragraphs = container.querySelectorAll('section p');
    expect(paragraphs.length).toBeGreaterThanOrEqual(3);
    expect(container.textContent).toContain('EUC-KR');
  });
});
