'use client';

import { useTranslations, useLocale } from 'next-intl';
import { DescriptionModel, DAY_NAMES, MONTH_NAMES } from '@/lib/cron-parser';

interface DescriptionTextProps {
  model: DescriptionModel;
}

export function DescriptionText({ model }: DescriptionTextProps) {
  const t = useTranslations('tools.cron-parser');
  const locale = useLocale();

  const formatTime = (hour: number, minute: number): string => {
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale === 'ko' ? false : true,
    }).format(new Date(2000, 0, 1, hour, minute));
  };

  const getDayName = (index: number): string => DAY_NAMES[index];
  const getMonthName = (index: number): string => MONTH_NAMES[index - 1];

  let description = t(`descriptions.${model.frequencyKind}`);

  // Add time info
  if (model.atTimes && model.atTimes.length > 0) {
    const timesStr = model.atTimes
      .map((t) => formatTime(t.hour, t.minute))
      .join(', ');
    description += ` ${t('descriptions.atTime', { time: timesStr })}`;
  }

  // Add day info
  if (model.onDays && model.onDays.length > 0) {
    const daysStr = model.onDays.map((d) => getDayName(parseInt(d) || 0)).join(', ');
    description += ` ${t('descriptions.onDays', { days: daysStr })}`;
  }

  // Add month info
  if (model.onMonths && model.onMonths.length > 0) {
    const monthsStr = model.onMonths.map((m) => getMonthName(parseInt(m) || 1)).join(', ');
    description += ` ${t('descriptions.onMonths', { months: monthsStr })}`;
  }

  return (
    <div className="rounded-lg bg-surface-sunken border border-hairline p-4">
      <p className="text-base font-medium text-text">{description}</p>
    </div>
  );
}
