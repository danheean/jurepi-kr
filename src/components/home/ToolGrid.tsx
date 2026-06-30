'use client';

import { useTranslations } from 'next-intl';
import type { SearchableTool } from '@/lib/tool-search';
import { ToolCard } from './ToolCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface ToolGridProps {
  tools: SearchableTool[];
  isFiltered: boolean;
  onReset: () => void;
  testId?: string;
}

/**
 * ToolGrid: responsive grid layout (1-col <480, 2-col 480–767, 3-col 768–1023, 4-col ≥1024).
 * Maps tools to ToolCard. Shows EmptyState if no tools and filters are active.
 */
export function ToolGrid({
  tools,
  isFiltered,
  onReset,
  testId,
}: ToolGridProps): React.ReactNode {
  const t = useTranslations('emptyState');

  if (tools.length === 0) {
    return (
      <EmptyState
        heading={t('heading')}
        body={t('body')}
        actionLabel={t('resetButton')}
        onAction={onReset}
        showMascot={true}
        testId={testId ? `${testId}-empty` : undefined}
      />
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-container mx-auto px-6 md:px-8 lg:px-12"
      data-testid={testId}
    >
      {tools.map(tool => (
        <ToolCard
          key={tool.id}
          tool={tool}
          testId={testId ? `${testId}-card-${tool.id}` : undefined}
        />
      ))}
    </div>
  );
}
