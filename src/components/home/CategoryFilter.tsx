'use client';

import { useTranslations } from 'next-intl';
import type { CategoryOption } from '@/lib/tool-search';

interface CategoryFilterProps {
  categories: CategoryOption[];
  active: CategoryOption['id'];
  onChange: (id: CategoryOption['id']) => void;
}

/**
 * CategoryFilter: horizontal pill row, scroll-snap on mobile.
 * Inactive: surface-muted bg + text-secondary.
 * Active: brand bg + white text.
 * Each pill is a ≥44px button.
 */
export function CategoryFilter({
  categories,
  active,
  onChange,
}: CategoryFilterProps): React.ReactNode {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-container w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 pb-2 px-6 md:px-8 lg:px-12 min-w-max md:min-w-0 md:flex-wrap">
        {categories.map(cat => {
          const isActive = cat.id === active;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              aria-pressed={isActive}
              className={`px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-brand text-on-brand shadow-card font-semibold'
                  : 'bg-surface-muted text-text-secondary hover:bg-hairline font-medium'
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand min-h-11 flex items-center justify-center`}
            >
              {t(cat.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
