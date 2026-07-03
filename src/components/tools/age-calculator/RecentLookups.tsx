'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { RecentEntry } from '@/lib/age-calculator/recents';

interface Props {
  recents: RecentEntry[];
  onSelectRecent: (entry: RecentEntry) => void;
  onClear: () => void;
}

/**
 * RecentLookups: recently calculated birthdates as chips. Each chip shows the
 * date formatted for the locale, with a 음력/(윤) marker when it was a lunar
 * entry, so a returning user recalls exactly what they entered.
 */
export function RecentLookups({ recents, onSelectRecent, onClear }: Props) {
  const t = useTranslations('tools.age-calculator');
  const locale = useLocale();

  if (recents.length === 0) {
    return null;
  }

  const formatDate = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const label = (entry: RecentEntry): string => {
    const base = formatDate(entry.date);
    if (entry.calendarType !== 'lunar') return base;
    const leap = entry.isLeapMonth ? ` ${t('recents.leapTag')}` : '';
    return `${base} · ${t('recents.lunarTag')}${leap}`;
  };

  const keyOf = (e: RecentEntry) => `${e.calendarType}:${e.date}:${e.isLeapMonth ? 'L' : ''}`;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">{t('recents.heading')}</h3>
        <button
          onClick={onClear}
          className="-mr-2 px-2 py-1 text-xs text-text-secondary hover:text-text transition-colors underline"
        >
          {t('recents.clear')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {recents.map((entry) => (
          <button
            key={keyOf(entry)}
            onClick={() => onSelectRecent(entry)}
            aria-label={t('recents.ariaReuse', { datekey: label(entry) })}
            className="px-3 py-2 rounded-full bg-surface-muted border border-hairline text-sm text-text transition-colors min-h-11 min-w-max hover:bg-accent-mint-soft hover:text-accent-mint-ink hover:border-accent-mint"
          >
            {label(entry)}
          </button>
        ))}
      </div>
    </section>
  );
}
