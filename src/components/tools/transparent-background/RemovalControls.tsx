import { useTranslations } from 'next-intl';
import { FEATHER_MAX_PX } from '@/lib/transparent-background';

interface RemovalControlsProps {
  tolerance: number;
  onToleranceChange: (value: number) => void;
  feather: number;
  onFeatherChange: (value: number) => void;
  mode: 'flood-fill' | 'global';
  onModeChange: (mode: 'flood-fill' | 'global') => void;
}

export function RemovalControls({
  tolerance,
  onToleranceChange,
  feather,
  onFeatherChange,
  mode,
  onModeChange,
}: RemovalControlsProps) {
  const t = useTranslations('tools.transparent-background');

  return (
    <div className="space-y-8">
      {/* Tolerance Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="tolerance-slider" className="text-sm font-medium text-text">
            {t('controls.toleranceLabel')}
          </label>
          <span className="text-sm font-semibold text-accent-sky-ink">
            {t('controls.toleranceValue', { value: tolerance })}
          </span>
        </div>
        <p className="text-xs text-text-secondary">{t('controls.toleranceHelp')}</p>
        <input
          id="tolerance-slider"
          type="range"
          min="0"
          max="100"
          value={tolerance}
          onChange={(e) => onToleranceChange(Number(e.target.value))}
          aria-label={t('controls.toleranceLabel')}
          aria-valuetext={`${tolerance}%`}
          className="w-full cursor-pointer appearance-none rounded-lg bg-accent-sky-soft accent-accent-sky"
        />
      </div>

      {/* Feather Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="feather-slider" className="text-sm font-medium text-text">
            {t('controls.featherLabel')}
          </label>
          <span className="text-sm font-semibold text-accent-sky-ink">
            {t('controls.featherValue', { value: feather })}
          </span>
        </div>
        <p className="text-xs text-text-secondary">{t('controls.featherHelp')}</p>
        <input
          id="feather-slider"
          type="range"
          min="0"
          max={FEATHER_MAX_PX}
          value={feather}
          onChange={(e) => onFeatherChange(Number(e.target.value))}
          aria-label={t('controls.featherLabel')}
          aria-valuetext={`${feather}px`}
          className="w-full cursor-pointer appearance-none rounded-lg bg-accent-sky-soft accent-accent-sky"
        />
      </div>

      {/* Mode Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text">{t('controls.modeLabel')}</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => onModeChange('flood-fill')}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'flood-fill'
                ? 'bg-brand text-on-brand'
                : 'bg-surface-muted text-text hover:bg-hairline-strong'
            }`}
            aria-pressed={mode === 'flood-fill'}
          >
            {t('controls.modeFloodFill')}
          </button>
          <button
            onClick={() => onModeChange('global')}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'global'
                ? 'bg-brand text-on-brand'
                : 'bg-surface-muted text-text hover:bg-hairline-strong'
            }`}
            aria-pressed={mode === 'global'}
          >
            {t('controls.modeGlobal')}
          </button>
        </div>
        <p className="text-xs text-text-secondary">
          {mode === 'flood-fill'
            ? t('controls.modeFloodFillHelp')
            : t('controls.modeGlobalHelp')}
        </p>
      </div>
    </div>
  );
}
