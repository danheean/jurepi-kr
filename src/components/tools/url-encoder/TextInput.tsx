'use client';

import { useTranslations } from 'next-intl';
import { INPUT_MAX_LEN } from '@/lib/url-encoder/schema';

interface Props {
  value: string;
  onChange: (text: string) => void;
  onProcess: () => Promise<void>;
  batchMode: boolean;
  onClear: () => void;
}

export function TextInput({ value, onChange, onProcess, batchMode, onClear }: Props) {
  const t = useTranslations('tools.url-encoder');
  const charCount = value.length;
  const warnThreshold = Math.floor(INPUT_MAX_LEN * 0.8);
  const isNearLimit = charCount > warnThreshold;

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      await onProcess();
    }
    if (e.key === 'Escape' && value) {
      e.preventDefault();
      onClear();
    }
  };

  return (
    <div className="space-y-2">
      {batchMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('input.placeholder')}
          aria-label={t('input.aria')}
          className="w-full min-h-32 p-4 border border-hairline rounded-lg bg-surface text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-focus-ring resize-vertical font-mono text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('input.placeholder')}
          aria-label={t('input.aria')}
          className="w-full px-4 py-3 border border-hairline rounded-lg bg-surface text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-focus-ring font-mono text-sm"
        />
      )}
      <div className="flex justify-between items-center text-xs text-text-secondary">
        <span>
          {charCount} / {INPUT_MAX_LEN}
        </span>
        {isNearLimit && (
          <span className="text-warning-ink font-medium">
            {Math.round(((INPUT_MAX_LEN - charCount) / INPUT_MAX_LEN) * 100)}% remaining
          </span>
        )}
      </div>
    </div>
  );
}
