'use client';

import { useTranslations } from 'next-intl';

export interface SettingsPanelProps {
  soundOn: boolean;
  removingWinner: boolean;
  volume: number;
  onToggleSound: () => void;
  onToggleRemoveWinner: () => void;
  onVolumeChange: (volume: number) => void;
}

export function SettingsPanel({
  soundOn,
  removingWinner,
  volume,
  onToggleSound,
  onToggleRemoveWinner,
  onVolumeChange,
}: SettingsPanelProps) {
  const t = useTranslations('tools.roulette');

  const handleKeyDown = (e: React.KeyboardEvent, onChange: () => void) => {
    if (e.code === 'Space') {
      e.preventDefault();
      onChange();
    }
  };

  return (
    <div className="space-y-4 p-4 border border-hairline rounded-lg bg-surface-muted">
      {/* Sound toggle */}
      <div className="flex items-center justify-between">
        <label htmlFor="sound-toggle" className="text-sm font-semibold text-text">
          {t('settings.sound')}
        </label>
        <button
          id="sound-toggle"
          data-testid="roulette-sound-toggle"
          onClick={onToggleSound}
          onKeyDown={(e) => handleKeyDown(e, onToggleSound)}
          role="switch"
          aria-checked={soundOn}
          className="relative w-12 h-6 rounded-full bg-border-hairline transition-colors"
          style={{
            backgroundColor: soundOn ? 'var(--accent-rose)' : 'var(--hairline)',
          }}
        >
          <div
            className="absolute top-1 left-1 w-4 h-4 bg-surface rounded-full transition-transform"
            style={{
              transform: soundOn ? 'translateX(24px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      {/* Remove winner toggle */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="remove-winner-toggle"
          className="text-sm font-semibold text-text"
        >
          {t('settings.removeWinner')}
        </label>
        <button
          id="remove-winner-toggle"
          data-testid="roulette-remove-winner-toggle"
          onClick={onToggleRemoveWinner}
          onKeyDown={(e) => handleKeyDown(e, onToggleRemoveWinner)}
          role="switch"
          aria-checked={removingWinner}
          className="relative w-12 h-6 rounded-full bg-border-hairline transition-colors"
          style={{
            backgroundColor: removingWinner ? 'var(--accent-rose)' : 'var(--hairline)',
          }}
        >
          <div
            className="absolute top-1 left-1 w-4 h-4 bg-surface rounded-full transition-transform"
            style={{
              transform: removingWinner ? 'translateX(24px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      {/* Volume slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="volume-slider" className="text-sm font-semibold text-text">
            {t('settings.volume')}
          </label>
          <span className="text-xs text-text-muted">{volume}%</span>
        </div>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="100"
          data-testid="roulette-volume-slider"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full"
          aria-label={t('settings.volume')}
        />
      </div>
    </div>
  );
}
