'use client';

import { useTranslations } from 'next-intl';

interface Props {
  value: 'encode' | 'decode';
  onChange: (direction: 'encode' | 'decode') => void;
}

export function DirectionToggle({ value, onChange }: Props) {
  const t = useTranslations('tools.base64-encoder');

  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-semibold text-text">{t('direction.label')}</legend>
      <div className="flex gap-2">
        {(['encode', 'decode'] as const).map((direction) => (
          <label key={direction} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="direction"
              value={direction}
              checked={value === direction}
              onChange={() => onChange(direction)}
              className="w-4 h-4 accent-accent-coral"
              aria-label={t(`direction.${direction}`)}
            />
            <span className="text-sm font-medium text-text">{t(`direction.${direction}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
