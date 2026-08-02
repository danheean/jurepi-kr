import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/__test__/test-utils';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import { RecentsList } from './RecentsList';

function withLocale(node: React.ReactElement, locale: 'ko' | 'en') {
  const messages = locale === 'ko' ? koMessages : enMessages;
  return render(<NextIntlClientProvider locale={locale} messages={messages as any}>{node}</NextIntlClientProvider>);
}

describe('RecentsList', () => {
  it('renders one chip per recent key, most-recent first, in ko', () => {
    withLocale(
      <RecentsList recents={['12-25', '04-15']} onSelectRecent={vi.fn()} onClear={vi.fn()} />,
      'ko'
    );
    expect(screen.getByText('최근 본 생일')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '12월 25일' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4월 15일' })).toBeInTheDocument();
  });

  it('renders localized labels in en with no Korean leakage', () => {
    withLocale(
      <RecentsList recents={['12-25']} onSelectRecent={vi.fn()} onClear={vi.fn()} />,
      'en'
    );
    expect(screen.getByText('Recently Viewed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'December 25' })).toBeInTheDocument();
  });

  it('calls onSelectRecent with the underlying MM-DD key, not the label', () => {
    const onSelectRecent = vi.fn();
    withLocale(
      <RecentsList recents={['04-15']} onSelectRecent={onSelectRecent} onClear={vi.fn()} />,
      'ko'
    );
    fireEvent.click(screen.getByRole('button', { name: '4월 15일' }));
    expect(onSelectRecent).toHaveBeenCalledWith('04-15');
  });

  it('calls onClear when the clear-history button is pressed', () => {
    const onClear = vi.fn();
    withLocale(
      <RecentsList recents={['04-15']} onSelectRecent={vi.fn()} onClear={onClear} />,
      'ko'
    );
    fireEvent.click(screen.getByRole('button', { name: '기록 지우기' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('keeps chip touch targets at least 44px tall', () => {
    withLocale(
      <RecentsList recents={['04-15']} onSelectRecent={vi.fn()} onClear={vi.fn()} />,
      'ko'
    );
    const chip = screen.getByRole('button', { name: '4월 15일' });
    expect(chip.className).toMatch(/min-h-\[44px\]/);
  });
});
