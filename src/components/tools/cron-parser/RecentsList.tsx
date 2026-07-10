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
      <summary className="cursor-pointer font-medium text-text hover:text-brand">
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
              className="flex-1 text-left font-mono text-sm text-text-secondary hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand rounded px-2 py-1"
            >
              {expr}
            </button>
            <button
              onClick={() => onDelete(expr)}
              className="px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-danger"
              aria-label={t('deleteRecent', { defaultValue: 'Delete' })}
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
        className="w-full px-3 py-2 rounded-lg border border-hairline text-text text-sm hover:bg-surface-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
      >
        {t('clearRecentsLabel')}
      </button>
    </details>
  );
}
