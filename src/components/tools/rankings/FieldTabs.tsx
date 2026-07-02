import { useTranslations } from 'next-intl';
import { useRef, useEffect } from 'react';

const FIELD_ORDER = ['ai', 'programming', 'tech', 'games', 'movies', 'music'] as const;

interface FieldTabsProps {
  activeField: string;
  setActiveField: (f: string) => void;
  fieldsAvailable: string[];
  favCount: number;
  recentCount: number;
}

export function FieldTabs({
  activeField,
  setActiveField,
  fieldsAvailable,
  favCount,
  recentCount,
}: FieldTabsProps) {
  const t = useTranslations('tools.rankings');
  const tabsRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    const tabs = Array.from(tabsRef.current?.querySelectorAll('[role="tab"]') || []);
    const currentIndex = tabs.findIndex((tab) => (tab as HTMLElement).getAttribute('aria-selected') === 'true');

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = e.key === 'ArrowLeft' ? currentIndex - 1 : currentIndex + 1;
      const nextTab = tabs[Math.max(0, Math.min(nextIndex, tabs.length - 1))] as HTMLElement;
      nextTab?.focus();
      nextTab?.click();
    }
  };

  const allFields = ['all', ...FIELD_ORDER.filter((f) => fieldsAvailable.includes(f))];

  return (
    <div
      ref={tabsRef}
      className="flex gap-2 overflow-x-auto pb-2 -mb-2"
      role="tablist"
    >
      {/* All tab */}
      <button
        role="tab"
        aria-selected={activeField === 'all'}
        onClick={() => setActiveField('all')}
        onKeyDown={(e) => handleKeyDown(e, 'all')}
        className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-colors ${
          activeField === 'all'
            ? 'bg-brand text-on-brand'
            : 'bg-surface-muted text-text-secondary hover:bg-hairline-strong'
        }`}
      >
        {t('tabs.all')}
      </button>

      {/* Field tabs */}
      {FIELD_ORDER.filter((f) => fieldsAvailable.includes(f)).map((field) => (
        <button
          key={field}
          role="tab"
          aria-selected={activeField === field}
          onClick={() => setActiveField(field)}
          onKeyDown={(e) => handleKeyDown(e, field)}
          className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-colors ${
            activeField === field
              ? 'bg-brand text-on-brand'
              : 'bg-surface-muted text-text-secondary hover:bg-hairline-strong'
          }`}
        >
          {t(`fields.${field}`)}
        </button>
      ))}

      {/* Favorites tab */}
      {favCount > 0 && (
        <button
          role="tab"
          aria-selected={activeField === 'favorites'}
          onClick={() => setActiveField('favorites')}
          onKeyDown={(e) => handleKeyDown(e, 'favorites')}
          className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-colors ${
            activeField === 'favorites'
              ? 'bg-brand text-on-brand'
              : 'bg-surface-muted text-text-secondary hover:bg-hairline-strong'
          }`}
        >
          {t('tabs.favorites')}
        </button>
      )}

      {/* Recent tab */}
      {recentCount > 0 && (
        <button
          role="tab"
          aria-selected={activeField === 'recent'}
          onClick={() => setActiveField('recent')}
          onKeyDown={(e) => handleKeyDown(e, 'recent')}
          className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-colors ${
            activeField === 'recent'
              ? 'bg-brand text-on-brand'
              : 'bg-surface-muted text-text-secondary hover:bg-hairline-strong'
          }`}
        >
          {t('tabs.recent')}
        </button>
      )}
    </div>
  );
}
