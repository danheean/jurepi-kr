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
  /**
   * Category values present in the catalog. When provided, only these (plus
   * 'all') are rendered — a hardcoded full list exposes dead filters whose
   * empty result reads as an error (e.g. '기타' with zero places).
   */
  availableCategories?: string[];
}

export function CategoryFilter({
  activeCategory,
  onCategoryChange,
  availableCategories,
}: CategoryFilterProps) {
  const t = useTranslations('tools.restaurant-map');

  const visibleCategories = CATEGORY_ORDER.filter(
    (category) =>
      category === 'all' || !availableCategories || availableCategories.includes(category)
  );

  return (
    <div className="flex flex-wrap gap-2">
      {visibleCategories.map((category) => {
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
