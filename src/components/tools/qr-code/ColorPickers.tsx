'use client';

import { useTranslations } from 'next-intl';

const PALETTE_COLORS = [
  { name: 'coral', hex: '#ff7a85' },
  { name: 'mint', hex: '#2dd4bf' },
  { name: 'sky', hex: '#38bdf8' },
  { name: 'sun', hex: '#fbbf24' },
  { name: 'grape', hex: '#e0912b' },
  { name: 'rose', hex: '#fb7185' },
  { name: 'black', hex: '#2a2411' },
  { name: 'white', hex: '#ffffff' },
];

interface Props {
  fgColor: string;
  bgColor: string;
  onFgChange: (hex: string) => void;
  onBgChange: (hex: string) => void;
  contrast?: number;
  isContrastAcceptable?: boolean;
}

export function ColorPickers({
  fgColor,
  bgColor,
  onFgChange,
  onBgChange,
  contrast = 0,
  isContrastAcceptable = true,
}: Props) {
  const t = useTranslations('tools.qr-code');

  const getContrastStatus = (value: number) => {
    if (value >= 50) return 'good';
    if (value >= 30) return 'warn';
    return 'poor';
  };

  const contrastStatus = getContrastStatus(contrast);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-success border-success';
      case 'warn':
        return 'bg-warning border-warning';
      case 'poor':
        return 'bg-danger border-danger';
      default:
        return 'bg-surface-muted border-hairline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'good':
        return t('colors.contrastGood');
      case 'warn':
        return t('colors.contrastWarn');
      case 'poor':
        return t('colors.contrastPoor');
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Contrast indicator */}
      <div className="rounded-md border border-hairline bg-surface p-3 space-y-2">
        <p className="text-sm font-medium text-text">
          {t('colors.contrast', { value: contrast })}
        </p>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full border ${getStatusColor(contrastStatus)}`} />
          <span className="text-xs text-text-secondary">{getStatusText(contrastStatus)}</span>
        </div>
      </div>

      {/* FG color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text">{t('colors.fgLabel')}</label>
        <input
          type="text"
          value={fgColor}
          onChange={(e) => {
            let hex = e.target.value;
            if (!hex.startsWith('#')) hex = '#' + hex;
            if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
              onFgChange(hex);
            }
          }}
          placeholder="#2a2411"
          className="w-full px-3 py-2 border border-hairline rounded-md bg-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
        <div className="flex flex-wrap gap-2">
          {PALETTE_COLORS.map(({ name, hex }) => (
            <button
              key={`fg-${name}`}
              onClick={() => onFgChange(hex)}
              className="w-11 h-11 rounded-lg border-2 border-hairline hover:border-brand focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none transition-colors"
              style={{ backgroundColor: hex }}
              title={t(`colors.names.${name}`)}
              aria-label={t('colors.applyFg', { color: t(`colors.names.${name}`) })}
            />
          ))}
        </div>
      </div>

      {/* BG color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text">{t('colors.bgLabel')}</label>
        <input
          type="text"
          value={bgColor}
          onChange={(e) => {
            let hex = e.target.value;
            if (!hex.startsWith('#')) hex = '#' + hex;
            if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
              onBgChange(hex);
            }
          }}
          placeholder="#ffffff"
          className="w-full px-3 py-2 border border-hairline rounded-md bg-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
        <div className="flex flex-wrap gap-2">
          {PALETTE_COLORS.map(({ name, hex }) => (
            <button
              key={`bg-${name}`}
              onClick={() => onBgChange(hex)}
              className="w-11 h-11 rounded-lg border-2 border-hairline hover:border-brand focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none transition-colors"
              style={{ backgroundColor: hex }}
              title={t(`colors.names.${name}`)}
              aria-label={t('colors.applyBg', { color: t(`colors.names.${name}`) })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
