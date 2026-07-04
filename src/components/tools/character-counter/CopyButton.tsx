'use client';

import { useTranslations } from 'next-intl';
import { Copy } from 'lucide-react';

interface CopyButtonProps {
  onClick: () => Promise<void>;
  labelKey: 'button.copyText' | 'button.copyStats';
}

/**
 * Copy button. Feedback is via clipboard success (silent for now;
 * platform Toast can be wired later).
 */
export function CopyButton({ onClick, labelKey }: CopyButtonProps) {
  const t = useTranslations('tools.character-counter');

  const handleClick = async () => {
    await onClick();
    // Platform toast feedback can be wired here later
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand text-on-brand rounded-lg font-medium hover:bg-brand-strong transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand min-h-11 min-w-11"
      aria-label={t(labelKey)}
    >
      <Copy size={18} />
      <span>{t(labelKey)}</span>
    </button>
  );
}
