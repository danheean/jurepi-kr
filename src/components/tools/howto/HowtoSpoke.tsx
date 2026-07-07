import { getTranslations } from 'next-intl/server';
import type { MergedGuide } from '@/lib/howto/schema';
import { readingTime, byId } from '@/lib/howto/catalog';
import { Markdown } from '@/components/markdown';
import { ShareButtons } from '@/components/share/ShareButtons';
import { absoluteToolUrl } from '@/lib/seo';

interface HowtoSpokeProps {
  guide: MergedGuide;
  locale: 'ko' | 'en';
  /** Full catalog — used to resolve related-guide titles. */
  catalog?: MergedGuide[];
}

export async function HowtoSpoke({ guide, locale, catalog = [] }: HowtoSpokeProps) {
  const t = await getTranslations({ locale, namespace: 'tools.howto' });
  const content = guide[locale];
  const time = readingTime(content.body);

  const formattedDate = guide.updated
    ? new Date(guide.updated).toLocaleDateString(locale === 'ko' ? 'ko' : 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <article className="prose prose-sm max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="text-3xl font-bold text-text">{content.title}</h1>
        <p className="text-lg text-text-secondary">{content.summary}</p>
        
        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-text-muted">
          {formattedDate && (
            <span>{t('spoke.updated', { date: formattedDate })}</span>
          )}
          {guide.difficulty && (
            <span>{t(`difficulty.${guide.difficulty}`)}</span>
          )}
          <span>{t('spoke.readingTime', { minutes: time })}</span>
        </div>

        {/* Share buttons */}
        <ShareButtons
          url={`${absoluteToolUrl(locale, 'howto')}/${guide.slug}`}
          title={content.title}
        />
      </header>

      {/* Cover image */}
      {guide.coverImage && (
        <figure className="space-y-2">
          <img
            src={guide.coverImage}
            alt={content.title}
            className="w-full rounded-lg border border-hairline"
            loading="eager"
            fetchPriority="high"
          />
        </figure>
      )}

      {/* Body - rendered unconditionally for SEO/GEO */}
      <Markdown
        enableCodeHighlight
        enableMermaid
        enableRichImages
        codeCopyLabel={t('code.copy')}
        codeCopiedLabel={t('code.copied')}
        mermaidSourceLabel={t('mermaid.sourceLabel')}
        className="prose prose-sm"
      >
        {content.body}
      </Markdown>

      {/* Related guides */}
      {guide.related.length > 0 && (
        <aside className="border-t border-hairline pt-6 space-y-3">
          <h3 className="font-bold text-text">{t('spoke.related')}</h3>
          <div className="flex flex-wrap gap-2">
            {guide.related
              .map((slug) => ({ slug, related: byId(catalog, slug) }))
              .filter((r) => r.related !== undefined)
              .map(({ slug, related }) => (
                <a
                  key={slug}
                  href={`/${locale}/tools/howto/${slug}`}
                  className="px-3 py-1 rounded-full bg-surface-muted text-text-muted hover:bg-surface-sunken transition-colors"
                >
                  {related![locale].title}
                </a>
              ))}
          </div>
        </aside>
      )}

      {/* Back link */}
      <nav className="pt-6">
        <a
          href={`/${locale}/tools/howto`}
          className="text-brand hover:underline font-medium"
        >
          ← {t('spoke.backToHub')}
        </a>
      </nav>
    </article>
  );
}
