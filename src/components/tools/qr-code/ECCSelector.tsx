'use client';

import { useTranslations } from 'next-intl';
import { ECCLevel } from '@/lib/qr-code/types';

interface ECCSelectorProps {
  value: ECCLevel;
  onChange: (ecc: ECCLevel) => void;
}

const ECC_LEVELS: ECCLevel[] = ['L', 'M', 'Q', 'H'];

export function ECCSelector({ value, onChange }: ECCSelectorProps) {
  const t = useTranslations('tools.qr-code');

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-text">{t('ecc.label')}</legend>
      <div className="flex flex-wrap gap-2">
        {ECC_LEVELS.map((level) => (
          <label
            key={level}
            className="flex items-center gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-focus-ring rounded px-2 py-1"
          >
            <input
              type="radio"
              name="ecc"
              value={level}
              checked={value === level}
              onChange={() => onChange(level)}
              className="w-4 h-4 accent-accent-sky focus-visible:ring-2 focus-visible:ring-offset-2"
            />
            <span className="text-sm font-medium text-text">
              {t(`ecc.${level.toLowerCase()}`)}
            </span>
          </label>
        ))}
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        {t('ecc.help')}
      </p>
    </fieldset>
  );
}
