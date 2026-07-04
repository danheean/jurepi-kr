'use client';

import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';

interface ClearButtonProps {
  onClick: () => void;
}

/**
 * Clear button. Clears the textarea (platform Toast can be wired later).
 */
export function ClearButton({ onClick }: ClearButtonProps) {
  const t = useTranslations('tools.character-counter');

  const handleClick = () => {
    onClick();
    // Platform toast feedback can be wired here later
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface-muted text-text rounded-lg font-medium hover:bg-surface-sunken transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand min-h-11 min-w-11"
      aria-label={t('button.clear')}
    >
      <Trash2 size={18} />
      <span>{t('button.clear')}</span>
    </button>
  );
}
