'use client';

import { useTranslations } from 'next-intl';

interface SizeControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function SizeControl({
  value,
  onChange,
  min = 100,
  max = 300,
  step = 10,
}: SizeControlProps) {
  const t = useTranslations('tools.barcode-generator');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-brand-ink">
        {t('size.label', { width: value })}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-2 bg-surface-sunken rounded-lg appearance-none cursor-pointer accent-brand"
        data-testid="size-slider"
      />
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{min}px</span>
        <span>{max}px</span>
      </div>
    </div>
  );
}
