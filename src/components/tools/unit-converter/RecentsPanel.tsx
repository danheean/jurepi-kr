'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { type RecentsEntry } from '@/lib/unit-converter';

interface Props {
  recents: RecentsEntry[];
  onRestore: (entry: RecentsEntry) => void;
  onClear: () => void;
}

/**
 * RecentsPanel: Recent conversions history with restore + clear buttons.
 */
export function RecentsPanel({ recents, onRestore, onClear }: Props) {
  const t = useTranslations('tools.unit-converter');
  const locale = useLocale();

  if (recents.length === 0) {
    return (
      <div className="text-center text-text-muted py-8">
        {t('recents.empty')}
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const elapsed = Date.now() - timestamp;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(elapsed / 3600000);
    const days = Math.floor(elapsed / 86400000);

    if (minutes < 1) return t('recents.justNow');
    if (minutes < 60) return t('recents.minutesAgo', { count: minutes });
    if (hours < 24) return t('recents.hoursAgo', { count: hours });
    if (days < 7) return t('recents.daysAgo', { count: days });

    return new Date(timestamp).toLocaleDateString(locale);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">{t('recents.heading')}</h3>
        <button
          onClick={onClear}
          aria-label={t('buttons.clear')}
          title={t('buttons.clear')}
          className={`
            p-2 rounded-lg transition-colors
            hover:bg-danger/10 hover:text-danger-ink
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
          `}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {recents.map((entry, idx) => (
          <button
            key={`${entry.timestamp}-${idx}`}
            onClick={() => onRestore(entry)}
            className={`
              px-3 py-2 rounded-lg text-sm bg-surface-muted border border-hairline
              hover:border-accent-sky hover:bg-accent-sky-soft
              transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
            `}
            title={formatTime(entry.timestamp)}
          >
            <div className="font-medium text-text">
              {entry.fromValue} {t(`units.${entry.fromUnit}`)} → {t(`units.${entry.toUnit}`)}
            </div>
            <div className="text-xs text-text-muted">{formatTime(entry.timestamp)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
