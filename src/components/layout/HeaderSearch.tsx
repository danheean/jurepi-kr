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
import type { SearchableTool, SearchableSpoke } from '@/lib/tool-search';
import { filterTools, sortTools, filterSpokes } from '@/lib/tool-search';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { accentTileClass, ToolIcon } from '@/components/home/toolStyle';

interface HeaderSearchProps {
  tools: SearchableTool[];
  /** Content entities (glossary terms, rankings, topics, people, guides). */
  spokes?: SearchableSpoke[];
}

/** Combined, order-preserving result item for keyboard navigation. */
type ResultItem =
  | { kind: 'tool'; tool: SearchableTool }
  | { kind: 'spoke'; spoke: SearchableSpoke };

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

export function HeaderSearch({
  tools,
  spokes = [],
}: HeaderSearchProps): React.ReactNode {
  const t = useTranslations();
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const listId = 'header-search-listbox';

  // Tool results (all tools when query is empty) + spoke results (only when
  // querying — dozens of spokes would flood an empty view).
  const toolResults = useMemo(
    () => sortTools(filterTools(tools, { query })),
    [tools, query]
  );
  const spokeResults = useMemo(
    () => filterSpokes(spokes, query),
    [spokes, query]
  );

  // Flat, order-preserving list for keyboard navigation (tools then spokes).
  const combined = useMemo<ResultItem[]>(
    () => [
      ...toolResults.map((tool) => ({ kind: 'tool' as const, tool })),
      ...spokeResults.map((spoke) => ({ kind: 'spoke' as const, spoke })),
    ],
    [toolResults, spokeResults]
  );

  // Group labels only when both sections are present (keep the plain look when
  // only tools show, e.g. the empty-query view).
  const showGroupLabels = toolResults.length > 0 && spokeResults.length > 0;

  const closeAndReset = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(-1);
  }, []);

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
      closeAndReset();
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeAndReset]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeAndReset();
        // Restore focus to trigger button
        const btn = document.querySelector(
          '[data-testid="header-search"]'
        ) as HTMLButtonElement;
        btn?.focus();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((idx) => (idx < combined.length - 1 ? idx + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((idx) => (idx > 0 ? idx - 1 : combined.length - 1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < combined.length) {
          const item = combined[activeIndex];
          const navigable =
            item.kind === 'spoke' || item.tool.status === 'live';
          // Spokes and live tools navigate via their <Link> on click; here we
          // just close the combobox (mirrors tool behavior).
          if (navigable) closeAndReset();
        }
        return;
      }
    },
    [combined, activeIndex, closeAndReset]
  );

  // Toggle open/close from the always-visible magnifier button.
  const handleTriggerClick = () => {
    if (isOpen) {
      closeAndReset();
    } else {
      setIsOpen(true);
    }
  };

  const toolOptionId = (tool: SearchableTool) => `${listId}-item-${tool.id}`;
  const spokeOptionId = (spoke: SearchableSpoke) =>
    `${listId}-item-spoke-${spoke.tool}-${spoke.slug}`;

  // aria-activedescendant for the currently highlighted item.
  const activeDescendant = (() => {
    if (activeIndex < 0 || activeIndex >= combined.length) return '';
    const item = combined[activeIndex];
    return item.kind === 'tool'
      ? toolOptionId(item.tool)
      : spokeOptionId(item.spoke);
  })();

  // Shared row body: accent icon tile + name (highlighted) + optional subtitle/badge.
  function rowBody(
    accent: SearchableTool['accent'],
    icon: string,
    name: string,
    subtitle?: string,
    badge?: React.ReactNode
  ): React.ReactNode {
    const { bg: bgClass, text: textClass } = accentTileClass(accent);
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <div
          className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${bgClass}`}
        >
          <div className={textClass}>
            <ToolIcon name={icon} className="w-4 h-4" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text truncate">
            {highlightMatch(name, query)}
          </div>
          {subtitle && (
            <div className="text-xs text-text-secondary truncate">
              {subtitle}
            </div>
          )}
        </div>
        {badge}
      </div>
    );
  }

  const groupLabelClass =
    'px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary';

  return (
    <div className="relative flex items-center">
      {/* Magnifier trigger — always visible */}
      <IconButton
        icon={<Search className="w-5 h-5" strokeWidth={1.75} />}
        ariaLabel={t('header.searchPlaceholder')}
        onClick={handleTriggerClick}
        size="md"
        variant="ghost"
        testId="header-search"
      />

      {/* Open state: input grows leftward from the magnifier, same row */}
      {isOpen && (
        <div
          ref={wrapperRef}
          className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 w-[180px] sm:w-[240px] max-w-[calc(100vw-2rem)]"
        >
          {/* Input with combobox role */}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeDescendant}
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
              focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2
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
              dropdown-in
            "
          >
            {combined.length === 0 ? (
              <div className="px-4 py-6 text-center text-text-secondary">
                {t('emptyState.heading')}
              </div>
            ) : (
              <>
                {showGroupLabels && (
                  <div className={groupLabelClass} aria-hidden="true">
                    {t('header.search.toolsGroup')}
                  </div>
                )}

                {/* Tool results */}
                {toolResults.map((tool, idx) => {
                  const isActive = idx === activeIndex;
                  const isLive = tool.status === 'live';
                  const body = rowBody(
                    tool.accent,
                    tool.icon,
                    tool.name,
                    undefined,
                    tool.status === 'coming_soon' ? (
                      <Badge variant="soon" className="flex-shrink-0">
                        {t('card.comingSoon')}
                      </Badge>
                    ) : undefined
                  );

                  if (isLive) {
                    return (
                      <Link
                        key={tool.id}
                        href={`/tools/${tool.slug}`}
                        locale={locale}
                        role="option"
                        id={toolOptionId(tool)}
                        aria-selected={isActive}
                        onClick={closeAndReset}
                        className={`block px-3 py-2 cursor-pointer transition-colors duration-150 ${
                          isActive ? 'bg-brand-soft' : 'hover:bg-surface-muted/30'
                        }`}
                      >
                        {body}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={tool.id}
                      role="option"
                      id={toolOptionId(tool)}
                      aria-selected={isActive}
                      aria-disabled="true"
                      className={`block px-3 py-2 opacity-60 transition-colors duration-150 ${
                        isActive ? 'bg-brand-soft' : ''
                      }`}
                    >
                      {body}
                    </div>
                  );
                })}

                {/* Content (spoke) results */}
                {spokeResults.length > 0 && (
                  <>
                    {showGroupLabels && (
                      <div className={groupLabelClass} aria-hidden="true">
                        {t('header.search.contentGroup')}
                      </div>
                    )}
                    {spokeResults.map((spoke, j) => {
                      const idx = toolResults.length + j;
                      const isActive = idx === activeIndex;
                      return (
                        <Link
                          key={`${spoke.tool}-${spoke.slug}`}
                          href={`/tools/${spoke.tool}/${spoke.slug}`}
                          locale={locale}
                          role="option"
                          id={spokeOptionId(spoke)}
                          aria-selected={isActive}
                          onClick={closeAndReset}
                          className={`block px-3 py-2 cursor-pointer transition-colors duration-150 ${
                            isActive
                              ? 'bg-brand-soft'
                              : 'hover:bg-surface-muted/30'
                          }`}
                        >
                          {rowBody(
                            spoke.accent,
                            spoke.icon,
                            spoke.name,
                            spoke.parentToolName
                          )}
                        </Link>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
