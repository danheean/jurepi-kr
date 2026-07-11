'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface RecentsListProps {
  recents: string[];
  onLoad: (expression: string) => void;
  onDelete: (expression: string) => void;
}

export function RecentsList({ recents, onLoad, onDelete }: RecentsListProps) {
  const t = useTranslations('tools.cron-parser');
  const [isOpen, setIsOpen] = useState(false);

  if (recents.length === 0) return null;

  return (
    <details
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
      className="bg-surface border border-hairline rounded-lg p-4 space-y-3"
    >
      <summary className="cursor-pointer font-medium text-text hover:text-brand-ink rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring">
        {t('recentLabel')} ({recents.length})
      </summary>

      <div className="space-y-2">
        {recents.map((expr) => (
          <div
            key={expr}
            className="flex items-center justify-between gap-2 p-2 rounded border border-hairline bg-surface-muted hover:bg-surface-sunken transition-colors"
          >
            <button
              onClick={() => onLoad(expr)}
              className="flex-1 min-h-[44px] inline-flex items-center text-left font-mono text-sm text-text-secondary hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring rounded px-2 py-1"
            >
              {expr}
            </button>
            <button
              onClick={() => onDelete(expr)}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-lg leading-none font-medium text-danger-ink hover:bg-danger/10 rounded transition-all duration-200 motion-safe:active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-danger"
              aria-label={t('deleteRecent')}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          recents.forEach((expr) => onDelete(expr));
        }}
        className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-hairline text-text text-sm hover:bg-surface-muted transition-all duration-200 motion-safe:active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring"
      >
        {t('clearRecentsLabel')}
      </button>
    </details>
  );
}
