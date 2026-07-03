'use client';

import { useTranslations, useLocale } from 'next-intl';

interface Props {
  recents: string[]; // DateKey[]
  onSelectRecent: (dateKey: string) => void;
  onClear: () => void;
}

/**
 * RecentLookups: Displays recently calculated birthdates as chips
 * - Only renders when recents.length > 0
 * - Each chip formats the DateKey via Intl.DateTimeFormat
 * - "Clear" button clears all recents
 */
export function RecentLookups({ recents, onSelectRecent, onClear }: Props) {
  const t = useTranslations('tools.age-calculator');
  const locale = useLocale();

  if (recents.length === 0) {
    return null;
  }

  /**
   * Format a DateKey (YYYY-MM-DD) for display using Intl.DateTimeFormat
   */
  const formatDate = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

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

      {/* Chips: horizontal scroll/wrap */}
      <div className="flex flex-wrap gap-2">
        {recents.map((dateKey) => (
          <button
            key={dateKey}
            onClick={() => onSelectRecent(dateKey)}
            aria-label={t('recents.ariaReuse', { datekey: formatDate(dateKey) })}
            className="px-3 py-2 rounded-full bg-surface-muted border border-hairline text-sm text-text transition-colors min-h-11 min-w-max hover:bg-accent-mint-soft hover:text-accent-mint-ink hover:border-accent-mint"
          >
            {formatDate(dateKey)}
          </button>
        ))}
      </div>
    </section>
  );
}
