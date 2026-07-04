'use client';

import { useTranslations } from 'next-intl';
import { limitStatus, getPresetLimit, createCustomLimit, TWITTER_LIMIT, META_DESCRIPTION_LIMIT } from '@/lib/character-counter';
import type { PresetLimit } from '@/lib/character-counter';

interface LimitIndicatorProps {
  limit: PresetLimit | null;
  currentCount: number;
  customInput: string;
  onLimitChange: (limit: PresetLimit | null) => void;
  onCustomInputChange: (input: string) => void;
}

/**
 * Limit indicator with preset buttons, custom input, and 3-state progress bar.
 * Color: green (≤80%), yellow (80-100%), red (>100%).
 */
export function LimitIndicator({
  limit,
  currentCount,
  customInput,
  onLimitChange,
  onCustomInputChange,
}: LimitIndicatorProps) {
  const t = useTranslations('tools.character-counter');

  const handlePresetClick = (presetId: 'twitter' | 'meta_description' | 'none') => {
    onLimitChange(getPresetLimit(presetId));
  };

  const handleCustomClick = () => {
    // Set custom with null limit initially (user will type)
    onLimitChange(createCustomLimit(null));
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomInputChange(e.target.value);
  };

  const status = limitStatus(currentCount, limit?.limit);

  const progressFill =
    limit?.limit ? Math.min((currentCount / limit.limit) * 100, 100) : 0;

  // Determine bar color and text color based on status
  const barColorClass =
    status === 'over'
      ? 'bg-danger'
      : status === 'near'
        ? 'bg-warning'
        : 'bg-accent-mint-ink';

  const textColorClass =
    status === 'over'
      ? 'text-danger-ink'
      : status === 'near'
        ? 'text-warning-ink'
        : 'text-text-secondary';

  const statusText =
    status === 'over'
      ? t('limit.progress.status.over', {
          current: currentCount,
          limit: limit?.limit || 0,
        })
      : status === 'near'
        ? t('limit.progress.status.near', {
            current: currentCount,
            limit: limit?.limit || 0,
          })
        : t('limit.progress.status.under', {
            current: currentCount,
            limit: limit?.limit || 0,
          });

  return (
    <div className="space-y-4">
      {/* Label */}
      <div className="text-xs tracking-wide font-semibold text-text-secondary">
        {t('limit.label')}
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handlePresetClick('twitter')}
          className={`px-3 py-2 min-h-11 rounded-lg text-sm font-medium transition-colors ${
            limit?.id === 'twitter'
              ? 'bg-brand text-on-brand'
              : 'bg-surface-muted text-text hover:bg-surface-sunken'
          }`}
          aria-label={t('limit.preset.twitter')}
        >
          {t('limit.preset.twitter')}
        </button>

        <button
          onClick={() => handlePresetClick('meta_description')}
          className={`px-3 py-2 min-h-11 rounded-lg text-sm font-medium transition-colors ${
            limit?.id === 'meta_description'
              ? 'bg-brand text-on-brand'
              : 'bg-surface-muted text-text hover:bg-surface-sunken'
          }`}
          aria-label={t('limit.preset.meta')}
        >
          {t('limit.preset.meta')}
        </button>

        <button
          onClick={handleCustomClick}
          className={`px-3 py-2 min-h-11 rounded-lg text-sm font-medium transition-colors ${
            limit?.id === 'custom'
              ? 'bg-brand text-on-brand'
              : 'bg-surface-muted text-text hover:bg-surface-sunken'
          }`}
          aria-label={t('limit.preset.custom')}
        >
          {t('limit.preset.custom')}
        </button>

        <button
          onClick={() => handlePresetClick('none')}
          className={`px-3 py-2 min-h-11 rounded-lg text-sm font-medium transition-colors ${
            limit?.id === 'none'
              ? 'bg-brand text-on-brand'
              : 'bg-surface-muted text-text hover:bg-surface-sunken'
          }`}
          aria-label={t('limit.preset.none')}
        >
          {t('limit.preset.none')}
        </button>
      </div>

      {/* Custom input (shown when custom is selected) */}
      {limit?.id === 'custom' && (
        <input
          type="number"
          value={customInput}
          onChange={handleCustomInputChange}
          placeholder={t('limit.customInput.placeholder')}
          className="w-full px-3 py-2 min-h-11 rounded-lg border border-hairline bg-surface text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
          aria-label={t('limit.customInput.ariaLabel')}
        />
      )}

      {/* Progress bar (only show if limit is set) */}
      {limit && limit.id !== 'none' && limit.limit !== null && (
        <div className="space-y-2">
          <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${barColorClass} transition-[width] duration-200`}
              style={{ width: `${progressFill}%` }}
              role="progressbar"
              aria-valuenow={currentCount}
              aria-valuemin={0}
              aria-valuemax={limit.limit}
              aria-label={t('limit.progress.ariaLabel')}
            />
          </div>
          <div className={`text-sm font-medium ${textColorClass}`} aria-live="polite">
            {statusText}
          </div>
        </div>
      )}
    </div>
  );
}
