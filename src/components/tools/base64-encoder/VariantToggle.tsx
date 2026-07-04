'use client';

import { useTranslations } from 'next-intl';

interface Props {
  value: 'standard' | 'urlSafe';
  onChange: (variant: 'standard' | 'urlSafe') => void;
}

export function VariantToggle({ value, onChange }: Props) {
  const t = useTranslations('tools.base64-encoder');

  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-semibold text-text">{t('variant.label')}</legend>
      <div className="flex gap-2">
        {(['standard', 'urlSafe'] as const).map((variant) => (
          <label key={variant} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="variant"
              value={variant}
              checked={value === variant}
              onChange={() => onChange(variant)}
              className="w-4 h-4 accent-accent-coral"
              aria-label={t(`variant.${variant}`)}
            />
            <span className="text-sm font-medium text-text">{t(`variant.${variant}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
