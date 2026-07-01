import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { UrlEncoderIntro } from './UrlEncoderIntro';

const messagesKo = koMessages as any;

function renderIntro(locale = 'ko') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messagesKo}>
      <UrlEncoderIntro />
    </NextIntlClientProvider>
  );
}

describe('UrlEncoderIntro', () => {
  it('renders an h1 with the tool title (SSR-safe, no client gate)', () => {
    const { container } = renderIntro('ko');
    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toContain('URL');
  });

  it('renders the Korean eyebrow', () => {
    const { container } = renderIntro('ko');
    expect(container.textContent).toContain('개발 도구');
  });

  it('renders the English eyebrow for en locale', () => {
    const { container } = renderIntro('en');
    expect(container.textContent).toContain('Developer Tool');
  });

  it('renders a lead paragraph inside a semantic header', () => {
    const { container } = renderIntro('ko');
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header?.querySelector('p.text-lg')).toBeInTheDocument();
  });
});
