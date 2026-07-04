import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';

export interface PlaceSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  resultCount: number;
}

export function PlaceSearch({ query, onQueryChange, resultCount }: PlaceSearchProps) {
  const t = useTranslations('tools.restaurant-map');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full space-y-2">
      <div className="relative flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2">
        <Search className="h-5 w-5 text-text-secondary" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="flex-1 bg-transparent text-text outline-none"
          aria-label={t('search.label')}
          aria-controls="place-list"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="flex items-center justify-center text-text-secondary hover:text-text"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {query && (
        <p className="text-sm text-text-secondary" aria-live="polite">
          {t('search.resultCount', { count: resultCount })}
        </p>
      )}
    </div>
  );
}
