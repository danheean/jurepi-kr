'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  onClick: () => Promise<void>;
  labelKey: 'button.copyText' | 'button.copyStats';
}

const COPIED_FEEDBACK_MS = 1600;

/**
 * Copy button with inline success feedback: on success the icon swaps to a check
 * and the label becomes a localized "Copied!" for ~1.6s, announced via aria-live.
 */
export function CopyButton({ onClick, labelKey }: CopyButtonProps) {
  const t = useTranslations('tools.character-counter');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const copiedKey = labelKey === 'button.copyText' ? 'toast.copiedText' : 'toast.copiedStats';

  const handleClick = useCallback(async () => {
    await onClick();
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand text-on-brand rounded-lg font-medium hover:bg-brand-strong transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand min-h-11 min-w-11"
      aria-label={t(labelKey)}
    >
      {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
      <span aria-live="polite">{copied ? t(copiedKey) : t(labelKey)}</span>
    </button>
  );
}
