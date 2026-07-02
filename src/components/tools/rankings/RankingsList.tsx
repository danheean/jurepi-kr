import { useTranslations } from 'next-intl';
import type { MergedRanking } from '@/lib/rankings/schema';
import { RankingCard } from './RankingCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface RankingsListProps {
  rankings: MergedRanking[];
  selectedSlug: string | null;
  favorites: string[];
  query: string;
  activeField: string;
  onSelect: (slug: string | null) => void;
  onToggleFavorite: (slug: string) => void;
  onClearQuery: () => void;
}

export function RankingsList({
  rankings,
  selectedSlug,
  favorites,
  query,
  activeField,
  onSelect,
  onToggleFavorite,
  onClearQuery,
}: RankingsListProps) {
  const t = useTranslations('tools.rankings.list');

  if (rankings.length === 0) {
    if (query) {
      return (
        <EmptyState
          heading={t('emptyState', { query })}
          body=""
          actionLabel={t('clearSearch')}
          onAction={onClearQuery}
        />
      );
    }
    if (activeField === 'favorites') {
      return (
        <EmptyState
          heading={t('emptyFavorites')}
          body=""
          actionLabel=""
          onAction={() => {}}
        />
      );
    }
    return (
      <EmptyState
        heading={t('noResults')}
        body=""
        actionLabel=""
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {rankings.map((ranking) => (
        <RankingCard
          key={ranking.slug}
          ranking={ranking}
          isFavorited={favorites.includes(ranking.slug)}
          isSelected={selectedSlug === ranking.slug}
          onSelect={() => onSelect(ranking.slug)}
          onToggleFavorite={() => onToggleFavorite(ranking.slug)}
        />
      ))}
    </div>
  );
}
