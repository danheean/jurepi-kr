import { useTranslations } from 'next-intl';
import { Pipette } from 'lucide-react';
import type { RGB } from '@/lib/transparent-background';

interface BackgroundColorPickerProps {
  bgColor: RGB;
  onColorChange: (color: RGB) => void;
  onAutoDetect: () => Promise<void>;
  onEyedropperMode: () => void;
  isLoading?: boolean;
}

function rgbToHex(rgb: RGB): string {
  return `#${[rgb.r, rgb.g, rgb.b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function BackgroundColorPicker({
  bgColor,
  onColorChange,
  onAutoDetect,
  onEyedropperMode,
  isLoading,
}: BackgroundColorPickerProps) {
  const t = useTranslations('tools.transparent-background');

  const hexValue = rgbToHex(bgColor);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const rgb = hexToRgb(hex);
    if (rgb) {
      onColorChange(rgb);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-text">
        {t('colorPicker.label')}
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onAutoDetect}
          disabled={isLoading}
          className="min-h-[44px] rounded-md border border-accent-sky/30 bg-accent-sky-soft px-4 py-2 text-sm font-medium text-accent-sky-ink transition-colors hover:bg-accent-sky-soft/80 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t('colorPicker.autoDetect')}
        >
          {t('colorPicker.autoDetect')}
        </button>

        <button
          onClick={onEyedropperMode}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface-muted px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-sunken disabled:opacity-50"
          aria-label={t('colorPicker.eyedropperMode')}
        >
          <Pipette className="h-4 w-4" />
          {t('colorPicker.eyedropper')}
        </button>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <label htmlFor="hex-input" className="text-xs font-medium text-text-secondary">
            {t('colorPicker.hexInput')}
          </label>
          <input
            id="hex-input"
            type="text"
            value={hexValue}
            onChange={handleHexChange}
            placeholder={t('colorPicker.hexPlaceholder')}
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm font-mono text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-sky"
            pattern="#[0-9A-Fa-f]{6}"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <div
            className="h-12 w-12 rounded-lg border-2 border-hairline"
            style={{
              backgroundColor: rgbToHex(bgColor),
            }}
            role="img"
            aria-label={`${t('colorPicker.currentColor')}: ${rgbToHex(bgColor)}`}
          />
          <span className="text-xs text-text-secondary">{t('colorPicker.currentColor')}</span>
        </div>
      </div>
    </div>
  );
}
