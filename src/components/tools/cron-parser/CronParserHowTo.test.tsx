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
});
