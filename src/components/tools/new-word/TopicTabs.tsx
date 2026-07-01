import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface TopicTabsProps {
  activeTopic: 'all' | 'mz' | 'tech' | 'favorites' | 'recent';
  setActiveTopic: (t: 'all' | 'mz' | 'tech' | 'favorites' | 'recent') => void;
  favCount: number;
  recentCount: number;
}

const TOPICS = [
  { id: 'all' as const, i18nKey: 'topics.all' },
  { id: 'mz' as const, i18nKey: 'topics.mz' },
  { id: 'tech' as const, i18nKey: 'topics.tech' },
] as const;

export function TopicTabs({ activeTopic, setActiveTopic, favCount, recentCount }: TopicTabsProps) {
  const t = useTranslations('tools.new-word');

  const virtualTabs = [
    ...TOPICS,
    ...(favCount > 0 ? [{ id: 'favorites' as const, i18nKey: 'topics.favorites' }] : []),
    ...(recentCount > 0 ? [{ id: 'recent' as const, i18nKey: 'topics.recent' }] : []),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIdx = virtualTabs.findIndex((t) => t.id === activeTopic);
    if (e.key === 'ArrowLeft' && currentIdx > 0) {
      e.preventDefault();
      setActiveTopic(virtualTabs[currentIdx - 1].id);
    } else if (e.key === 'ArrowRight' && currentIdx < virtualTabs.length - 1) {
      e.preventDefault();
      setActiveTopic(virtualTabs[currentIdx + 1].id);
    }
  };

  return (
    <div role="tablist" className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2">
      {virtualTabs.map(({ id, i18nKey }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeTopic === id}
          onClick={() => setActiveTopic(id)}
          onKeyDown={handleKeyDown}
          className={`
            shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all
            ${
              activeTopic === id
                ? 'bg-brand text-on-brand'
                : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
            }
          `}
          data-testid={`topic-tab-${id}`}
        >
          {t(i18nKey)}
        </button>
      ))}
    </div>
  );
}
