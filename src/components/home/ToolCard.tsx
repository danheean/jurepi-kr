'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import type { SearchableTool } from '@/lib/tool-search';
import { accentTileClass, ToolIcon } from './toolStyle';
import { Badge } from '@/components/ui/Badge';

interface ToolCardProps {
  tool: SearchableTool;
  testId?: string;
}

/**
 * ToolCard: white card, accent icon tile, title, description, badges.
 * Live tools: whole card is a Link; hover lift + shadow.
 * Coming_soon: div with opacity 0.7, non-interactive.
 */
export function ToolCard({ tool, testId }: ToolCardProps): React.ReactNode {
  const t = useTranslations('card');
  const locale = useLocale();
  const { bg: bgClass, text: textClass } = accentTileClass(tool.accent);
  const isLive = tool.status === 'live';

  const content = (
    <>
      {/* Top section: icon tile + badges */}
      <div className="flex justify-between items-start gap-3 mb-4">
        {/* Icon tile (48px) */}
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClass}`}
        >
          <div className={textClass}>
            <ToolIcon name={tool.icon} className="w-6 h-6" />
          </div>
        </div>

        {/* Badges (top-right) */}
        <div className="flex gap-1.5 flex-wrap justify-end">
          {tool.isNew && (
            <Badge
              variant="new"
              data-testid={testId ? `${testId}-badge-new` : undefined}
            >
              {t('new')}
            </Badge>
          )}
          {tool.isPopular && (
            <Badge
              variant="popular"
              data-testid={testId ? `${testId}-badge-popular` : undefined}
            >
              {t('popular')}
            </Badge>
          )}
          {tool.status === 'coming_soon' && (
            <Badge
              variant="soon"
              data-testid={testId ? `${testId}-badge-soon` : undefined}
            >
              {t('comingSoon')}
            </Badge>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-text mb-2 line-clamp-2">
        {tool.name}
      </h3>

      {/* Description (2-line clamp) */}
      <p className="text-sm text-text-secondary line-clamp-2">
        {tool.description}
      </p>
    </>
  );

  if (isLive) {
    return (
      <Link
        href={`/tools/${tool.slug}`}
        locale={locale}
        data-testid={testId}
        className="group block h-full"
      >
        <div className="bg-surface border border-hairline rounded-xl p-5 shadow-card min-h-[150px] flex flex-col justify-start transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-card-hover group-hover:border-brand-soft group-active:scale-99 group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-offset-2 group-focus-visible:ring-focus-ring cursor-pointer motion-reduce:group-hover:translate-y-0">
          {content}
        </div>
      </Link>
    );
  }

  // Coming soon
  return (
    <div
      data-testid={testId}
      aria-disabled="true"
      className="bg-surface border border-hairline rounded-xl p-5 shadow-card min-h-[150px] flex flex-col justify-start opacity-70 cursor-default"
    >
      {content}
    </div>
  );
}
