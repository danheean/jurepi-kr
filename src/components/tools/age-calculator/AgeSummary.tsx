'use client';

import { useTranslations } from 'next-intl';
import type { AgeResult } from '@/lib/age-calculator/age';

interface Props {
  age: AgeResult;
}

/**
 * AgeSummary: Displays three age types (만/연/세는) as cards
 * - Desktop: 3 cards side-by-side
 * - Mobile: stacked vertically
 * - Each card has large number + label + unit + explanation
 * - Seeneun card includes the 2023 unification note
 */
export function AgeSummary({ age }: Props) {
  const t = useTranslations('tools.age-calculator');

  const ageCards = [
    {
      type: 'manNai' as const,
      value: age.manNai,
    },
    {
      type: 'yeonNai' as const,
      value: age.yeonNai,
    },
    {
      type: 'seeneunNai' as const,
      value: age.seeneunNai,
    },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-text">{t('ageSummary.title')}</h2>

      {/* Cards grid: 3 cols desktop, 1 col mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ageCards.map(({ type, value }) => (
          <div
            key={type}
            className="bg-surface border border-hairline rounded-lg p-4 transition-[transform,box-shadow] duration-150 hover:shadow-card hover:translate-y-[-2px]"
          >
            {/* Age number */}
            <div className="text-5xl font-bold text-accent-mint-ink mb-2">{value}</div>

            {/* Label + unit */}
            <div className="mb-2">
              <div className="text-sm font-semibold text-text">
                {t(`ageSummary.${type}.label`)}
              </div>
              <div className="text-xs text-text-secondary">
                {t(`ageSummary.${type}.unit`)}
              </div>
            </div>

            {/* Explanation */}
            <p className="text-xs text-text-secondary leading-relaxed">
              {t(`ageSummary.${type}.explanation`)}
            </p>

            {/* Note for seeneunNai card */}
            {type === 'seeneunNai' && (
              <div className="mt-3 pt-3 border-t border-hairline text-xs text-text-secondary">
                {t('ageSummary.note')}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
