import { Star, Bookmark } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { MergedTopic } from '@/lib/bookmarks/schema';

interface TopicCardProps {
  topic: MergedTopic;
  isFavorited: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  locale: 'ko' | 'en';
}

export function TopicCard({
  topic,
  isFavorited,
  isSelected,
  onSelect,
  onToggleFavorite,
  locale,
}: TopicCardProps) {
  const localeUtil = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.bookmarks');

  const localeData = locale === 'ko' ? topic.ko : topic.en;

  // Count total links across all sections
  const totalLinks = localeData.sections.reduce((sum, section) => sum + section.links.length, 0);
  const sectionCount = localeData.sections.length;

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
        href={`/${locale}/tools/bookmarks/${topic.slug}`}
        onClick={handleCardClick}
        data-testid={`topic-card-${topic.slug}`}
        className={`
          block relative text-left p-4 rounded-xl border-2 shadow-card
          transition-[color,box-shadow,border-color,transform] no-underline cursor-pointer
          ${
            isSelected
              ? 'border-accent-sky-ink bg-accent-sky-soft shadow-card-hover'
              : 'border-hairline bg-surface hover:shadow-card-hover hover:border-hairline-strong'
          }
        `}
        aria-label={`${localeData.title} — ${sectionCount}개 섹션 · ${totalLinks}개 링크`}
      >
        {/* Header: accent icon tile + title */}
        <div className="flex items-start gap-3 mb-3">
          <span
            className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-sky-soft text-accent-sky-ink"
            aria-hidden="true"
          >
            <Bookmark className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="leading-tight font-bold text-lg text-text">
              {localeData.title}
            </h3>
          </div>
          {/* Spacer reserves room for absolutely-positioned star button */}
          <div className="shrink-0 w-11 h-11" />
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-2.5 line-clamp-2">
          {localeData.description}
        </p>

        {/* Section and link count tag */}
        <div className="text-xs text-text-secondary pt-2 border-t border-hairline">
          {t('list.itemCount', {
            sections: sectionCount,
            links: totalLinks,
          })}
        </div>

        {/* Left accent bar when selected */}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-sky-ink rounded-l-xl" />
        )}
      </a>

      {/* Favorite toggle — sibling of the link (never nested in an anchor) */}
      <button
        type="button"
        onClick={handleStarClick}
        aria-pressed={isFavorited}
        aria-label={t('list.toggleFavorite')}
        className="absolute top-4 right-4 text-text-secondary hover:text-accent-sky-ink transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-sky-ink rounded"
        data-testid={`topic-star-${topic.slug}`}
      >
        <Star
          className={`w-5 h-5 ${
            isFavorited
              ? 'fill-accent-sky-ink text-accent-sky-ink'
              : ''
          }`}
        />
      </button>
    </div>
  );
}
