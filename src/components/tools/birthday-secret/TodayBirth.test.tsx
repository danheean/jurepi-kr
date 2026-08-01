import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import type { BirthProfile } from '@/lib/birthday-secret/schema';
import { TodayBirth } from './TodayBirth';

function withLocale(node: React.ReactElement, locale: 'ko' | 'en') {
  const messages = locale === 'ko' ? koMessages : enMessages;
  return render(<NextIntlClientProvider locale={locale} messages={messages as any}>{node}</NextIntlClientProvider>);
}

const profile: BirthProfile = {
  date: '08-01',
  month: 8,
  flower: {
    key: '08-01',
    ko: { name: '양귀비꽃', meaning: '쾌락' },
    en: { name: 'Poppy', meaning: 'Pleasure' },
    googleQuery: { ko: '양귀비 꽃', en: 'poppy flower' },
  },
  stone: {
    month: 8,
    ko: { name: '페리도트', meaning: '부부의 행복', color: '연둣빛', hardness: '6.5', origin: '미국' },
    en: { name: 'Peridot', meaning: 'Marital happiness', color: 'Light green', hardness: '6.5', origin: 'USA' },
    googleQuery: { ko: '8월 탄생석 페리도트', en: 'August birthstone peridot' },
  },
  color: {
    key: '08-01',
    hex: '#75da84',
    ko: { name: '밝은 그린', keyword: '안정' },
    en: { name: 'Bright Green', keyword: 'Stability' },
  },
};

describe('TodayBirth', () => {
  it('renders nothing before the profile is loaded (hydration-safe placeholder)', () => {
    const { container } = withLocale(<TodayBirth profile={null} />, 'ko');
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the section heading and today\'s compact profile once loaded', () => {
    withLocale(<TodayBirth profile={profile} />, 'ko');
    expect(screen.getByRole('heading', { name: '오늘의 탄생' })).toBeInTheDocument();
    expect(screen.getByText('양귀비꽃')).toBeInTheDocument();
  });

  it('renders the compact card without download/share actions', () => {
    withLocale(<TodayBirth profile={profile} />, 'ko');
    expect(screen.queryByRole('button', { name: '이미지로 저장' })).not.toBeInTheDocument();
  });

  it('renders the localized heading in en', () => {
    withLocale(<TodayBirth profile={profile} />, 'en');
    expect(screen.getByRole('heading', { name: "Today's birthday" })).toBeInTheDocument();
  });
});
