'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

interface SolarInputProps {
  year: number;
  month: number;
  day: number;
  onChange: (year: number, month: number, day: number) => void;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function SolarInput({ year, month, day, onChange }: SolarInputProps) {
  const t = useTranslations('tools.lunar-converter');

  const years = useMemo(() => {
    const arr = [];
    for (let y = 1391; y <= 2050; y++) {
      arr.push(y);
    }
    return arr;
  }, []);

  const maxDay = useMemo(() => {
    if (!month) return 31;
    let max = MONTH_DAYS[month - 1];
    if (month === 2 && isLeapYear(year)) max = 29;
    return max;
  }, [month, year]);

  const days = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= maxDay; d++) {
      arr.push(d);
    }
    return arr;
  }, [maxDay]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-text">{t('solar.label')}</label>
      <div className="grid grid-cols-3 gap-3">
        {/* Year */}
        <div className="flex flex-col">
          <label htmlFor="solar-year" className="text-xs uppercase font-semibold text-text-secondary mb-2">
            {t('solar.year')}
          </label>
          <select
            id="solar-year"
            value={year || ''}
            onChange={(e) => onChange(parseInt(e.target.value) || 0, month, day)}
            className="px-3 py-2 rounded-lg border border-hairline bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-grape"
            aria-label={t('solar.year')}
          >
            <option value="">{t('solar.year')}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div className="flex flex-col">
          <label htmlFor="solar-month" className="text-xs uppercase font-semibold text-text-secondary mb-2">
            {t('solar.month')}
          </label>
          <select
            id="solar-month"
            value={month || ''}
            onChange={(e) => onChange(year, parseInt(e.target.value) || 0, day)}
            className="px-3 py-2 rounded-lg border border-hairline bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-grape"
            aria-label={t('solar.month')}
          >
            <option value="">{t('solar.month')}</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Day */}
        <div className="flex flex-col">
          <label htmlFor="solar-day" className="text-xs uppercase font-semibold text-text-secondary mb-2">
            {t('solar.day')}
          </label>
          <select
            id="solar-day"
            value={day || ''}
            onChange={(e) => onChange(year, month, parseInt(e.target.value) || 0)}
            className="px-3 py-2 rounded-lg border border-hairline bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-grape"
            aria-label={t('solar.day')}
          >
            <option value="">{t('solar.day')}</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
