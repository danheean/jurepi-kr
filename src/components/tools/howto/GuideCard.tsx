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

const TOPIC_COLORS: Record<string, { bg: string; badge: string }> = {
  setup: { bg: 'bg-accent-sky-soft', badge: 'text-accent-sky' },
  'ai-tools': { bg: 'bg-accent-coral-soft', badge: 'text-accent-coral' },
  git: { bg: 'bg-accent-grape-soft', badge: 'text-accent-grape' },
  api: { bg: 'bg-accent-rose-soft', badge: 'text-accent-rose' },
  cli: { bg: 'bg-accent-sun-soft', badge: 'text-accent-sun' },
  deploy: { bg: 'bg-accent-mint-soft', badge: 'text-accent-mint' },
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

        {/* Meta row */}
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

          {formattedDate && (
            <span className="text-xs text-text-muted">
              {t('card.updated', { date: formattedDate })}
            </span>
          )}
        </div>

        {/* Tags */}
        {guide.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
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
      </Link>

      {/* Favorite button */}
      <button
        onClick={handleStarClick}
        aria-pressed={isFavorite}
        className="absolute top-4 right-4 text-text-muted hover:text-brand transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand rounded"
        aria-label={isFavorite ? t('card.unfavorite') : t('card.favorite')}
        data-testid={`guide-star-${guide.slug}`}
      >
        <Star className={`w-5 h-5 ${isFavorite ? 'fill-brand text-brand' : ''}`} />
      </button>
    </div>
  );
}
