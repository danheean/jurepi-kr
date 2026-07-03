import { useTranslations } from 'next-intl';

const CATEGORY_ORDER = [
  'all',
  'cafe',
  'korean',
  'japanese',
  'chinese',
  'brunch',
  'bar',
  'dessert',
  'other',
];

export interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const t = useTranslations('tools.restaurant-map');

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_ORDER.map((category) => {
        const isActive = activeCategory === category;
        const label =
          category === 'all'
            ? t('categories.all')
            : t(`categories.${category}`);

        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand text-on-brand'
                : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
