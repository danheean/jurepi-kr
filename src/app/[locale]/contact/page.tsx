import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { buildPageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/routing';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return buildPageMetadata({
    locale,
    path: '/contact',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');

  const email = t('email');
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

  return (
    <article className="mx-auto max-w-[720px] px-6 py-16 sm:py-20">
      {/* Back-to-home link */}
      <Link
        href="/"
        className="inline-flex mb-8 text-body-sm text-brand-ink hover:text-brand-ink-strong transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 rounded"
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

      {/* Email contact block */}
      <div className="mb-8 p-6 rounded-xl bg-surface-muted border border-hairline">
        <p className="text-caption text-text-muted mb-2 uppercase tracking-wider">
          {t('emailLabel')}
        </p>
        <a
          href={`mailto:${email}`}
          className="text-body font-semibold text-brand-ink hover:text-brand-ink-strong transition-colors duration-150 break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 rounded"
        >
          {email}
        </a>
      </div>

      {/* Blog link (conditional) */}
      {blogUrl && (
        <div className="mb-8">
          <a
            href={blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-sm text-brand-ink hover:text-brand-ink-strong transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 rounded"
          >
            {t('blogLabel')} →
          </a>
        </div>
      )}

      {/* Note */}
      <p className="text-body-sm text-text-secondary leading-relaxed">
        {t('note')}
      </p>
    </article>
  );
}
