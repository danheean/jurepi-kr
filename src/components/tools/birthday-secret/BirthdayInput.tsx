'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DAYS_IN_MONTH, monthSlug, parseMonthDay } from '@/lib/birthday-secret/date';
import { converterUrl } from '@/lib/birthday-secret/external-links';
import type { Locale } from '@/lib/birthday-secret/schema';

interface BirthdayInputProps {
  value: string | null;
  onSelect: (month: number, day: number) => void;
  idPrefix: string;
  showLunarLink?: boolean;
}

const selectClass =
  'min-h-[44px] rounded-xl border border-hairline bg-surface px-4 text-text ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

export function BirthdayInput({ value, onSelect, idPrefix, showLunarLink = false }: BirthdayInputProps) {
  const t = useTranslations('tools.birthday-secret');
  const locale = useLocale() as Locale;

  const parsed = value ? parseMonthDay(value) : null;
  const [month, setMonth] = useState<number | ''>(parsed ? parsed.month : '');
  const [day, setDay] = useState<number | ''>(parsed ? parsed.day : '');

  // Keep local state in sync when the selected value changes externally (URL/recents).
  useEffect(() => {
    const p = value ? parseMonthDay(value) : null;
    setMonth(p ? p.month : '');
    setDay(p ? p.day : '');
  }, [value]);

  const maxDay = typeof month === 'number' ? DAYS_IN_MONTH[month - 1] : 31;

  const commit = (m: number | '', d: number | '') => {
    if (typeof m === 'number' && typeof d === 'number' && d >= 1 && d <= DAYS_IN_MONTH[m - 1]) {
      onSelect(m, d);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <label htmlFor={`${idPrefix}-month`} className="text-sm font-medium text-text-secondary">
            {t('input.monthLabel')}
          </label>
          <select
            id={`${idPrefix}-month`}
            className={selectClass}
            value={month}
            onChange={(e) => {
              const m = e.target.value === '' ? '' : Number(e.target.value);
              setMonth(m);
              // clamp day if it exceeds the new month's length
              let d = day;
              if (typeof m === 'number' && typeof d === 'number' && d > DAYS_IN_MONTH[m - 1]) {
                d = DAYS_IN_MONTH[m - 1];
                setDay(d);
              }
              commit(m, d);
            }}
          >
            <option value="">{t('input.monthUnit')}</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {t(`months.${monthSlug(m)}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <label htmlFor={`${idPrefix}-day`} className="text-sm font-medium text-text-secondary">
            {t('input.dayLabel')}
          </label>
          <select
            id={`${idPrefix}-day`}
            className={selectClass}
            value={day}
            onChange={(e) => {
              const d = e.target.value === '' ? '' : Number(e.target.value);
              setDay(d);
              commit(month, d);
            }}
          >
            <option value="">{t('input.dayUnit')}</option>
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showLunarLink && (
        <p className="text-sm text-text-secondary">
          {t('input.lunarPrompt')}{' '}
          <a
            href={converterUrl(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent-rose-ink underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
          >
            {t('input.lunarLink')}
          </a>
        </p>
      )}
    </div>
  );
}
