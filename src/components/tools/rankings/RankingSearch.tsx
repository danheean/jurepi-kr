import { useTranslations } from 'next-intl';
import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface RankingSearchProps {
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
}

export function RankingSearch({ query, setQuery, resultCount }: RankingSearchProps) {
  const t = useTranslations('tools.rankings.search');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle "/" focus shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-text-secondary pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          placeholder={t('placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('aria')}
          className="w-full min-h-11 pl-9 pr-11 py-2.5 rounded-lg border border-hairline bg-surface text-text placeholder-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-1 inline-flex items-center justify-center min-h-11 min-w-11 hover:bg-surface-muted rounded-lg transition-colors"
            aria-label={t('clearAria')}
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        )}
      </div>
      {resultCount > 0 && (
        <p className="mt-1.5 text-xs text-text-secondary">
          {t('resultCount', { count: resultCount })}
        </p>
      )}
    </div>
  );
}
