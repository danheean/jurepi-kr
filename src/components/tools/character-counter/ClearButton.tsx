'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, Check } from 'lucide-react';

interface ClearButtonProps {
  onClick: () => void;
}

const CLEARED_FEEDBACK_MS = 1600;

/**
 * Clear button with brief inline confirmation: the label becomes a localized
 * "Cleared!" for ~1.6s, announced via aria-live.
 */
export function ClearButton({ onClick }: ClearButtonProps) {
  const t = useTranslations('tools.character-counter');
  const [cleared, setCleared] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleClick = useCallback(() => {
    onClick();
    setCleared(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCleared(false), CLEARED_FEEDBACK_MS);
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface-muted text-text rounded-lg font-medium hover:bg-surface-sunken transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand min-h-11 min-w-11"
      aria-label={t('button.clear')}
    >
      {cleared ? <Check size={18} aria-hidden /> : <Trash2 size={18} aria-hidden />}
      <span aria-live="polite">{cleared ? t('toast.cleared') : t('button.clear')}</span>
    </button>
  );
}
