import { Star, Calendar } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { MergedRanking } from '@/lib/rankings/schema';

interface RankingCardProps {
  ranking: MergedRanking;
  isFavorited: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

export function RankingCard({
  ranking,
  isFavorited,
  isSelected,
  onSelect,
  onToggleFavorite,
}: RankingCardProps) {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.rankings');

  const localeData = locale === 'ko' ? ranking.ko : ranking.en;
  const fieldLabel = t(`fields.${ranking.field}`);

  // Card is a real crawlable link to the spoke page (SEO/GEO crawl path),
  // but for JS users a plain left-click opens the in-hub SPA detail panel.
  // Modified clicks (new tab, middle-click) fall through to navigate.
  const handleCardClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    onSelect();
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite();
  };

  return (
    <div className="relative">
      <a
        href={`/${locale}/tools/rankings/${ranking.slug}`}
        onClick={handleCardClick}
        data-testid={`ranking-card-${ranking.slug}`}
        className={`
          block relative text-left p-4 rounded-xl border-2 shadow-card
          transition-[color,box-shadow,border-color,transform] no-underline cursor-pointer
          ${
            isSelected
              ? 'border-accent-rose bg-accent-rose-soft shadow-card-hover'
              : 'border-hairline bg-surface hover:shadow-card-hover hover:border-hairline-strong'
          }
        `}
        aria-label={`${localeData.title} — ${fieldLabel}`}
      >
        {/* Header: title + field badge */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="leading-tight font-bold text-lg text-text">
              {localeData.title}
            </h3>
            <span className="inline-block mt-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-accent-rose-ink bg-accent-rose-soft">
              {fieldLabel}
            </span>
          </div>
          {/* Spacer reserves room for absolutely-positioned star button */}
          <div className="shrink-0 w-11 h-11" />
        </div>

        {/* Item count */}
        <p className="text-sm text-text-secondary mb-2.5">
          {t('list.itemCount', { count: localeData.items.length })}
        </p>

        {/* Provenance: date + source (compact) */}
        <div className="flex items-center gap-2 text-xs text-text-secondary pt-2 border-t border-hairline">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <time dateTime={ranking.asOfDate} className="font-medium">
            {ranking.asOfDate}
          </time>
          <span className="text-hairline-strong">·</span>
          <span className="truncate">{localeData.sourceNote}</span>
        </div>

        {/* Left accent bar when selected */}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-rose rounded-l-xl" />
        )}
      </a>

      {/* Favorite toggle — sibling of the link (never nested in an anchor) */}
      <button
        type="button"
        onClick={handleStarClick}
        aria-pressed={isFavorited}
        aria-label={t('list.toggleFavorite')}
        className="absolute top-4 right-4 text-text-secondary hover:text-accent-sun transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-sun rounded"
        data-testid={`ranking-star-${ranking.slug}`}
      >
        <Star
          className={`w-5 h-5 ${
            isFavorited
              ? 'fill-accent-sun text-accent-sun'
              : ''
          }`}
        />
      </button>
    </div>
  );
}
