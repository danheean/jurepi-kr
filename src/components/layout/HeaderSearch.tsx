'use client';

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Search } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { SearchableTool } from '@/lib/tool-search';
import { filterTools, sortTools, matchTool } from '@/lib/tool-search';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { accentTileClass, ToolIcon } from '@/components/home/toolStyle';

interface HeaderSearchProps {
  tools: SearchableTool[];
}

/**
 * Highlight the matching substring in text.
 * Case-insensitive match, returns array of JSX nodes with <mark> around match.
 */
function highlightMatch(
  text: string,
  query: string
): (string | React.ReactNode)[] {
  if (!query.trim()) return [text];

  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);

  if (idx === -1) return [text];

  return [
    text.slice(0, idx),
    <mark key="match" className="bg-accent-sun-soft/50 font-semibold">
      {text.slice(idx, idx + q.length)}
    </mark>,
    text.slice(idx + q.length),
  ];
}

export function HeaderSearch({ tools }: HeaderSearchProps): React.ReactNode {
  const t = useTranslations();
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const listId = 'header-search-listbox';

  // Filter and sort results
  const results = useMemo(() => {
    return sortTools(filterTools(tools, { query }));
  }, [tools, query]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const trigger = document.querySelector('[data-testid="header-search"]');
      if (
        trigger?.contains(target) ||
        wrapperRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setQuery('');
      setActiveIndex(-1);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
        setActiveIndex(-1);
        // Restore focus to trigger button
        const btn = document.querySelector('[data-testid="header-search"]') as HTMLButtonElement;
        btn?.focus();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((idx) =>
          idx < results.length - 1 ? idx + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((idx) =>
          idx > 0 ? idx - 1 : results.length - 1
        );
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          const tool = results[activeIndex];
          if (tool.status === 'live') {
            // Let the link handle navigation
            // Just close the combobox
            setIsOpen(false);
            setQuery('');
            setActiveIndex(-1);
          }
        }
        return;
      }
    },
    [results, activeIndex]
  );

  // Render active tool option ID for aria-activedescendant
  const activeId =
    activeIndex >= 0 && activeIndex < results.length
      ? `${listId}-item-${results[activeIndex].id}`
      : '';

  return (
    <div className="relative">
      {/* Closed state: trigger button */}
      {!isOpen && (
        <IconButton
          icon={<Search className="w-5 h-5" strokeWidth={1.75} />}
          ariaLabel={t('header.searchPlaceholder')}
          onClick={() => setIsOpen(true)}
          size="md"
          variant="ghost"
          testId="header-search"
        />
      )}

      {/* Open state: input + dropdown panel */}
      {isOpen && (
        <div
          ref={wrapperRef}
          className="absolute top-0 right-0 z-50 w-[280px] max-w-[calc(100vw-1.5rem)]"
        >
          {/* Input with combobox role */}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-label={t('home.searchAria')}
            placeholder={t('header.searchPlaceholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="
              w-full px-3 py-2
              bg-surface border border-hairline rounded-lg
              text-text placeholder:text-text-secondary
              focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2
              text-sm
            "
          />

          {/* Dropdown panel */}
          <div
            ref={panelRef}
            role="listbox"
            id={listId}
            className="
              absolute top-full left-0 right-0 mt-1
              bg-surface border border-hairline rounded-lg
              shadow-card
              max-h-96 overflow-y-auto
              z-50
              animate-in fade-in-0 zoom-in-95
              motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95
            "
          >
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-text-secondary">
                {t('emptyState.heading')}
              </div>
            ) : (
              results.map((tool, idx) => {
                const isActive = idx === activeIndex;
                const isLive = tool.status === 'live';
                const { bg: bgClass, text: textClass } = accentTileClass(
                  tool.accent
                );

                const rowContent = (
                  <div
                    className="
                      flex items-center gap-3 px-3 py-2
                    "
                  >
                    {/* Icon tile */}
                    <div
                      className={`
                        w-8 h-8 rounded flex items-center justify-center
                        flex-shrink-0
                        ${bgClass}
                      `}
                    >
                      <div className={textClass}>
                        <ToolIcon name={tool.icon} className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Tool name and status */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text truncate">
                        {highlightMatch(tool.name, query)}
                      </div>
                    </div>

                    {/* Coming soon badge */}
                    {tool.status === 'coming_soon' && (
                      <Badge variant="soon" className="flex-shrink-0">
                        {t('card.comingSoon')}
                      </Badge>
                    )}
                  </div>
                );

                if (isLive) {
                  return (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      locale={locale}
                      role="option"
                      id={`${listId}-item-${tool.id}`}
                      aria-selected={isActive}
                      className={`
                        block px-3 py-2 cursor-pointer
                        transition-colors duration-150
                        ${
                          isActive
                            ? 'bg-surface-muted/60 border-l-2 border-brand'
                            : 'hover:bg-surface-muted/30'
                        }
                      `}
                    >
                      {rowContent}
                    </Link>
                  );
                }

                // Coming soon: not a link
                return (
                  <div
                    key={tool.id}
                    role="option"
                    id={`${listId}-item-${tool.id}`}
                    aria-selected={isActive}
                    aria-disabled="true"
                    className={`
                      block px-3 py-2 opacity-60
                      transition-colors duration-150
                      ${isActive ? 'bg-surface-muted/60 border-l-2 border-brand' : ''}
                    `}
                  >
                    {rowContent}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
