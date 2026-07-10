'use client';

import { useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Ruler,
  Weight,
  Thermometer,
  Maximize2,
  Container,
  Zap,
  Database,
  Clock,
} from 'lucide-react';
import { CATEGORIES, type CategoryId } from '@/lib/unit-converter';

interface Props {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ size: number }>> = {
  Ruler,
  Weight,
  Thermometer,
  Maximize2,
  Container,
  Zap,
  Database,
  Clock,
};

/**
 * CategoryTabs: 8 horizontal category pills with roving tabindex.
 * ArrowLeft/Right to navigate; Enter/Space to select.
 */
export function CategoryTabs({ active, onChange }: Props) {
  const t = useTranslations('tools.unit-converter');
  const [focusedIndex, setFocusedIndex] = useState(
    CATEGORIES.findIndex((c) => c.id === active)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newIndex = focusedIndex === 0 ? CATEGORIES.length - 1 : focusedIndex - 1;
        setFocusedIndex(newIndex);
        onChange(CATEGORIES[newIndex].id);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newIndex = (focusedIndex + 1) % CATEGORIES.length;
        setFocusedIndex(newIndex);
        onChange(CATEGORIES[newIndex].id);
      }
    },
    [focusedIndex, onChange]
  );

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={t('categoriesLabel')}
      className="flex gap-2 overflow-x-auto pb-2 scroll-smooth"
    >
      {CATEGORIES.map((category, idx) => {
        const Icon = ICON_MAP[category.icon] || Zap;
        const isActive = category.id === active;

        return (
          <button
            key={category.id}
            id={`uc-tab-${category.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls="uc-tabpanel"
            tabIndex={focusedIndex === idx ? 0 : -1}
            onClick={() => {
              setFocusedIndex(idx);
              onChange(category.id);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocusedIndex(idx)}
            className={`
              inline-flex items-center min-h-[44px] px-4 rounded-lg font-medium text-sm whitespace-nowrap
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
              ${
                isActive
                  ? 'bg-brand text-on-brand shadow-sm'
                  : 'bg-surface-muted text-text-secondary hover:bg-hairline'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <Icon size={16} />
              {t(`categories.${category.id}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
