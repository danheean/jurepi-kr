import { useTranslations } from 'next-intl';
import { Calendar, Info } from 'lucide-react';

interface ProvenanceBannerProps {
  asOfDate: string;
  sourceNote: string;
  sourceUrl?: string;
}

export function ProvenanceBanner({
  asOfDate,
  sourceNote,
  sourceUrl,
}: ProvenanceBannerProps) {
  const t = useTranslations('tools.rankings.detail.provenance');

  return (
    <div
      className="rounded-lg border border-accent-rose bg-accent-rose-soft p-4 space-y-3"
      aria-label={t('aria')}
    >
      {/* As-of date row */}
      <div className="flex items-start gap-3">
        <Calendar className="w-5 h-5 text-accent-rose flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-rose">
            {t('asOfLabel')}
          </p>
          <p className="text-sm font-medium text-text">{asOfDate}</p>
        </div>
      </div>

      {/* Source note row */}
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-accent-rose flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-rose">
            {t('sourceLabel')}
          </p>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="text-sm font-medium text-accent-rose underline hover:text-accent-rose-soft transition-colors break-words"
            >
              {sourceNote}
              <span aria-label="외부 링크" className="ml-1">↗</span>
            </a>
          ) : (
            <p className="text-sm font-medium text-text">{sourceNote}</p>
          )}
        </div>
      </div>
    </div>
  );
}
