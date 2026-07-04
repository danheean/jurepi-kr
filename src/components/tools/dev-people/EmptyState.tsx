import { useTranslations } from 'next-intl';

interface EmptyStateProps {
  query: string;
  onClearQuery: () => void;
}

export function EmptyState({ query, onClearQuery }: EmptyStateProps) {
  const t = useTranslations('tools.dev-people.empty');

  if (query) {
    return (
      <div className="text-center py-12" data-testid="empty-state-no-results">
        <p className="text-lg font-semibold text-text mb-4">
          {t('noResults', { query })}
        </p>
        <button
          type="button"
          onClick={onClearQuery}
          className="px-4 py-2 rounded-lg bg-brand text-on-brand font-medium hover:bg-brand-strong transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          Clear search
        </button>
      </div>
    );
  }

  return null;
}
