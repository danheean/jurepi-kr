'use client';

import { useTranslations } from 'next-intl';
import type { AgeResult } from '@/lib/age-calculator/age';

interface Props {
  age: AgeResult;
  locale: string;
}

/**
 * DateFacts: Displays 6 facts about the birthdate
 * - 2×2 grid on desktop, 1-col on mobile
 * - Zodiac, StarSign, DayOfWeek, DaysLived, Breakdown, Countdown
 * `locale` (BCP-47 from the parent's useLocale) is the single locale source —
 * used for both Intl formatting and the ko/en text branches.
 */
export function DateFacts({ age, locale }: Props) {
  const t = useTranslations('tools.age-calculator');

  /**
   * Format day of week using Intl.DateTimeFormat
   * We need to create a date with the correct day of week
   * Using 2024-01-01 as reference week (Sunday), then offset by dayOfWeek
   */
  const getDayOfWeekName = (): string => {
    const referenceDate = new Date(2024, 0, 1); // Jan 1, 2024 is a Monday (1)
    const dayOffset = age.dayOfWeek - referenceDate.getDay();
    const dateWithCorrectDayOfWeek = new Date(2024, 0, 1 + dayOffset);

    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      weekday: 'long',
    }).format(dateWithCorrectDayOfWeek);
  };

  /**
   * Format days lived with locale-specific number grouping
   */
  const getDaysLivedFormatted = (): string => {
    return age.daysLived.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US');
  };

  /**
   * Format breakdown: "X년 Y개월 Z일" (Korean) or "Xy Zm Zd" (English)
   */
  const getBreakdownFormatted = (): string => {
    const { years, months, days } = age.breakdown;
    if (locale === 'ko') {
      return `${years}년 ${months}개월 ${days}일`;
    }
    // English: use unambiguous unit abbreviations (mo for months, not "m" which reads as minutes)
    return `${years}y ${months}mo ${days}d`;
  };

  /**
   * Format countdown: "N일" (Korean) or "N days" (English)
   */
  const getCountdownFormatted = (): string => {
    if (locale === 'ko') {
      return `${age.nextBirthdayCountdown}일`;
    }
    return `${age.nextBirthdayCountdown} day${age.nextBirthdayCountdown === 1 ? '' : 's'}`;
  };

  /**
   * Format the counterpart birthday (the same birthdate in the other calendar).
   * Solar counterpart uses Intl (month names are meaningful); lunar counterpart
   * uses numeric formatting in English — Gregorian month names would be factually
   * wrong for a lunar month (same convention as the lunar-converter tool).
   */
  const getCounterpartFormatted = (): string => {
    const c = age.counterpartBirthday;
    if (!c) return '';
    const [y, m, d] = c.date.split('-').map(Number);
    if (c.calendar === 'solar') {
      return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(y, m - 1, d));
    }
    const leap = c.isLeapMonth ? (locale === 'ko' ? ' (윤달)' : ' (leap month)') : '';
    if (locale === 'ko') {
      return `${y}년 ${m}월 ${d}일${leap}`;
    }
    return `${c.date}${leap}`;
  };

  const facts = [
    {
      key: 'zodiac',
      label: t('dateFacts.zodiac'),
      value: t(`zodiac.${age.zodiacKey}`),
    },
    ...(age.sexagenary
      ? [
          {
            key: 'sexagenary',
            label: t('dateFacts.sexagenary'),
            // Korean reads the native gapja name; English uses the romanized
            // element+animal (e.g. "Metal Horse") so the EN page carries no
            // untranslated Hangul — mirrors the lunar-converter tool.
            value:
              locale === 'ko'
                ? `${age.sexagenary.name} (${age.sexagenary.hanja})`
                : `${age.sexagenary.english} (${age.sexagenary.hanja})`,
          },
        ]
      : []),
    ...(age.counterpartBirthday
      ? [
          {
            key: 'counterpartBirthday',
            label:
              age.counterpartBirthday.calendar === 'solar'
                ? t('dateFacts.solarBirthday')
                : t('dateFacts.lunarBirthday'),
            value: getCounterpartFormatted(),
          },
        ]
      : []),
    {
      key: 'starSign',
      label: t('dateFacts.starSign'),
      value: t(`starSign.${age.starSignKey}`),
    },
    {
      key: 'dayOfWeek',
      label: t('dateFacts.dayOfWeek'),
      value: getDayOfWeekName(),
    },
    {
      key: 'daysLived',
      label: t('dateFacts.daysLived'),
      value: getDaysLivedFormatted(),
    },
    {
      key: 'breakdown',
      label: t('dateFacts.breakdown'),
      value: getBreakdownFormatted(),
    },
    {
      key: 'countdown',
      label: t('dateFacts.countdown'),
      value: getCountdownFormatted(),
    },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-text">{t('dateFacts.title')}</h2>

      {/* Facts grid: 2×2 on desktop, 1 col on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facts.map((fact) => (
          <div
            key={fact.key}
            className="bg-surface-muted border border-hairline rounded-md p-4"
          >
            <div className="text-xs font-semibold text-text-secondary mb-1.5">
              {fact.label}
            </div>
            <div className="text-2xl font-bold text-text">{fact.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
