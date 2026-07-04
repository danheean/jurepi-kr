import { useTranslations } from 'next-intl';
import { TAG_VOCABULARY } from '@/lib/dev-people/schema';
import type { Tag } from './useDevPeopleCatalog';

interface TagTabsProps {
  selectedTag: Tag | undefined;
  onSelectTag: (tag: Tag | undefined) => void;
  favCount: number;
  recentCount: number;
}

export function TagTabs({
  selectedTag,
  onSelectTag,
  favCount,
  recentCount,
}: TagTabsProps) {
  const t = useTranslations('tools.dev-people');

  const tabs: Array<{ id: string | undefined; label: string | null }> = [
    { id: undefined, label: t('tabs.all') },
    ...TAG_VOCABULARY.map((tag) => ({
      id: tag as Tag,
      label: t(`tags.${tag}`) || tag,
    })),
    ...(favCount > 0 ? [{ id: '__favorites' as any, label: t('tabs.favorites') }] : []),
    ...(recentCount > 0 ? [{ id: '__recent' as any, label: t('tabs.recent') }] : []),
  ];

  return (
    <div
      role="tablist"
      className="flex flex-wrap gap-2 overflow-x-auto pb-2"
      data-testid="tag-tabs"
    >
      {tabs.map((tab) => {
        // Special handling for favorites/recent tabs
        if (tab.id === '__favorites' || tab.id === '__recent') {
          return null; // Placeholder for future in-hub detail phase
        }

        const isActive = selectedTag === tab.id;
        return (
          <button
            key={String(tab.id)}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectTag(tab.id as Tag | undefined)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                // Implement roving tabindex if needed
              }
            }}
            className={`
              whitespace-nowrap px-3.5 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2
              ${
                isActive
                  ? 'bg-brand text-on-brand'
                  : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
              }
            `}
            data-testid={`tag-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
