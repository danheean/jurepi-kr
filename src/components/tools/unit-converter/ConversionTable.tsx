'use client';

import { useTranslations } from 'next-intl';
import { CATEGORIES, convert, formatNumber, type CategoryId } from '@/lib/unit-converter';

interface Props {
  category: CategoryId;
  /**
   * Source unit the table converts FROM (the user's selected "from" unit).
   * Falls back to the category's canonical from-unit when omitted.
   */
  fromUnit?: string;
  /** Value in `fromUnit` to express across every unit; defaults to 1 (reference row). */
  fromValue?: number;
  precision: number;
}

/**
 * ConversionTable: Read-only matrix showing `fromValue fromUnit` expressed in
 * every unit of the active category.
 * Responsive: 4-col (≥1024px) → 2-col (768–1023px) → 1-col (<768px).
 */
export function ConversionTable({ category, fromUnit, fromValue = 1, precision }: Props) {
  const t = useTranslations('tools.unit-converter');
  const catData = CATEGORIES.find((c) => c.id === category);

  if (!catData || catData.units.length === 0) {
    return (
      <div className="text-center text-text-muted py-8">
        {t('table.empty')}
      </div>
    );
  }

  const units = catData.units;
  const sourceUnit = fromUnit ?? catData.canonicalPair.from;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-text">{t('table.heading')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {units.map((unit) => {
          try {
            const result = convert(category, fromValue, sourceUnit, unit.id);
            const formatted = formatNumber(result, precision);

            return (
              <div
                key={unit.id}
                className="p-4 bg-surface border border-hairline rounded-lg"
              >
                <div className="text-xs text-text-muted mb-2">{t(`units.${unit.id}`)}</div>
                <div className="font-semibold text-text">
                  {formatted} <span className="ml-1 text-sm">{unit.symbol}</span>
                </div>
              </div>
            );
          } catch {
            return null;
          }
        })}
      </div>
    </div>
  );
}
