'use client';

import { useTranslations } from 'next-intl';

interface ExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExpressionInput({ value, onChange }: ExpressionInputProps) {
  const t = useTranslations('tools.cron-parser');

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('expressionPlaceholder')}
      aria-label={t('expressionLabel')}
      className="w-full min-h-[44px] px-4 py-2 rounded-lg border border-hairline bg-surface text-text placeholder-text-secondary font-mono text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring"
    />
  );
}
