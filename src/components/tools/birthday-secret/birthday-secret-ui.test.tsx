import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/__test__/test-utils';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import type { BirthProfile } from '@/lib/birthday-secret/schema';
import { ProfileCard } from './ProfileCard';
import { BirthdayInput } from './BirthdayInput';
import { MonthGrid } from './MonthGrid';

function withLocale(node: React.ReactElement, locale: 'ko' | 'en') {
  const messages = locale === 'ko' ? koMessages : enMessages;
  return render(<NextIntlClientProvider locale={locale} messages={messages as any}>{node}</NextIntlClientProvider>);
}

const profile: BirthProfile = {
  date: '04-15',
  month: 4,
  flower: {
    key: '04-15',
    ko: { name: '튤립', meaning: '사랑의 고백' },
    en: { name: 'Tulip', meaning: 'Declaration of love' },
    googleQuery: { ko: '튤립 꽃', en: 'tulip flower' },
  },
  stone: {
    month: 4,
    ko: { name: '다이아몬드', meaning: '영원한 사랑', color: '무색', hardness: '10', origin: '남아공' },
    en: { name: 'Diamond', meaning: 'Eternal love', color: 'Colorless', hardness: '10', origin: 'South Africa' },
    googleQuery: { ko: '4월 탄생석 다이아몬드', en: 'April birthstone diamond' },
  },
  color: {
    key: '04-15',
    hex: '#88cc44',
    ko: { name: '라임', keyword: '생기' },
    en: { name: 'Lime', keyword: 'Freshness' },
  },
};

describe('ProfileCard', () => {
  it('renders flower, stone, and color of the profile (ko)', () => {
    withLocale(<ProfileCard profile={profile} />, 'ko');
    expect(screen.getByText('튤립')).toBeInTheDocument();
    expect(screen.getByText('다이아몬드')).toBeInTheDocument();
    expect(screen.getByText('라임')).toBeInTheDocument();
    expect(screen.getByText(/사랑의 고백/)).toBeInTheDocument();
  });

  it('links to Google Images for flower and stone', () => {
    withLocale(<ProfileCard profile={profile} />, 'en');
    const links = screen.getAllByRole('link', { name: /Google Images/i });
    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('google.com/search'));
    expect(links[0]).toHaveAttribute('target', '_blank');
  });

  it('renders English content with no Korean leakage in chrome (en)', () => {
    withLocale(<ProfileCard profile={profile} />, 'en');
    expect(screen.getByText('Tulip')).toBeInTheDocument();
    expect(screen.getByText('Diamond')).toBeInTheDocument();
    // download button label is localized
    expect(screen.getByRole('button', { name: /Save as image/i })).toBeInTheDocument();
  });
});

describe('BirthdayInput', () => {
  it('renders labeled month and day selects with the lunar link', () => {
    withLocale(<BirthdayInput value={null} onSelect={vi.fn()} idPrefix="t" showLunarLink />, 'ko');
    expect(screen.getByLabelText('태어난 월')).toBeInTheDocument();
    expect(screen.getByLabelText('태어난 일')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /변환기/ })).toBeInTheDocument();
  });

  it('fires onSelect only when both month and day are chosen', () => {
    const onSelect = vi.fn();
    withLocale(<BirthdayInput value={null} onSelect={onSelect} idPrefix="t" />, 'ko');
    fireEvent.change(screen.getByLabelText('태어난 월'), { target: { value: '4' } });
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('태어난 일'), { target: { value: '15' } });
    expect(onSelect).toHaveBeenCalledWith(4, 15);
  });
});

describe('MonthGrid', () => {
  it('renders 12 crawlable month spoke anchors (en)', () => {
    withLocale(<MonthGrid locale="en" />, 'en');
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(12);
    expect(screen.getByRole('link', { name: 'April' })).toHaveAttribute(
      'href',
      '/en/tools/birthday-secret/april'
    );
  });
});
