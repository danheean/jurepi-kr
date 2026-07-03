import { useTranslations } from 'next-intl';
import type { Era } from './useDevPeopleCatalog';

interface EraTabsProps {
  selectedEra: Era | undefined;
  onSelectEra: (era: Era | undefined) => void;
}

const ERAS: Array<{ id: Era; }> = [
  { id: '1940-1960' },
  { id: '1960-1980' },
  { id: '1980-2000' },
  { id: '2000-present' },
];

export function EraTabs({ selectedEra, onSelectEra }: EraTabsProps) {
  const t = useTranslations('tools.dev-people');

  const tabs: Array<{ id: Era | undefined; label: string }> = [
    { id: undefined, label: t('tabs.all') },
    ...ERAS.map((era) => ({
      id: era.id,
      label: t(`eras.${era.id}`),
    })),
  ];

  return (
    <div
      role="tablist"
      className="flex flex-wrap gap-2 overflow-x-auto pb-2"
      data-testid="era-tabs"
    >
      {tabs.map((tab) => {
        const isActive = selectedEra === tab.id;
        return (
          <button
            key={String(tab.id)}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectEra(tab.id as Era | undefined)}
            className={`
              whitespace-nowrap px-3.5 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2
              ${
                isActive
                  ? 'bg-brand text-on-brand'
                  : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
              }
            `}
            data-testid={`era-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
