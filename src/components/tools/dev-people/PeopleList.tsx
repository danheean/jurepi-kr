import { useTranslations } from 'next-intl';
import type { MergedPerson } from '@/lib/dev-people/schema';
import { PersonCard } from './PersonCard';
import { EmptyState } from './EmptyState';

interface PeopleListProps {
  people: MergedPerson[];
  favorites: string[];
  query: string;
  onToggleFavorite: (slug: string) => void;
  onClearQuery: () => void;
  locale: 'ko' | 'en';
}

export function PeopleList({
  people,
  favorites,
  query,
  onToggleFavorite,
  onClearQuery,
  locale,
}: PeopleListProps) {
  const t = useTranslations('tools.dev-people');

  if (people.length === 0) {
    return (
      <EmptyState
        query={query}
        onClearQuery={onClearQuery}
      />
    );
  }

  return (
    <div
      id="people-list"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="people-list"
    >
      {people.map((person) => (
        <PersonCard
          key={person.slug}
          person={person}
          isFavorited={favorites.includes(person.slug)}
          onToggleFavorite={() => onToggleFavorite(person.slug)}
          locale={locale}
        />
      ))}
    </div>
  );
}
