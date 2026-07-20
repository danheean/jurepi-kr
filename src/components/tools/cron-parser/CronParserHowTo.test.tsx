import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import { CronParserHowTo } from './CronParserHowTo';

function renderHowTo() {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages as never}>
      <CronParserHowTo />
    </NextIntlClientProvider>
  );
}

describe('CronParserHowTo', () => {
  it('renders with heading', () => {
    const { getByRole } = renderHowTo();
    const heading = getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBeTruthy();
  });

  it('renders HowTo items as paragraphs', () => {
    const { container } = renderHowTo();
    const paragraphs = container.querySelectorAll('section p');
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it('has proper semantic markup', () => {
    const { container } = renderHowTo();
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'cron-parser-howto-heading');
  });

  it('renders the added reference items (what-is / when-to-use / tips)', () => {
    const { container } = renderHowTo();
    const items = (koMessages as any).tools['cron-parser'].howTo.items as Array<{
      title: string;
      body: string;
    }>;
    const titles = Array.from(container.querySelectorAll('section h3')).map((h) => h.textContent);
    for (const key of ['이 도구란?', '언제 쓰나요?', '팁']) {
      expect(titles).toContain(key);
    }
    // The overview prose renders (not just the key).
    expect(container.textContent).toContain('브라우저 안에서 이뤄집니다');
    expect(items.length).toBe(7);
  });
});
