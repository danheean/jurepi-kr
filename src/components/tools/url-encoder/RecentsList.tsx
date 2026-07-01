'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  recents: string[];
  onSelect: (text: string) => void;
  onClear: () => void;
}

export function RecentsList({ recents, onSelect, onClear }: Props) {
  const t = useTranslations('tools.url-encoder');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
          isOpen
            ? 'bg-accent-grape text-white'
            : 'bg-surface-muted text-text hover:bg-hairline-strong'
        }`}
        aria-expanded={isOpen}
        aria-label={t('recents.label')}
      >
        {t('recents.label')}
      </button>

      {isOpen && (
        <div className="bg-surface-muted border border-hairline rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
          {recents.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-4">{t('recents.empty')}</p>
          ) : (
            <>
              {recents.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded bg-surface hover:bg-hairline border border-hairline text-sm text-text truncate transition"
                  title={item}
                >
                  {item.length > 50 ? item.slice(0, 50) + '...' : item}
                </button>
              ))}
              <button
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-danger-ink hover:bg-danger/10 rounded transition"
                aria-label={t('recents.clear')}
              >
                {t('recents.clear')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
