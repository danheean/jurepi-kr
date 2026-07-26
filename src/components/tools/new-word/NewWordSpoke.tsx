import { useTranslations, useLocale } from 'next-intl';
import { MergedTerm } from '@/lib/new-word/schema';
import { byId } from '@/lib/new-word/catalog';
import { toneEmoji } from '@/lib/new-word/tone';
import { Markdown } from '@/components/markdown';

interface NewWordSpokeProps {
  term: MergedTerm;
  locale: 'ko' | 'en';
  catalog: MergedTerm[];
}

const TOPIC_COLORS: Record<string, { badge: string }> = {
  mz: { badge: 'text-accent-mint' },
  tech: { badge: 'text-accent-sky' },
};

export function NewWordSpoke({ term, locale, catalog }: NewWordSpokeProps) {
  const t = useTranslations('tools.new-word');
  const currentLocale = useLocale();
  const content = term[locale];
  const colors = TOPIC_COLORS[term.topic] || TOPIC_COLORS.mz;
  const emoji = term.tone ? toneEmoji(term.tone) : null;

  return (
    <article className="w-full max-w-container mx-auto px-6 py-16">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8"
        data-testid="spoke-breadcrumb"
      >
        <ol className="flex items-center gap-2 text-sm text-text-muted">
          <li>
            <a href={`/${currentLocale}`} className="hover:text-text transition-colors">
              {t('spoke.breadcrumbHome')}
            </a>
          </li>
          <li className="text-hairline">›</li>
          <li>
            <a
              href={`/${currentLocale}/tools/new-word`}
              className="hover:text-text transition-colors"
            >
              {t('intro.title')}
            </a>
          </li>
          <li className="text-hairline">›</li>
          <li className="text-text font-medium">{content.term}</li>
        </ol>
      </nav>

      {/* H1 + Reading */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text mb-2">
          {content.term}
        </h1>
        {content.reading && (
          <p className="text-sm text-text-muted">{content.reading}</p>
        )}
      </div>

      {/* Definition (answer-first) */}
      <div className="mb-8 pb-8 border-b border-hairline">
        <p className="text-sm font-medium text-text-muted mb-2">
          {t('detail.definition')}
        </p>
        <p className="text-base leading-relaxed text-text">
          {content.definition}
        </p>
      </div>

      {/* Examples */}
      {content.examples.length > 0 && (
        <div className="mb-8 pb-8 border-b border-hairline">
          <p className="text-sm font-medium text-text-muted mb-3">
            {t('detail.examples')}
          </p>
          <ul className="space-y-2">
            {content.examples.map((ex, i) => (
              <li key={i} className="text-sm text-text-secondary">
                • {ex}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Origin */}
      {content.origin && (
        <div className="mb-8 pb-8 border-b border-hairline">
          <p className="text-sm font-medium text-text-muted mb-2">
            {t('detail.origin')}
          </p>
          <p className="text-sm text-text-secondary">{content.origin}</p>
        </div>
      )}

      {/* Markdown body */}
      {content.body && content.body.trim() && (
        <div className="mb-8 pb-8 border-b border-hairline">
          <Markdown>{content.body}</Markdown>
        </div>
      )}

      {/* Meta chips: topic + tone + coinedYear + tags */}
      <div className="mb-8 pb-8 border-b border-hairline">
        <div className="flex flex-wrap gap-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded bg-surface-muted ${colors.badge}`}
            data-testid="spoke-topic-chip"
          >
            {term.topic.toUpperCase()}
          </span>
          {term.tone && (
            <span
              className="text-xs font-medium px-2 py-1 rounded bg-surface-muted text-text-muted"
              data-testid="spoke-tone-chip"
            >
              {emoji && (
                <span role="img" aria-hidden="true" className="mr-1">
                  {emoji}
                </span>
              )}
              {t(`tone.${term.tone}`)}
            </span>
          )}
          {term.coinedYear && (
            <span
              className="text-xs px-2 py-1 rounded bg-surface-muted text-text-muted"
              data-testid="spoke-coined-year-chip"
            >
              {term.coinedYear}
            </span>
          )}
          {(content.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded bg-surface-muted text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Related terms */}
      {term.related.length > 0 && (
        <div className="mb-8 pb-8 border-b border-hairline">
          <h2 className="text-sm font-medium text-text-muted mb-4">
            {t('spoke.relatedHeading')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {term.related
              .map((slug) => byId(catalog, slug))
              .filter((item): item is MergedTerm => item !== null)
              .map((relatedTerm) => (
                <li key={relatedTerm.slug}>
                  <a
                    href={`/${currentLocale}/tools/new-word/${relatedTerm.slug}`}
                    className="text-sm px-3 py-2 rounded bg-surface-muted text-text hover:bg-surface-sunken transition-colors"
                    data-testid={`spoke-related-link-${relatedTerm.slug}`}
                  >
                    {relatedTerm[locale].term}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Back to hub */}
      <div className="pt-4">
        <a
          href={`/${currentLocale}/tools/new-word`}
          className="text-sm text-text-muted hover:text-text transition-colors"
          data-testid="spoke-back-to-hub"
        >
          {t('spoke.backToHub')}
        </a>
      </div>
    </article>
  );
}
