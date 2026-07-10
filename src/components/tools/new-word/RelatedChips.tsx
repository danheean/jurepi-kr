import { ArrowUpRight } from 'lucide-react';
import { MergedTerm } from '@/lib/new-word/schema';
import { byId } from '@/lib/new-word/catalog';

interface RelatedChipsProps {
  related: string[];
  catalog: MergedTerm[];
  onSelect: (slug: string) => void;
  currentLocale: 'ko' | 'en';
}

export function RelatedChips({
  related,
  catalog,
  onSelect,
  currentLocale,
}: RelatedChipsProps) {
  if (related.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-text-muted uppercase">
        {currentLocale === 'ko' ? '관련 용어' : 'Related Terms'}
      </p>
      <div className="flex flex-wrap gap-2">
        {related.map((slug) => {
          const term = byId(catalog, slug);
          if (!term) return null;

          return (
            <button
              key={slug}
              onClick={() => onSelect(slug)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-muted hover:bg-surface-sunken text-sm text-brand-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
              data-testid={`related-chip-${slug}`}
            >
              {term[currentLocale].term}
              <ArrowUpRight className="w-3 h-3" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
