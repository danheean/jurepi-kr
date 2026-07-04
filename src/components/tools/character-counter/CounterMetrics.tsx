'use client';

import { useTranslations } from 'next-intl';
import type { CharacterCounterMetrics } from '@/lib/character-counter';

interface CounterMetricsProps {
  metrics: CharacterCounterMetrics;
}

/**
 * Displays 9 key metrics in a 2-col grid card.
 * "Characters (with spaces)" is largest/bold, others follow.
 */
export function CounterMetrics({ metrics }: CounterMetricsProps) {
  const t = useTranslations('tools.character-counter');

  const metricsList = [
    {
      key: 'charactersWithSpaces',
      label: t('metrics.label.charactersWithSpaces'),
      value: metrics.charactersWithSpaces,
      unit: '',
      isPrimary: true,
    },
    {
      key: 'charactersWithoutSpaces',
      label: t('metrics.label.charactersWithoutSpaces'),
      value: metrics.charactersWithoutSpaces,
      unit: '',
    },
    {
      key: 'words',
      label: t('metrics.label.words'),
      value: metrics.words,
      unit: '',
    },
    {
      key: 'sentences',
      label: t('metrics.label.sentences'),
      value: metrics.sentences,
      unit: '',
    },
    {
      key: 'paragraphs',
      label: t('metrics.label.paragraphs'),
      value: metrics.paragraphs,
      unit: '',
    },
    {
      key: 'lines',
      label: t('metrics.label.lines'),
      value: metrics.lines,
      unit: '',
    },
    {
      key: 'byteSize',
      label: t('metrics.label.byteSize'),
      value: metrics.byteSize,
      unit: '',
    },
    {
      key: 'readingTime',
      label: t('metrics.label.readingTime'),
      value: metrics.readingTimeMinutes,
      unit: t('metrics.unit.minutes'),
    },
    {
      key: 'speakingTime',
      label: t('metrics.label.speakingTime'),
      value: metrics.speakingTimeMinutes,
      unit: t('metrics.unit.minutes'),
    },
  ];

  return (
    <div className="bg-surface rounded-xl border border-hairline p-5 shadow-card">
      <div className="grid grid-cols-2 gap-6">
        {metricsList.map((metric) => (
          <div
            key={metric.key}
            className={metric.isPrimary ? 'col-span-2' : ''}
          >
            <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">
              {metric.label}
            </div>
            <div className={metric.isPrimary ? 'text-4xl font-bold text-text' : 'text-lg font-semibold text-text'}>
              {metric.value}
              {metric.unit && <span className="ml-1 text-xs font-normal text-text-secondary">{metric.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
