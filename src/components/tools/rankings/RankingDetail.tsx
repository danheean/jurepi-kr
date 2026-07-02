import { useTranslations, useLocale } from 'next-intl';
import { X } from 'lucide-react';
import type { MergedRanking } from '@/lib/rankings/schema';
import { ProvenanceBanner } from './ProvenanceBanner';
import { RankingTable } from './RankingTable';

interface RankingDetailProps {
  ranking: MergedRanking | null;
  onClose: () => void;
}

export function RankingDetail({ ranking, onClose }: RankingDetailProps) {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.rankings.detail');
  // All hooks MUST run unconditionally (Rules of Hooks) — call before any early return.
  const tRoot = useTranslations('tools.rankings');

  if (!ranking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-center">
        <p className="text-text-secondary">{t('selectHint')}</p>
      </div>
    );
  }

  const localeData = locale === 'ko' ? ranking.ko : ranking.en;
  const fieldLabel = tRoot(`fields.${ranking.field}`);

  return (
    <div className="space-y-5">
      {/* Header: title + close button (mobile) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-text leading-tight">{localeData.title}</h2>
          <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase text-accent-rose-ink bg-accent-rose-soft">
            {fieldLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden inline-flex items-center justify-center min-h-11 min-w-11 hover:bg-surface-muted rounded-lg transition-colors flex-shrink-0"
          aria-label={t('closeAria')}
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Provenance banner — CRITICAL trust surface */}
      <ProvenanceBanner
        asOfDate={ranking.asOfDate}
        sourceNote={localeData.sourceNote}
        sourceUrl={ranking.sourceUrl}
      />

      {/* Semantic table */}
      <RankingTable ranking={ranking} />
    </div>
  );
}
