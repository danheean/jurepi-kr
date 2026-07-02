import { useTranslations } from 'next-intl';

const FIELD_ORDER = ['ai', 'programming', 'tech', 'games', 'movies', 'music'] as const;

interface FieldTabsProps {
  activeField: string;
  setActiveField: (f: string) => void;
  fieldsAvailable: string[];
  favCount: number;
  recentCount: number;
}

/**
 * Field filter row. This is a set of mutually-exclusive filter toggles, NOT a
 * tab widget: there is no separate tabpanel to move focus into. Modeling it as
 * `role="tablist"`/`role="tab"` misleads screen readers (they announce "tab, N
 * of M" and look for a tabpanel that doesn't exist). It's a labelled group of
 * toggle buttons carrying `aria-pressed`; Tab moves between them, Space/Enter
 * activates — standard button semantics, no roving tabindex needed.
 */
export function FieldTabs({
  activeField,
  setActiveField,
  fieldsAvailable,
  favCount,
  recentCount,
}: FieldTabsProps) {
  const t = useTranslations('tools.rankings');

  const baseClass =
    'inline-flex items-center min-h-11 px-4 rounded-full whitespace-nowrap font-medium text-sm transition-colors';
  const stateClass = (active: boolean) =>
    active
      ? 'bg-brand text-on-brand'
      : 'bg-surface-muted text-text-secondary hover:bg-hairline-strong';

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 -mb-2"
      role="group"
      aria-label={t('tabs.filterLabel')}
    >
      {/* All */}
      <button
        type="button"
        aria-pressed={activeField === 'all'}
        onClick={() => setActiveField('all')}
        className={`${baseClass} ${stateClass(activeField === 'all')}`}
      >
        {t('tabs.all')}
      </button>

      {/* Field filters */}
      {FIELD_ORDER.filter((f) => fieldsAvailable.includes(f)).map((field) => (
        <button
          key={field}
          type="button"
          aria-pressed={activeField === field}
          onClick={() => setActiveField(field)}
          className={`${baseClass} ${stateClass(activeField === field)}`}
        >
          {t(`fields.${field}`)}
        </button>
      ))}

      {/* Favorites */}
      {favCount > 0 && (
        <button
          type="button"
          aria-pressed={activeField === 'favorites'}
          onClick={() => setActiveField('favorites')}
          className={`${baseClass} ${stateClass(activeField === 'favorites')}`}
        >
          {t('tabs.favorites')}
        </button>
      )}

      {/* Recent */}
      {recentCount > 0 && (
        <button
          type="button"
          aria-pressed={activeField === 'recent'}
          onClick={() => setActiveField('recent')}
          className={`${baseClass} ${stateClass(activeField === 'recent')}`}
        >
          {t('tabs.recent')}
        </button>
      )}
    </div>
  );
}
