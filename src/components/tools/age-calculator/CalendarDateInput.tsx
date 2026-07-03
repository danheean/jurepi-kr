'use client';

import { useTranslations } from 'next-intl';
import { DateSelect } from './DateSelect';
import type { DateKey } from '@/lib/age-calculator/date';
import type { CalendarType } from '@/lib/age-calculator/resolve';

/** Lunar library (korean-lunar-calendar) supports 1901–2050; birthdates cap at today. */
const MIN_YEAR = 1901;

export interface CalendarDateValue {
  date: DateKey | null;
  calendarType: CalendarType;
  isLeapMonth: boolean;
}

interface Props extends CalendarDateValue {
  onChange: (next: CalendarDateValue) => void;
  idPrefix: string;
  invalid?: boolean;
  ariaLabel?: string;
}

/**
 * Birthdate input for the Age Calculator: a 양력/음력 (solar/lunar) segmented
 * toggle + year/month/day dropdowns (DateSelect) + a 윤달 (leap month) switch
 * that appears only for lunar. Reused by both the main input and the add-person
 * form. Lunar↔solar conversion happens downstream (useAgeLookup → resolveBirthdate).
 */
export function CalendarDateInput({
  date,
  calendarType,
  isLeapMonth,
  onChange,
  idPrefix,
  invalid,
  ariaLabel,
}: Props) {
  const t = useTranslations('tools.age-calculator');

  const setType = (ct: CalendarType) =>
    onChange({ date, calendarType: ct, isLeapMonth: ct === 'solar' ? false : isLeapMonth });
  const setDate = (d: DateKey | null) => onChange({ date: d, calendarType, isLeapMonth });
  const setLeap = (leap: boolean) => onChange({ date, calendarType, isLeapMonth: leap });

  return (
    <div className="space-y-3">
      {/* 양력 / 음력 segmented toggle */}
      <div
        role="group"
        aria-label={t('input.calendarTypeLabel')}
        className="inline-flex gap-0.5 rounded-lg border border-hairline bg-surface-muted p-0.5 text-sm"
      >
        {(['solar', 'lunar'] as const).map((ct) => (
          <button
            key={ct}
            type="button"
            aria-pressed={calendarType === ct}
            onClick={() => setType(ct)}
            className={`min-h-9 rounded-md px-4 py-1.5 font-medium transition-colors ${
              calendarType === ct
                ? 'bg-surface text-text shadow-card'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {t(ct === 'solar' ? 'input.calendarSolar' : 'input.calendarLunar')}
          </button>
        ))}
      </div>

      <DateSelect
        value={date}
        onChange={setDate}
        idPrefix={idPrefix}
        minYear={MIN_YEAR}
        invalid={invalid}
        ariaLabel={ariaLabel}
      />

      {/* 윤달 (leap month) switch — only meaningful for lunar dates */}
      {calendarType === 'lunar' && (
        <button
          type="button"
          role="switch"
          aria-checked={isLeapMonth}
          onClick={() => setLeap(!isLeapMonth)}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-text"
        >
          <span
            className={`relative inline-block h-5 w-9 rounded-full transition-colors ${
              isLeapMonth ? 'bg-brand' : 'bg-hairline-strong'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-surface transition-transform ${
                isLeapMonth ? 'translate-x-4' : ''
              }`}
            />
          </span>
          <span>{t('input.leapMonth')}</span>
        </button>
      )}
    </div>
  );
}
