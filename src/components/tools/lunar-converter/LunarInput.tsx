'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

interface LunarInputProps {
  year: number;
  month: number;
  day: number;
  isLeap: boolean;
  onChange: (year: number, month: number, day: number, isLeap: boolean) => void;
}

export function LunarInput({ year, month, day, isLeap, onChange }: LunarInputProps) {
  const t = useTranslations('tools.lunar-converter');

  const years = useMemo(() => {
    const arr = [];
    for (let y = 1901; y <= 2050; y++) {
      arr.push(y);
    }
    return arr;
  }, []);

  // Lunar month: 1-12
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Lunar day: 1-30 (some months have 29, but we allow 1-30)
  const days = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= 30; d++) {
      arr.push(d);
    }
    return arr;
  }, []);

  return (
    <fieldset className="space-y-4 min-w-0 border-0 p-0 m-0">
      <legend className="text-sm font-semibold text-text p-0">{t('lunar.label')}</legend>

      <div className="grid grid-cols-3 gap-3">
        {/* Year */}
        <div className="flex flex-col">
          <label htmlFor="lunar-year" className="text-xs uppercase font-semibold text-text-secondary mb-2">
            {t('lunar.year')}
          </label>
          <select
            id="lunar-year"
            value={year || ''}
            onChange={(e) => onChange(parseInt(e.target.value) || 0, month, day, isLeap)}
            className="px-3 py-2 min-h-[44px] rounded-lg border border-hairline bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-grape"
            aria-label={t('lunar.year')}
          >
            <option value="">{t('lunar.year')}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div className="flex flex-col">
          <label htmlFor="lunar-month" className="text-xs uppercase font-semibold text-text-secondary mb-2">
            {t('lunar.month')}
          </label>
          <select
            id="lunar-month"
            value={month || ''}
            onChange={(e) => onChange(year, parseInt(e.target.value) || 0, day, isLeap)}
            className="px-3 py-2 min-h-[44px] rounded-lg border border-hairline bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-grape"
            aria-label={t('lunar.month')}
          >
            <option value="">{t('lunar.month')}</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Day */}
        <div className="flex flex-col">
          <label htmlFor="lunar-day" className="text-xs uppercase font-semibold text-text-secondary mb-2">
            {t('lunar.day')}
          </label>
          <select
            id="lunar-day"
            value={day || ''}
            onChange={(e) => onChange(year, month, parseInt(e.target.value) || 0, isLeap)}
            className="px-3 py-2 min-h-[44px] rounded-lg border border-hairline bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-grape"
            aria-label={t('lunar.day')}
          >
            <option value="">{t('lunar.day')}</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leap month toggle — the whole row is the switch so the tap target is ≥44px */}
      <button
        type="button"
        onClick={() => onChange(year, month, day, !isLeap)}
        role="switch"
        aria-checked={isLeap}
        aria-label={t('lunar.leapMonthLabel')}
        className="flex items-center gap-3 min-h-[44px] rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-grape"
      >
        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isLeap ? 'bg-accent-grape' : 'bg-surface-muted border border-hairline'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-switch-thumb shadow transition-transform ${
              isLeap ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </span>
        <span className="text-sm font-medium text-text">{t('lunar.leapMonthLabel')}</span>
      </button>
    </fieldset>
  );
}
