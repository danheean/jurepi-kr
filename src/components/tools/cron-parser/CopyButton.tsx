'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface CopyButtonProps {
  expression: string;
}

export function CopyButton({ expression }: CopyButtonProps) {
  const t = useTranslations('tools.cron-parser');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(expression);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback: try old API
      const textarea = document.createElement('textarea');
      textarea.value = expression;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 px-4 py-2 rounded-lg bg-brand text-on-brand hover:bg-brand-strong font-medium text-sm whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
      aria-label={t('copyLabel')}
    >
      {isCopied ? t('copiedToast', { defaultValue: 'Copied!' }) : t('copyLabel')}
    </button>
  );
}
