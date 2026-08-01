import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';
import type { MergedMonth, MergedStone, MergedFlower } from '@/lib/birthday-secret/schema';
import { MonthSpoke } from './MonthSpoke';

function withLocale(node: React.ReactElement, locale: 'ko' | 'en') {
  const messages = locale === 'ko' ? koMessages : enMessages;
  return render(<NextIntlClientProvider locale={locale} messages={messages as any}>{node}</NextIntlClientProvider>);
}

const month: MergedMonth = {
  month: 4,
  slug: 'april',
  ko: {
    title: '4월 탄생석·탄생화·탄생색',
    // Regression guard for the "**name(EnglishGloss)**" markdown escaping bug:
    // a parenthetical immediately before the closing bold marker must still render bold.
    body: '4월의 탄생석은 **다이아몬드**(Diamond)입니다. 강인함을 상징합니다.',
  },
  en: {
    title: 'April Birthstone, Birth Flower & Birth Color',
    body: 'The birthstone for April is the **diamond**, a symbol of strength.',
  },
};

const stone: MergedStone = {
  month: 4,
  ko: { name: '다이아몬드', meaning: '영원한 사랑', color: '무색투명', hardness: '10', origin: '남아프리카' },
  en: { name: 'Diamond', meaning: 'Eternal love', color: 'Colorless', hardness: '10', origin: 'South Africa' },
  googleQuery: { ko: '4월 탄생석 다이아몬드', en: 'April birthstone diamond' },
};

const flowerWithMeaning: MergedFlower = {
  key: '04-16',
  ko: { name: '튤립', meaning: '사랑의 고백' },
  en: { name: 'Tulip', meaning: 'Declaration of love' },
  googleQuery: { ko: '튤립 꽃', en: 'tulip flower' },
};

describe('MonthSpoke', () => {
  it('renders the month title as the page H1', () => {
    withLocale(
      <MonthSpoke month={month} stone={stone} flowerSamples={[flowerWithMeaning]} prevSlug="march" nextSlug="may" />,
      'ko'
    );
    expect(screen.getByRole('heading', { level: 1, name: month.ko.title })).toBeInTheDocument();
  });

  it('renders bold markdown correctly even with a parenthetical gloss touching the closing marker', () => {
    withLocale(
      <MonthSpoke month={month} stone={stone} flowerSamples={[flowerWithMeaning]} prevSlug="march" nextSlug="may" />,
      'ko'
    );
    // The stone name must be an actual <strong>, and no literal ** may appear anywhere in the article.
    const strongDiamond = screen.getByText('다이아몬드', { selector: 'strong' });
    expect(strongDiamond).toBeInTheDocument();
    const article = strongDiamond.closest('article')!;
    expect(article.textContent).not.toMatch(/\*\*/);
  });

  it('renders the stone facts panel with meaning, hardness, and origin', () => {
    withLocale(
      <MonthSpoke month={month} stone={stone} flowerSamples={[flowerWithMeaning]} prevSlug="march" nextSlug="may" />,
      'ko'
    );
    expect(screen.getByText('영원한 사랑')).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/남아프리카/)).toBeInTheDocument();
  });

  it('renders a representative flower with its meaning appended', () => {
    withLocale(
      <MonthSpoke month={month} stone={stone} flowerSamples={[flowerWithMeaning]} prevSlug="march" nextSlug="may" />,
      'ko'
    );
    expect(screen.getByText(/튤립/)).toBeInTheDocument();
    expect(screen.getByText(/사랑의 고백/)).toBeInTheDocument();
  });

  it('omits the em dash for a flower with no meaning, instead of rendering a bare " — "', () => {
    const flowerNoMeaning: MergedFlower = {
      key: '04-17',
      ko: { name: '이름만', meaning: '' },
      en: { name: 'NameOnly', meaning: '' },
      googleQuery: { ko: '이름만 꽃', en: 'name only flower' },
    };
    withLocale(
      <MonthSpoke month={month} stone={stone} flowerSamples={[flowerNoMeaning]} prevSlug="march" nextSlug="may" />,
      'ko'
    );
    const item = screen.getByText('이름만').closest('li')!;
    expect(item.textContent).toBe('이름만');
  });

  it('links prev/next month navigation with the correct hrefs', () => {
    withLocale(
      <MonthSpoke month={month} stone={stone} flowerSamples={[flowerWithMeaning]} prevSlug="march" nextSlug="may" />,
      'ko'
    );
    expect(screen.getByRole('link', { name: /3월/ })).toHaveAttribute(
      'href',
      '/ko/tools/birthday-secret/march'
    );
    expect(screen.getByRole('link', { name: /5월/ })).toHaveAttribute(
      'href',
      '/ko/tools/birthday-secret/may'
    );
  });

  it('renders English content with no Korean leakage', () => {
    withLocale(
      <MonthSpoke month={month} stone={stone} flowerSamples={[flowerWithMeaning]} prevSlug="march" nextSlug="may" />,
      'en'
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('April Birthstone');
    const main = screen.getByRole('article');
    expect(main.textContent).not.toMatch(/[가-힣]/);
  });

  it('renders zero representative flowers gracefully (no crash, no empty heading)', () => {
    withLocale(
      <MonthSpoke month={month} stone={stone} flowerSamples={[]} prevSlug="march" nextSlug="may" />,
      'ko'
    );
    expect(screen.queryByText('🌸', { exact: false })).not.toBeInTheDocument();
  });
});
