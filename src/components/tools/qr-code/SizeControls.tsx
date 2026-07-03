'use client';

import { useTranslations } from 'next-intl';

interface SizeControlsProps {
  size: number;
  quietZone: number;
  onSizeChange: (size: number) => void;
  onQzChange: (qz: number) => void;
}

export function SizeControls({
  size,
  quietZone,
  onSizeChange,
  onQzChange,
}: SizeControlsProps) {
  const t = useTranslations('tools.qr-code');

  return (
    <div className="space-y-6">
      {/* Size Slider */}
      <div className="space-y-2">
        <label htmlFor="qr-size" className="block text-sm font-semibold text-text">
          {t('size.label', { size })}
        </label>
        <input
          id="qr-size"
          type="range"
          min="200"
          max="500"
          step="50"
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-full h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-accent-sky focus-visible:ring-2 focus-visible:ring-focus-ring"
        />
        <div className="flex justify-between text-xs text-text-secondary">
          <span>200px</span>
          <span>500px</span>
        </div>
      </div>

      {/* Quiet Zone Slider */}
      <div className="space-y-2">
        <label htmlFor="qr-quietzone" className="block text-sm font-semibold text-text">
          {t('size.quietZoneLabel', { qz: quietZone })}
        </label>
        <input
          id="qr-quietzone"
          type="range"
          min="4"
          max="8"
          step="1"
          value={quietZone}
          onChange={(e) => onQzChange(Number(e.target.value))}
          className="w-full h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-accent-sky focus-visible:ring-2 focus-visible:ring-focus-ring"
        />
        <div className="flex justify-between text-xs text-text-secondary">
          <span>{t('size.qzMin')}</span>
          <span>{t('size.qzMax')}</span>
        </div>
      </div>
    </div>
  );
}
