'use client';

import { useTranslations } from 'next-intl';

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
  decodeOnly?: boolean;
}

export function PlusAsSpaceToggle({ value, onChange, decodeOnly }: Props) {
  const t = useTranslations('tools.url-encoder');

  if (decodeOnly) {
    return null;
  }

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-accent-grape"
        aria-label={t('plusAsSpace.label')}
      />
      <div>
        <span className="text-sm font-medium text-text">{t('plusAsSpace.label')}</span>
        <p className="text-xs text-text-secondary">{t('plusAsSpace.help')}</p>
      </div>
    </label>
  );
}
