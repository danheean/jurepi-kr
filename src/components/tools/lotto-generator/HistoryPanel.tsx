'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { HistoryEntry } from '@/lib/lotto-generator/schema';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
}

function formatTimestamp(isoString: string, locale: string): string {
  const now = new Date();
  const entry = new Date(isoString);
  const diffMs = now.getTime() - entry.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return locale === 'ko' ? '방금 전' : 'Just now';
  if (diffMins < 60) return locale === 'ko' ? `${diffMins}분 전` : `${diffMins} minutes ago`;
  if (diffHours < 24) return locale === 'ko' ? `${diffHours}시간 전` : `${diffHours} hours ago`;
  return locale === 'ko' ? `${diffDays}일 전` : `${diffDays} days ago`;
}

export function HistoryPanel({ history, onRestore, onClear }: HistoryPanelProps) {
  const t = useTranslations('tools.lotto-generator');
  const locale = useLocale();
  const [expanded, setExpanded] = useState<number | null>(null);

  if (history.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-surface-sunken border border-hairline text-center">
        <p className="text-text-muted text-sm">{t('history.empty')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-surface-sunken border border-hairline space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{t('history.title')}</h3>
        <button
          onClick={onClear}
          className="px-3 py-1 text-sm rounded bg-danger/10 text-danger hover:bg-danger/20 focus-visible:ring-2 focus-visible:ring-focus-ring flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('buttons.clearHistory')}</span>
        </button>
      </div>

      <div className="space-y-2">
        {history.map((entry, idx) => (
          <div key={idx} className="border border-hairline rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              className="w-full px-3 py-2 bg-surface-sunken hover:bg-surface-sunken/80 focus-visible:ring-2 focus-visible:ring-focus-ring flex items-center justify-between"
            >
              <div className="text-left text-sm">
                <div className="font-medium">
                  {t('history.gameCountLabel', { n: entry.gameCount })}
                </div>
                <div className="text-xs text-text-muted">
                  {formatTimestamp(entry.timestamp, locale)}
                </div>
              </div>
              {expanded === idx ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expanded === idx && (
              <div className="p-3 space-y-2 bg-white border-t border-hairline">
                <div className="text-xs text-text-muted">
                  {entry.fixedNumbers.length > 0 && (
                    <p>
                      Fixed: {entry.fixedNumbers.join(', ')}
                    </p>
                  )}
                  {entry.excludedNumbers.length > 0 && (
                    <p>
                      Excluded: {entry.excludedNumbers.join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRestore(entry)}
                  className="w-full px-3 py-2 text-sm rounded bg-brand text-on-brand hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {t('buttons.generate')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
