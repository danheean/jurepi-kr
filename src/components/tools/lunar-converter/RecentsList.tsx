'use client';

import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import type { RecentEntry } from '@/lib/lunar-converter/schema';

interface RecentsListProps {
  recents: RecentEntry[];
  onSelectRecent: (recent: RecentEntry) => void;
}

export function RecentsList({ recents, onSelectRecent }: RecentsListProps) {
  const t = useTranslations('tools.lunar-converter');

  if (recents.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-surface-muted border border-hairline text-center">
        <p className="text-text-secondary text-sm">{t('recents.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text uppercase">{t('recents.title')}</h3>
      <div className="space-y-2">
        {recents.map((recent, idx) => (
          <button
            key={idx}
            onClick={() => onSelectRecent(recent)}
            className="w-full p-3 rounded-lg bg-surface border border-hairline text-left hover:bg-surface-muted hover:border-hairline-strong transition-colors focus:outline-none focus:ring-2 focus:ring-accent-grape"
            aria-label={`${recent.solarDate} → ${recent.lunarDate}`}
          >
            <p className="text-sm font-medium text-text">{recent.solarDate}</p>
            <p className="text-xs text-text-muted">{recent.lunarDate}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
