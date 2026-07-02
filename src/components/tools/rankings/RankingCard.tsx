import { useTranslations, useLocale } from 'next-intl';
import { Star, Calendar } from 'lucide-react';
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      onToggleFavorite();
    }
  };

  return (
    <div
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-accent-rose bg-accent-rose-soft shadow-md'
          : 'border-hairline bg-surface hover:shadow-card hover:border-hairline-strong'
      }`}
      aria-pressed={isSelected}
    >
      {/* Header: title + field badge */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-text leading-tight">{localeData.title}</h3>
          <span className="inline-block mt-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase text-accent-rose bg-accent-rose-soft">
            {fieldLabel}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-pressed={isFavorited}
          aria-label={t('list.toggleFavorite')}
          className="flex-shrink-0 p-1.5 hover:bg-surface-muted rounded-lg transition-colors"
        >
          <Star
            className={`w-5 h-5 ${
              isFavorited
                ? 'fill-accent-sun text-accent-sun'
                : 'text-text-secondary hover:text-accent-sun'
            }`}
          />
        </button>
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
        <span className="truncate">{ranking.sourceNote}</span>
      </div>
    </div>
  );
}
