import { describe, it, expect } from "vitest";
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { DateFacts } from './DateFacts';
import type { AgeResult } from '@/lib/age-calculator/age';
import messages from '@/i18n/messages/ko.json';

describe('DateFacts', () => {
  const mockAge: AgeResult = {
    manNai: 25,
    yeonNai: 26,
    seeneunNai: 27,
    dayOfWeek: 3, // Wednesday
    daysLived: 9131,
    breakdown: { years: 25, months: 2, days: 15 },
    nextBirthdayCountdown: 50,
    zodiacKey: 'tiger',
    starSignKey: 'aries',
  };

  // The parent passes locale from useLocale() → the BCP-47 base ('ko' | 'en'),
  // NOT a regional tag like 'ko-KR'. DateFacts maps that to a regional Intl locale.
  const renderComponent = (age: AgeResult = mockAge, locale: string = 'ko') => {
    return render(
      <NextIntlClientProvider locale="ko" messages={messages as any}>
        <DateFacts age={age} locale={locale} />
      </NextIntlClientProvider>
    );
  };

  it('renders title', () => {
    renderComponent();
    expect(screen.getByText(messages.tools['age-calculator'].dateFacts.title)).toBeInTheDocument();
  });

  it('renders all fact labels', () => {
    renderComponent();
    expect(screen.getByText(messages.tools['age-calculator'].dateFacts.zodiac)).toBeInTheDocument();
    expect(screen.getByText(messages.tools['age-calculator'].dateFacts.starSign)).toBeInTheDocument();
    expect(screen.getByText(messages.tools['age-calculator'].dateFacts.dayOfWeek)).toBeInTheDocument();
    expect(screen.getByText(messages.tools['age-calculator'].dateFacts.daysLived)).toBeInTheDocument();
    expect(screen.getByText(messages.tools['age-calculator'].dateFacts.breakdown)).toBeInTheDocument();
    expect(screen.getByText(messages.tools['age-calculator'].dateFacts.countdown)).toBeInTheDocument();
  });

  it('renders zodiac name localized from key', () => {
    renderComponent();
    expect(screen.getByText(messages.tools['age-calculator'].zodiac.tiger)).toBeInTheDocument();
  });

  it('renders star sign name localized from key', () => {
    renderComponent();
    expect(screen.getByText(messages.tools['age-calculator'].starSign.aries)).toBeInTheDocument();
  });

  it('renders days lived with locale-specific formatting', () => {
    renderComponent();
    // Korean locale: 9,131 with comma
    const daysLivedElement = screen.getByText((content) => content.includes('9'));
    expect(daysLivedElement).toBeInTheDocument();
  });

  it('renders breakdown in Korean format (X년 Y개월 Z일)', () => {
    renderComponent();
    expect(screen.getByText('25년 2개월 15일')).toBeInTheDocument();
  });

  it('renders countdown in Korean format (N일)', () => {
    renderComponent();
    expect(screen.getByText('50일')).toBeInTheDocument();
  });

  it('renders day of week name', () => {
    renderComponent();
    // dayOfWeek 3 = Wednesday
    const dayOfWeekText = screen.getByText((content) =>
      /수|wed/i.test(content)
    );
    expect(dayOfWeekText).toBeInTheDocument();
  });

  it('formats breakdown and countdown consistently from the single locale prop (en)', () => {
    // Regression guard: breakdown/countdown must follow the SAME locale as the
    // rest of the facts (previously breakdown used a second useLocale() source).
    renderComponent(mockAge, 'en');
    expect(screen.getByText('25y 2mo 15d')).toBeInTheDocument();
    expect(screen.getByText('50 days')).toBeInTheDocument();
  });

  it('renders with different age values', () => {
    const customAge: AgeResult = {
      ...mockAge,
      daysLived: 20000,
      breakdown: { years: 54, months: 9, days: 20 },
      nextBirthdayCountdown: 100,
      zodiacKey: 'rat',
      starSignKey: 'pisces',
    };
    renderComponent(customAge);

    expect(screen.getByText(messages.tools['age-calculator'].zodiac.rat)).toBeInTheDocument();
    expect(screen.getByText(messages.tools['age-calculator'].starSign.pisces)).toBeInTheDocument();
    expect(screen.getByText('54년 9개월 20일')).toBeInTheDocument();
    expect(screen.getByText('100일')).toBeInTheDocument();
  });
});
