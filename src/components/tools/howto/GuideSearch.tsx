'use client';

import { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';

interface GuideSearchProps {
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
}

export function GuideSearch({ query, setQuery, resultCount }: GuideSearchProps) {
  const t = useTranslations('tools.howto');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && query) {
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [query, setQuery]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-2 border border-hairline rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand"
          aria-label={t('search.label')}
          role="searchbox"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-muted rounded transition-colors"
            aria-label={t('search.clear')}
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        )}
      </div>
      <div className="text-sm text-text-muted" aria-live="polite">
        {t('search.resultCount', { count: resultCount })}
      </div>
    </div>
  );
}
