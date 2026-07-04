'use client';

import { useTranslations } from 'next-intl';

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TextInput({ value, onChange, placeholder, disabled = false }: Props) {
  const t = useTranslations('tools.base64-encoder');

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || t('input.textPlaceholder')}
      disabled={disabled}
      aria-label={t('input.textPlaceholder')}
      className="w-full min-h-32 p-4 border border-hairline rounded-lg bg-surface text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:opacity-50 disabled:cursor-not-allowed resize-vertical font-mono text-sm"
    />
  );
}
