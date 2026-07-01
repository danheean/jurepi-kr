'use client';

import { useTranslations } from 'next-intl';

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function BatchToggle({ value, onChange }: Props) {
  const t = useTranslations('tools.url-encoder');

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-accent-grape"
        aria-label={t('batch.label')}
      />
      <div>
        <span className="text-sm font-medium text-text">{t('batch.label')}</span>
        <p className="text-xs text-text-secondary">{t('batch.help')}</p>
      </div>
    </label>
  );
}
