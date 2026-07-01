import { Star } from 'lucide-react';
import { MergedTerm } from '@/lib/new-word/schema';

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
  const otherLocale = currentLocale === 'ko' ? 'en' : 'ko';
  const primaryTerm = term[currentLocale].term;
  const secondaryTerm = term[otherLocale].term;
  const definition = term[currentLocale].definition;
  const colors = TOPIC_COLORS[term.topic] || TOPIC_COLORS.mz;

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFav(term.slug);
  };

  return (
    <div
      role="button"
      onClick={() => onSelect(term.slug)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(term.slug);
        }
      }}
      tabIndex={0}
      className={`
        text-left p-4 rounded-lg border transition-all cursor-pointer
        ${
          isSelected
            ? 'border-accent-mint bg-surface ring-2 ring-accent-mint ring-offset-2'
            : 'border-hairline bg-surface hover:-translate-y-0.5 hover:shadow-card-hover'
        }
      `}
      data-testid={`term-card-${term.slug}`}
      aria-label={`${primaryTerm} — ${term.topic}`}
    >
      {/* Header: term name + star */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-text leading-tight">{primaryTerm}</h3>
          <p className="text-sm text-text-muted">{secondaryTerm}</p>
        </div>
        <button
          onClick={handleStarClick}
          aria-pressed={isFavorite}
          className="shrink-0 text-text-muted hover:text-brand transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand rounded"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          data-testid={`term-star-${term.slug}`}
        >
          <Star className={`w-5 h-5 ${isFavorite ? 'fill-brand text-brand' : ''}`} />
        </button>
      </div>

      {/* Definition (2-line clamp) */}
      <p className="text-sm text-text-secondary line-clamp-2 mb-3">{definition}</p>

      {/* Footer: topic badge + tags */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.badge}`}
        >
          {term.topic.toUpperCase()}
        </span>
        {term.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs px-2 py-1 rounded-full bg-surface-muted text-text-muted">
            {tag}
          </span>
        ))}
      </div>

      {/* Left accent bar when selected */}
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-mint rounded-l-lg" />}
    </div>
  );
}
