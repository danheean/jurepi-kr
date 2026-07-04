'use client';

import { useTranslations } from 'next-intl';
import { PRECISION_MIN, PRECISION_MAX } from '@/lib/unit-converter';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

/**
 * PrecisionSlider: Range [0–6] for decimal places.
 */
export function PrecisionSlider({ value, onChange }: Props) {
  const t = useTranslations('tools.unit-converter');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="precision-slider" className="text-sm font-medium text-text">
          {t('precision.label')}
        </label>
        <span className="text-sm font-semibold text-accent-sky-ink">
          {t('precision.caption', { count: value })}
        </span>
      </div>
      <input
        id="precision-slider"
        type="range"
        min={PRECISION_MIN}
        max={PRECISION_MAX}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-accent-sky-soft rounded-lg appearance-none cursor-pointer accent-accent-sky"
        aria-valuemin={PRECISION_MIN}
        aria-valuemax={PRECISION_MAX}
        aria-valuenow={value}
        aria-valuetext={t('precision.caption', { count: value })}
      />
    </div>
  );
}
