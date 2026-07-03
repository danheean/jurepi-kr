'use client';

import { useTranslations } from 'next-intl';
import type { DateKey } from '@/lib/age-calculator/date';

interface Props {
  value: string | null;
  asOfDate: string;
  useAsOf: boolean;
  error: string | null;
  onChange: (dateKey: DateKey | null) => void;
  onAsOfDateChange: (dateKey: DateKey) => void;
  onUseAsOfChange: (use: boolean) => void;
  onClearError: () => void;
}

const ERROR_MESSAGE_KEY: Record<string, string> = {
  invalid: 'input.errorInvalidDate',
  future: 'input.errorFutureDate',
  'too-old': 'input.errorTooOld',
};

export function BirthdateInput({
  value,
  asOfDate,
  useAsOf,
  error,
  onChange,
  onAsOfDateChange,
  onUseAsOfChange,
  onClearError,
}: Props) {
  const t = useTranslations('tools.age-calculator');

  const handleBirthdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (!input) {
      onChange(null);
    } else {
      onChange(input as DateKey);
    }
    // Clear error on new input
    if (error) {
      onClearError();
    }
  };

  const handleAsOfDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input) {
      onAsOfDateChange(input as DateKey);
    }
  };

  return (
    <div className="space-y-6">
      {/* Birthdate Input */}
      <fieldset className="space-y-2">
        <legend className="font-semibold text-text text-sm">
          {t('input.birthdateLegend')}
        </legend>
        <div className="space-y-1">
          <input
            type="date"
            value={value || ''}
            onChange={handleBirthdateChange}
            placeholder={t('input.birthdatePlaceholder')}
            className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
              error
                ? 'border-danger/30 bg-danger/5 text-text'
                : 'border-hairline bg-surface text-text focus:border-accent-mint'
            }`}
            aria-label={t('input.birthdateLegend')}
            aria-describedby={error ? 'birthdate-error' : 'birthdate-help'}
          />
          {error ? (
            <div
              id="birthdate-error"
              className="text-danger-ink text-sm"
              role="alert"
              aria-live="polite"
            >
              {t(ERROR_MESSAGE_KEY[error] || 'input.errorInvalidDate')}
            </div>
          ) : (
            <p id="birthdate-help" className="text-text-secondary text-xs">
              {t('input.birthdateHelp')}
            </p>
          )}
        </div>
      </fieldset>

      {/* As-of Date Toggle */}
      <div className="space-y-3">
        <button
          onClick={() => onUseAsOfChange(!useAsOf)}
          className={`inline-flex items-center gap-2 min-h-11 px-3 py-2 rounded-lg border font-medium text-sm transition-colors ${
            useAsOf
              ? 'bg-accent-mint/10 border-accent-mint/30 text-accent-mint-ink'
              : 'bg-surface-muted border-hairline text-text hover:border-text-secondary'
          }`}
          aria-pressed={useAsOf}
          aria-label={t('input.asOfLabel')}
        >
          <input
            type="checkbox"
            checked={useAsOf}
            onChange={(e) => onUseAsOfChange(e.target.checked)}
            className="sr-only"
          />
          <span>{t('input.asOfToggle')}</span>
        </button>

        {/* As-of Date Input (shown when toggle is on) */}
        {useAsOf && (
          <div className="space-y-1 pl-4 border-l border-hairline">
            <label htmlFor="as-of-date" className="font-semibold text-text text-sm">
              {t('input.asOfDate')}
            </label>
            <input
              id="as-of-date"
              type="date"
              value={asOfDate}
              onChange={handleAsOfDateChange}
              placeholder={t('input.asOfPlaceholder')}
              className="w-full px-4 py-2.5 rounded-lg border border-hairline bg-surface text-text transition-colors focus:border-accent-mint"
              aria-label={t('input.asOfDate')}
              aria-describedby="as-of-help"
            />
            <p id="as-of-help" className="text-text-secondary text-xs">
              {t('input.asOfHelp')}
            </p>
          </div>
        )}
      </div>

      {/* Enter Key Hint */}
      <p className="text-xs text-text-secondary">{t('actions.enter')}</p>
    </div>
  );
}
