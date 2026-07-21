'use client';

import { useTranslations } from 'next-intl';
import { CheerSettings, isLowContrast, resolveEffectiveSize } from '@/lib/cheer';
import { Maximize2, Zap } from 'lucide-react';

interface CheerControlsProps {
  settings: CheerSettings;
  onSettingsChange: (updates: Partial<CheerSettings>) => void;
  isWakeLockSupported: boolean;
  isWakeLocked: boolean;
  onEnterFullscreen: () => void;
  onToggleWakeLock: () => Promise<void>;
}

type Effect = 'static' | 'scroll' | 'flash' | 'neon';
type Speed = 'slow' | 'medium' | 'fast';
type Size = 'S' | 'M' | 'L' | 'XL';
type SizeMode = 'manual' | 'auto';
type DeviceType = 'mobile' | 'tablet';
type ColorId = 'white' | 'black' | 'coral' | 'sun' | 'sky' | 'grape' | 'rose';

const EFFECTS: Effect[] = ['static', 'scroll', 'flash', 'neon'];
const SPEEDS: Speed[] = ['slow', 'medium', 'fast'];
const SIZES: Size[] = ['S', 'M', 'L', 'XL'];
const SIZE_MODES: SizeMode[] = ['manual', 'auto'];
const DEVICE_TYPES: DeviceType[] = ['mobile', 'tablet'];
const COLORS: ColorId[] = ['white', 'black', 'coral', 'sun', 'sky', 'grape', 'rose'];

const COLOR_SWATCHES: Record<ColorId, string> = {
  white: '#ffffff',
  black: '#000000',
  coral: '#fb7185',
  sun: '#f5a623',
  sky: '#3b82f6',
  grape: '#a78bfa',
  rose: '#ec4899',
};

/**
 * Effect, speed, color, size, fullscreen, keep-awake controls.
 */
export function CheerControls({
  settings,
  onSettingsChange,
  isWakeLockSupported,
  isWakeLocked,
  onEnterFullscreen,
  onToggleWakeLock,
}: CheerControlsProps) {
  const t = useTranslations('tools.cheer');

  const lowContrast = isLowContrast(settings.textColor, settings.bgColor);
  const speedDisabled = settings.effect === 'static' || settings.effect === 'neon';

  return (
    <div className="flex flex-col gap-6">
      {/* Effect Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('controls.effectLabel')}
        </label>
        <div className="flex gap-2 flex-wrap">
          {EFFECTS.map((effect) => (
            <button
              key={effect}
              onClick={() => onSettingsChange({ effect })}
              className={`
                px-3 py-1.5 text-sm font-medium rounded
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                transition-colors
                ${
                  settings.effect === effect
                    ? 'bg-brand text-on-brand'
                    : 'bg-surface-muted text-text hover:bg-surface-sunken'
                }
              `}
            >
              {t(`controls.effect.${effect}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Speed Selector */}
      {!speedDisabled && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('controls.speedLabel')}
          </label>
          <div className="flex gap-2 flex-wrap">
            {SPEEDS.map((speed) => (
              <button
                key={speed}
                onClick={() => onSettingsChange({ speed })}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                  transition-colors
                  ${
                    settings.speed === speed
                      ? 'bg-brand text-on-brand'
                      : 'bg-surface-muted text-text hover:bg-surface-sunken'
                  }
                `}
              >
                {t(`controls.speed.${speed}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Color Swatches */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('controls.textColorLabel')}
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onSettingsChange({ textColor: color })}
              className={`
                w-8 h-8 rounded-full border-2
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                transition-all
                ${
                  settings.textColor === color
                    ? 'border-brand ring-2 ring-brand ring-offset-2'
                    : 'border-hairline hover:border-brand'
                }
              `}
              style={{ backgroundColor: COLOR_SWATCHES[color] }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Background Color Swatches */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('controls.bgColorLabel')}
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onSettingsChange({ bgColor: color })}
              className={`
                w-8 h-8 rounded-full border-2
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                transition-all
                ${
                  settings.bgColor === color
                    ? 'border-brand ring-2 ring-brand ring-offset-2'
                    : 'border-hairline hover:border-brand'
                }
              `}
              style={{ backgroundColor: COLOR_SWATCHES[color] }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Low Contrast Warning */}
      {lowContrast && (
        <div className="px-3 py-2 bg-danger/10 text-danger-ink rounded text-sm">
          ⚠️ {t('controls.lowContrastWarning')}
        </div>
      )}

      {/* Size Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('controls.sizeLabel')}
        </label>

        {/* Manual / Auto mode toggle */}
        <div
          role="group"
          aria-label={t('controls.sizeModeLabel')}
          className="flex gap-2 flex-wrap mb-3"
        >
          {SIZE_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={settings.sizeMode === mode}
              onClick={() => onSettingsChange({ sizeMode: mode })}
              className={`
                px-3 py-1.5 text-sm font-medium rounded
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                transition-colors
                ${
                  settings.sizeMode === mode
                    ? 'bg-brand text-on-brand'
                    : 'bg-surface-muted text-text hover:bg-surface-sunken'
                }
              `}
            >
              {t(`controls.sizeMode.${mode}`)}
            </button>
          ))}
        </div>

        {settings.sizeMode === 'manual' ? (
          <div className="flex gap-2 flex-wrap">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onSettingsChange({ size })}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                  transition-colors
                  ${
                    settings.size === size
                      ? 'bg-brand text-on-brand'
                      : 'bg-surface-muted text-text hover:bg-surface-sunken'
                  }
                `}
              >
                {size}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-medium text-text-muted">
              {t('controls.deviceTypeLabel')}
            </label>
            <div
              role="group"
              aria-label={t('controls.deviceTypeLabel')}
              className="flex gap-2 flex-wrap"
            >
              {DEVICE_TYPES.map((deviceType) => (
                <button
                  key={deviceType}
                  type="button"
                  aria-pressed={settings.deviceType === deviceType}
                  onClick={() => onSettingsChange({ deviceType })}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
                    transition-colors
                    ${
                      settings.deviceType === deviceType
                        ? 'bg-brand text-on-brand'
                        : 'bg-surface-muted text-text hover:bg-surface-sunken'
                    }
                  `}
                >
                  {t(`controls.deviceType.${deviceType}`)}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted" aria-live="polite">
              {t('controls.autoSizeHint', { size: resolveEffectiveSize(settings) })}
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Button — immersive overlay works everywhere (incl. iOS) */}
      <button
        onClick={onEnterFullscreen}
        className="
          px-4 py-2 font-medium rounded
          bg-brand text-on-brand
          hover:bg-brand-strong
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
          transition-colors
          flex items-center gap-2 justify-center
        "
      >
        <Maximize2 size={18} />
        {t('controls.fullscreenLabel')}
      </button>

      {/* Keep-awake Toggle */}
      {isWakeLockSupported && (
        <button
          onClick={onToggleWakeLock}
          aria-pressed={isWakeLocked}
          className={`
            px-4 py-2 font-medium rounded
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
            transition-colors
            flex items-center gap-2 justify-center
            ${
              isWakeLocked
                ? 'bg-brand text-on-brand'
                : 'bg-surface-muted text-text hover:bg-surface-sunken'
            }
          `}
        >
          <Zap size={18} />
          {t('controls.keepAwakeLabel')}
        </button>
      )}
    </div>
  );
}
