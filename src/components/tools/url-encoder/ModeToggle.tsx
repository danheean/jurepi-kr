'use client';

import { useTranslations } from 'next-intl';

interface Props {
  value: 'component' | 'uri';
  onChange: (mode: 'component' | 'uri') => void;
}

export function ModeToggle({ value, onChange }: Props) {
  const t = useTranslations('tools.url-encoder');

  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-semibold text-text">{t('mode.label')}</legend>
      <div className="flex gap-2">
        {(['component', 'uri'] as const).map((mode) => (
          <label key={mode} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value={mode}
              checked={value === mode}
              onChange={() => onChange(mode)}
              className="w-4 h-4 accent-accent-grape"
              aria-label={t(`mode.${mode}.label`)}
            />
            <span className="text-sm font-medium text-text">{t(`mode.${mode}.label`)}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-text-secondary">{t(`mode.${value}.help`)}</p>
    </fieldset>
  );
}
