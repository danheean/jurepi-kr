import { useTranslations } from 'next-intl';
import type { MergedRanking } from '@/lib/rankings/schema';
import { ProvenanceBanner } from './ProvenanceBanner';
import { RankingTable } from './RankingTable';

interface RankingsSpokeProps {
  ranking: MergedRanking;
  locale: 'ko' | 'en';
}

// Synchronous, isomorphic `useTranslations` (not async `getTranslations`) so this
// SSR section renders in vitest too — matches NewWordSpoke and the jurepi-tdd rule.
export function RankingsSpoke({ ranking, locale }: RankingsSpokeProps) {
  const t = useTranslations('tools.rankings');
  const localeData = ranking[locale];

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <nav
        aria-label="Breadcrumb"
        data-testid="rankings-spoke-breadcrumb"
        className="flex items-center gap-2 text-sm"
      >
        <a
          href={`/${locale}`}
          className="text-text-secondary hover:text-text transition-colors"
        >
          {t('spoke.breadcrumbHome')}
        </a>
        <span className="text-text-muted">›</span>
        <a
          href={`/${locale}/tools/rankings`}
          className="text-text-secondary hover:text-text transition-colors"
        >
          {t('intro.title')}
        </a>
        <span className="text-text-muted">›</span>
        <span className="text-text">{localeData.title}</span>
      </nav>

      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-text leading-tight">
          {localeData.title}
        </h1>
      </div>

      {/* Provenance banner — trust surface */}
      <ProvenanceBanner
        asOfDate={ranking.asOfDate}
        sourceNote={localeData.sourceNote}
        sourceUrl={ranking.sourceUrl}
      />

      {/* Full ranking table — SSR'd outside any mounted gate */}
      <RankingTable ranking={ranking} />

      {/* Back to hub link */}
      <div className="pt-4 border-t border-hairline">
        <a
          href={`/${locale}/tools/rankings`}
          data-testid="rankings-spoke-back-to-hub"
          className="inline-flex items-center text-text-secondary hover:text-text transition-colors font-medium no-underline"
        >
          {t('spoke.backToHub')}
        </a>
      </div>
    </div>
  );
}
