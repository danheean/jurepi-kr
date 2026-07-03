import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';

interface PeopleSearchProps {
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
}

export function PeopleSearch({ query, setQuery, resultCount }: PeopleSearchProps) {
  const t = useTranslations('tools.dev-people.search');
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && inputRef.current && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={t('label')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('aria')}
          aria-controls="people-list"
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-hairline bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-transparent"
          data-testid="people-search-input"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
            data-testid="people-search-clear"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {query && (
        <p
          aria-live="polite"
          aria-atomic="true"
          className="text-sm text-text-secondary"
          data-testid="people-search-result-count"
        >
          {t('resultCount', { count: resultCount })}
        </p>
      )}
    </div>
  );
}
