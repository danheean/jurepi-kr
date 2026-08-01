'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { monthSlug, parseMonthDay } from '@/lib/birthday-secret/date';
import type { Locale } from '@/lib/birthday-secret/schema';

interface RecentsListProps {
  recents: string[];
  onSelectRecent: (key: string) => void;
  onClear: () => void;
}

/** Localized "N월 D일" / "Month D" label for a recent "MM-DD" key. */
function useRecentLabel() {
  const t = useTranslations('tools.birthday-secret');
  const locale = useLocale() as Locale;
  return (key: string) => {
    const parsed = parseMonthDay(key);
    if (!parsed) return key;
    const monthLabel = t(`months.${monthSlug(parsed.month)}`);
    return locale === 'ko' ? `${monthLabel} ${parsed.day}일` : `${monthLabel} ${parsed.day}`;
  };
}

/** Chip row of recently looked-up birthdays (localStorage, ≤10). Gate-outside: only mounted once recents exist. */
export function RecentsList({ recents, onSelectRecent, onClear }: RecentsListProps) {
  const t = useTranslations('tools.birthday-secret');
  const label = useRecentLabel();

  return (
    <section aria-labelledby="bs-recents-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="bs-recents-heading" className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          {t('recents.title')}
        </h2>
        <button
          type="button"
          onClick={onClear}
          aria-label={t('recents.clear')}
          title={t('recents.clear')}
          className="rounded-lg p-2 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recents.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelectRecent(key)}
            className="min-h-[44px] rounded-xl border border-hairline bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-accent-rose-soft hover:text-accent-rose-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {label(key)}
          </button>
        ))}
      </div>
    </section>
  );
}
