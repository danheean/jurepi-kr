import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { CharadesHowTo } from './CharadesHowTo';

const messagesKo = koMessages as any;
const messagesEn = enMessages as any;

function renderHowTo(locale = 'ko', messages = messagesKo) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CharadesHowTo />
    </NextIntlClientProvider>
  );
}

describe('CharadesHowTo', () => {
  it('renders the howTo section with heading', () => {
    renderHowTo('ko');
    expect(screen.getByRole('heading', { name: /몸으로 말해요 사용 방법/i })).toBeInTheDocument();
  });

  it('states the no-speaking rule in the lead paragraph', () => {
    const { container } = renderHowTo('ko');
    expect(container.textContent).toContain('말은 절대 하면 안 됩니다');
  });

  it('renders an ordered list of steps', () => {
    const { container } = renderHowTo('ko');
    const ol = container.querySelector('ol');
    expect(ol).toBeInTheDocument();
    expect(ol).toHaveClass('list-decimal');
  });

  it('renders at least 3 steps, one of which reiterates the silence rule', () => {
    const { container } = renderHowTo('ko');
    const items = container.querySelectorAll('ol > li');
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(container.textContent).toContain('말 없이 몸으로 표현');
  });

  it('has semantic section wrapper with aria-labelledby', () => {
    const { container } = renderHowTo('ko');
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby');
  });

  it('renders in English when locale is en', () => {
    const { container } = renderHowTo('en', messagesEn);
    expect(container.querySelector('h2')).toBeInTheDocument();
    expect(container.textContent).toContain('Charades');
    expect(container.textContent).toMatch(/no talking/i);
  });
});
