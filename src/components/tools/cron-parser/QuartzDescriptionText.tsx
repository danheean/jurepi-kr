'use client';

import { useTranslations, useLocale } from 'next-intl';
import { QuartzDescriptionModel, REVERSE_DAY_MAP, REVERSE_MONTH_MAP } from '@/lib/cron-parser';

interface QuartzDescriptionTextProps {
  model: QuartzDescriptionModel;
}

export function QuartzDescriptionText({ model }: QuartzDescriptionTextProps) {
  const t = useTranslations('tools.cron-parser');
  const locale = useLocale();

  const formatTime = (hour: number, minute: number, second: number): string => {
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: locale === 'ko' ? false : true,
    }).format(new Date(2000, 0, 1, hour, minute, second));
  };

  let description = t(`quartzDescriptions.${model.frequencyKind}`);

  // Add atTimes clause
  if (model.atTimes && model.atTimes.length > 0) {
    const times = model.atTimes
      .map((t) => formatTime(t.hour, t.minute, t.second))
      .join(', ');
    description += ` ${t('quartzDescriptions.atTime', { time: times })}`;
  }

  // Add dom (day of month) clause
  if (model.domKind) {
    if (model.domKind === 'specific' && model.domDetail?.dates) {
      const dates = model.domDetail.dates.join(', ');
      description += ` ${t('quartzDescriptions.onDates', { dates })}`;
    } else if (model.domKind === 'lastDay') {
      description += ` ${t('quartzDescriptions.lastDay')}`;
    } else if (model.domKind === 'lastOffset' && model.domDetail?.offset !== undefined) {
      description += ` ${t('quartzDescriptions.lastOffset', { n: model.domDetail.offset })}`;
    } else if (model.domKind === 'lastWeekday') {
      description += ` ${t('quartzDescriptions.lastWeekday')}`;
    } else if (model.domKind === 'nearestWeekday' && model.domDetail?.nearest !== undefined) {
      description += ` ${t('quartzDescriptions.nearestWeekday', { n: model.domDetail.nearest })}`;
    }
    // 'noSpecific' (?) is implied — Quartz always leaves exactly one of dom/dow
    // as '?', so rendering it adds noise without meaning. Skip it.
  }

  // Add dow (day of week) clause
  if (model.dowKind) {
    if (model.dowKind === 'specific' && model.dowDetail?.days) {
      const days = model.dowDetail.days.join(', ');
      description += ` ${t('quartzDescriptions.onDays', { days })}`;
    } else if (model.dowKind === 'last' && model.dowDetail?.last) {
      description += ` ${t('quartzDescriptions.lastDow', { day: model.dowDetail.last })}`;
    } else if (model.dowKind === 'nth' && model.dowDetail?.nth) {
      description += ` ${t('quartzDescriptions.nthDow', { n: model.dowDetail.nth.n, day: model.dowDetail.nth.day })}`;
    }
    // 'noSpecific' (?) is implied — skip (see dom clause above).
  }

  // Add months clause
  if (model.onMonths && model.onMonths.length > 0) {
    const months = model.onMonths.join(', ');
    description += ` ${t('quartzDescriptions.onMonths', { months })}`;
  }

  // Add years clause
  if (model.years && model.years.length > 0) {
    const years = model.years.join(', ');
    description += ` ${t('quartzDescriptions.years', { years })}`;
  }

  return (
    <div className="rounded-lg bg-surface-sunken border border-hairline p-4">
      <p className="text-base font-medium text-text">{description}</p>
    </div>
  );
}
