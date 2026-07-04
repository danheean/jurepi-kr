'use client';

import { useTranslations } from 'next-intl';

interface Props {
  value: 'text' | 'file';
  onChange: (mode: 'text' | 'file') => void;
}

export function ModeToggle({ value, onChange }: Props) {
  const t = useTranslations('tools.base64-encoder');

  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-semibold text-text">{t('mode.label')}</legend>
      <div className="flex gap-2">
        {(['text', 'file'] as const).map((mode) => (
          <label key={mode} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value={mode}
              checked={value === mode}
              onChange={() => onChange(mode)}
              className="w-4 h-4 accent-accent-coral"
              aria-label={t(`mode.${mode}`)}
            />
            <span className="text-sm font-medium text-text">{t(`mode.${mode}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
