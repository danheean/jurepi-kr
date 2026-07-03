'use client';

import { useTranslations } from 'next-intl';
import type { DateKey } from '@/lib/age-calculator/date';
import type { CalendarType } from '@/lib/age-calculator/resolve';
import { DateSelect } from './DateSelect';
import { CalendarDateInput, type CalendarDateValue } from './CalendarDateInput';

interface Props {
  value: string | null;
  calendarType: CalendarType;
  isLeapMonth: boolean;
  asOfDate: string;
  useAsOf: boolean;
  error: string | null;
  onBirthdateChange: (v: CalendarDateValue) => void;
  onAsOfDateChange: (dateKey: DateKey) => void;
  onUseAsOfChange: (use: boolean) => void;
  onClearError: () => void;
}

const ERROR_MESSAGE_KEY: Record<string, string> = {
  invalid: 'input.errorInvalidDate',
  future: 'input.errorFutureDate',
  'too-old': 'input.errorTooOld',
  'no-leap': 'input.errorNoLeap',
};

const AS_OF_MIN_YEAR = 1901;

export function BirthdateInput({
  value,
  calendarType,
  isLeapMonth,
  asOfDate,
  useAsOf,
  error,
  onBirthdateChange,
  onAsOfDateChange,
  onUseAsOfChange,
  onClearError,
}: Props) {
  const t = useTranslations('tools.age-calculator');

  return (
    <div className="space-y-6">
      {/* Birthdate — solar/lunar toggle + year/month/day dropdowns + leap switch */}
      <fieldset className="space-y-2">
        <legend className="font-semibold text-text text-sm">{t('input.birthdateLegend')}</legend>
        <CalendarDateInput
          date={value}
          calendarType={calendarType}
          isLeapMonth={isLeapMonth}
          onChange={(v) => {
            onBirthdateChange(v);
            if (error) onClearError();
          }}
          idPrefix="birthdate"
          ariaLabel={t('input.birthdateLegend')}
          invalid={!!error}
        />
        {error && (
          <div id="birthdate-error" className="text-danger-ink text-sm" role="alert" aria-live="polite">
            {t(ERROR_MESSAGE_KEY[error] || 'input.errorInvalidDate')}
          </div>
        )}
      </fieldset>

      {/* As-of Date Toggle (solar only) */}
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

        {useAsOf && (
          <div className="space-y-1 pl-4 border-l border-hairline">
            <span className="block font-semibold text-text text-sm">{t('input.asOfDate')}</span>
            <DateSelect
              value={asOfDate}
              onChange={(dateKey) => {
                if (dateKey) onAsOfDateChange(dateKey);
              }}
              idPrefix="as-of"
              minYear={AS_OF_MIN_YEAR}
              ariaLabel={t('input.asOfDate')}
            />
            <p className="text-text-secondary text-xs">{t('input.asOfHelp')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
