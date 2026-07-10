'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import type { MergedGuide } from '@/lib/howto/schema';

interface GuideCardProps {
  guide: MergedGuide;
  isFavorite: boolean;
  onToggleFav: (slug: string) => void;
  currentLocale: 'ko' | 'en';
}

// Badge text uses the *-ink tier (dark, WCAG-AA on the *-soft tint). The bright
// accent (text-accent-*) fails contrast on its own soft background (1.5–2.2:1).
const TOPIC_COLORS: Record<string, { bg: string; badge: string }> = {
  setup: { bg: 'bg-accent-sky-soft', badge: 'text-accent-sky-ink' },
  'ai-tools': { bg: 'bg-accent-coral-soft', badge: 'text-accent-coral-ink' },
  git: { bg: 'bg-accent-grape-soft', badge: 'text-accent-grape-ink' },
  api: { bg: 'bg-accent-rose-soft', badge: 'text-accent-rose-ink' },
  cli: { bg: 'bg-accent-sun-soft', badge: 'text-accent-sun-ink' },
  deploy: { bg: 'bg-accent-mint-soft', badge: 'text-accent-mint-ink' },
};

export function GuideCard({
  guide,
  isFavorite,
  onToggleFav,
  currentLocale,
}: GuideCardProps) {
  const t = useTranslations('tools.howto');
  const locale = useLocale();
  const content = guide[currentLocale];
  const colors = TOPIC_COLORS[guide.topic] || TOPIC_COLORS.setup;

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFav(guide.slug);
  };

  const formattedDate = guide.updated 
    ? new Date(guide.updated).toLocaleDateString(locale === 'ko' ? 'ko' : 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="relative">
      <Link
        href={`/${locale}/tools/howto/${guide.slug}`}
        className={`block p-4 rounded-lg border transition-all cursor-pointer no-underline ${
          'border-hairline bg-surface hover:-translate-y-0.5 hover:shadow-card-hover'
        }`}
        data-testid={`guide-card-${guide.slug}`}
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-text leading-tight">
              {content.title}
            </h3>
          </div>
          <div className="shrink-0 w-6 h-6" />
        </div>

        {/* Summary */}
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {content.summary}
        </p>

        {/* Category signals: topic + difficulty (both pills, one visual tier) */}
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.badge}`}
          >
            {t(`topics.${guide.topic}`)}
          </span>

          {guide.difficulty && (
            <span className="text-xs px-2 py-1 rounded-full bg-surface-muted text-text-muted">
              {t(`difficulty.${guide.difficulty}`)}
            </span>
          )}
        </div>

        {/* Tags */}
        {guide.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {guide.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-surface-muted text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: quiet metadata (lowest tier) */}
        {formattedDate && (
          <p className="text-xs text-text-muted">
            {t('card.updated', { date: formattedDate })}
          </p>
        )}
      </Link>

      {/* Favorite button */}
      <button
        onClick={handleStarClick}
        aria-pressed={isFavorite}
        // p-3 around the 20px icon gives a 44px tap target (WCAG 2.5.5); top/right-1
        // offsets keep the icon visually at the top-4/right-4 corner.
        className="absolute top-1 right-1 p-3 text-text-muted hover:text-brand transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand rounded-full"
        aria-label={isFavorite ? t('card.unfavorite') : t('card.favorite')}
        data-testid={`guide-star-${guide.slug}`}
      >
        <Star className={`w-5 h-5 ${isFavorite ? 'fill-brand text-brand' : ''}`} />
      </button>
    </div>
  );
}
