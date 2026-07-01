import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';

interface TermSearchProps {
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
}

export function TermSearch({ query, setQuery, resultCount }: TermSearchProps) {
  const t = useTranslations('tools.new-word');
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focus shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={(e) => {
            // Esc clears the search when non-empty (SPEC keyboard shortcut).
            // stopPropagation so it doesn't also close the detail sheet.
            if (e.key === 'Escape' && query) {
              e.preventDefault();
              e.stopPropagation();
              setQuery('');
            }
          }}
          className="w-full pl-10 pr-10 py-3 border border-hairline rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-mint"
          aria-controls="term-list"
          data-testid="term-search-input"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            aria-label="Clear search"
            data-testid="term-search-clear"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {query && (
        <p aria-live="polite" className="text-xs text-text-muted">
          {t('search.resultCount', { count: resultCount })}
        </p>
      )}
    </div>
  );
}
