import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

type ProsePageProps = {
  namespace: 'about' | 'privacy' | 'terms';
};

export async function ProsePage({ namespace }: ProsePageProps) {
  const t = await getTranslations(namespace);

  const sections = t.raw('sections') as Array<{ title: string; body: string }>;
  const hasLastUpdated = t.has('lastUpdated');

  return (
    <article className="mx-auto max-w-[720px] px-6 py-16 sm:py-20">
      {/* Back-to-home link */}
      <Link
        href="/"
        className="inline-flex mb-8 text-body-sm text-brand hover:text-brand-strong transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
      >
        ← Back to home
      </Link>

      {/* Main heading */}
      <h1 className="font-display text-4xl font-bold text-text mb-6">
        {t('heading')}
      </h1>

      {/* Intro paragraph */}
      <p className="text-body-lg text-text-secondary mb-8">
        {t('intro')}
      </p>

      {/* Last updated (if present) */}
      {hasLastUpdated && (
        <p className="text-caption text-text-muted mb-12">
          {t('lastUpdated')}
        </p>
      )}

      {/* Sections */}
      <div className="space-y-12">
        {sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="font-display text-2xl font-bold text-text mb-4">
              {section.title}
            </h2>
            <p className="text-body text-text-secondary leading-relaxed">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
