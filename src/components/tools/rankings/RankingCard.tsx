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

  return (
    // Non-interactive container. The whole-card click target is the title
    // button's stretched ::after (relative container + after:inset-0); the
    // favorite button sits above it via z-10. This keeps the two actions as
    // DOM siblings — no interactive element nested inside another.
    <article
      className={`relative p-4 rounded-xl border-2 shadow-card transition-[color,box-shadow,border-color,transform] ${
        isSelected
          ? 'border-accent-rose bg-accent-rose-soft shadow-card-hover'
          : 'border-hairline bg-surface hover:shadow-card-hover hover:border-hairline-strong'
      }`}
    >
      {/* Header: title + field badge */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="leading-tight">
            <button
              type="button"
              onClick={onSelect}
              aria-pressed={isSelected}
              className="text-left font-bold text-lg text-text after:absolute after:inset-0 after:rounded-xl after:content-[''] cursor-pointer"
            >
              {localeData.title}
            </button>
          </h3>
          <span className="inline-block mt-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-accent-rose-ink bg-accent-rose-soft">
            {fieldLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorited}
          aria-label={t('list.toggleFavorite')}
          className="relative z-10 flex-shrink-0 inline-flex items-center justify-center min-h-11 min-w-11 hover:bg-surface-muted rounded-lg transition-colors"
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
        <span className="truncate">{localeData.sourceNote}</span>
      </div>
    </article>
  );
}
