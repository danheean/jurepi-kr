import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { MergedTerm } from '@/lib/new-word/schema';
import { toneEmoji } from '@/lib/new-word/tone';

interface TermCardProps {
  term: MergedTerm;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (slug: string) => void;
  onToggleFav: (slug: string) => void;
  currentLocale: 'ko' | 'en';
}

const TOPIC_COLORS: Record<string, { bg: string; badge: string }> = {
  mz: { bg: 'bg-accent-mint-soft', badge: 'text-accent-mint' },
  tech: { bg: 'bg-accent-sky-soft', badge: 'text-accent-sky' },
};

export function TermCard({
  term,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFav,
  currentLocale,
}: TermCardProps) {
  const t = useTranslations('tools.new-word');
  const locale = useLocale();
  const otherLocale = currentLocale === 'ko' ? 'en' : 'ko';
  const primaryTerm = term[currentLocale].term;
  const secondaryTerm = term[otherLocale].term;
  const definition = term[currentLocale].definition;
  const colors = TOPIC_COLORS[term.topic] || TOPIC_COLORS.mz;
  const emoji = toneEmoji(term.tone);

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFav(term.slug);
  };

  // The card is a real crawlable link to the spoke page (SEO/GEO crawl path),
  // but for JS users a plain left-click opens the in-hub SPA detail panel.
  // Modified clicks (new tab, middle-click) fall through to navigate.
  const handleCardClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    onSelect(term.slug);
  };

  return (
    <div className="relative">
      <a
        href={`/${locale}/tools/new-word/${term.slug}`}
        className={`
          block relative text-left p-4 rounded-lg border transition-all cursor-pointer no-underline
          ${
            isSelected
              ? 'border-accent-mint bg-surface ring-2 ring-accent-mint ring-offset-2'
              : 'border-hairline bg-surface hover:-translate-y-0.5 hover:shadow-card-hover'
          }
        `}
        data-testid={`term-card-${term.slug}`}
        aria-label={`${primaryTerm} — ${term.topic}`}
        tabIndex={0}
        onClick={handleCardClick}
      >
        {/* Header: term name (star button is a sibling outside this link) */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-text leading-tight">
              {emoji && term.tone && (
                <span
                  role="img"
                  aria-label={t(`tone.${term.tone}`)}
                  title={t(`tone.${term.tone}`)}
                  className="mr-1.5"
                  data-testid={`term-tone-${term.slug}`}
                >
                  {emoji}
                </span>
              )}
              {primaryTerm}
            </h3>
            <p className="text-sm text-text-muted">{secondaryTerm}</p>
          </div>
          {/* Spacer reserves room for the absolutely-positioned star button */}
          <div className="shrink-0 w-6 h-6" />
        </div>

        {/* Definition (2-line clamp) */}
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {definition}
        </p>

        {/* Footer: topic badge + tags */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.badge}`}
          >
            {term.topic.toUpperCase()}
          </span>
          {term.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full bg-surface-muted text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Left accent bar when selected */}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-mint rounded-l-lg" />
        )}
      </a>

      {/* Favorite toggle — sibling of the link (never nested in an anchor) */}
      <button
        onClick={handleStarClick}
        aria-pressed={isFavorite}
        className="absolute top-4 right-4 text-text-muted hover:text-brand transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand rounded"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        data-testid={`term-star-${term.slug}`}
      >
        <Star className={`w-5 h-5 ${isFavorite ? 'fill-brand text-brand' : ''}`} />
      </button>
    </div>
  );
}
