'use client';

import { useTranslations, useLocale } from 'next-intl';
import { DescriptionModel } from '@/lib/cron-parser';

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

  // English ordinal suffix (1st, 2nd, 3rd, 4th…). Korean uses none.
  const ordinalSuffix = (n: number): string => {
    if (locale === 'ko') return '';
    const rem100 = n % 100;
    if (rem100 >= 11 && rem100 <= 13) return 'th';
    switch (n % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const dates = model.onDatesOfMonth ?? [];
  const dayStr = dates.join(', ');
  // An ordinal only reads right for a single date ("the 1st"); a list drops it.
  const daySuffix = dates.length === 1 ? ordinalSuffix(dates[0]) : '';

  // Base frequency clause. monthly / yearly / everyNMinutes carry ICU
  // placeholders that MUST be filled, or the raw "{day}" reaches the user.
  let description: string;
  if (model.frequencyKind === 'everyNMinutes') {
    description = t('descriptions.everyNMinutes', { n: model.intervalMinutes ?? 0 });
  } else if (model.frequencyKind === 'monthly') {
    description = t('descriptions.monthly', { day: dayStr, suffix: daySuffix });
  } else if (model.frequencyKind === 'yearly') {
    const monthStr = (model.onMonths ?? []).join(', ');
    description = t('descriptions.yearly', { month: monthStr, day: dayStr, suffix: daySuffix });
  } else {
    description = t(`descriptions.${model.frequencyKind}`);
  }

  // Time clause.
  if (model.atTimes && model.atTimes.length > 0) {
    const timesStr = model.atTimes.map((at) => formatTime(at.hour, at.minute)).join(', ');
    description += ` ${t('descriptions.atTime', { time: timesStr })}`;
  }

  // Day-of-week clause. Names are already resolved (e.g. "MON") — render as-is.
  if (model.onDays && model.onDays.length > 0) {
    description += ` ${t('descriptions.onDays', { days: model.onDays.join(', ') })}`;
  }

  // Month clause. Skip for 'yearly' — its month is already in the base template.
  if (
    model.frequencyKind !== 'yearly' &&
    model.onMonths &&
    model.onMonths.length > 0
  ) {
    description += ` ${t('descriptions.onMonths', { months: model.onMonths.join(', ') })}`;
  }

  return (
    <div className="rounded-lg bg-surface-sunken border border-hairline p-4">
      <p className="text-base font-medium text-text">{description}</p>
    </div>
  );
}
