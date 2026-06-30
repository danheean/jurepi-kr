import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { HeroMascot } from '@/components/home/HeroMascot';

/**
 * Localized 404. The mascot reappears here as a friendly guide back home.
 * Rendered inside the [locale] layout's <main>, so no <main> wrapper here.
 */
export default async function NotFound(): Promise<React.ReactNode> {
  const t = await getTranslations('notFound');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
      <HeroMascot size={132} className="mb-6" />
      <p className="mb-2 font-display text-5xl font-bold text-text-muted">404</p>
      <h1 className="mb-2 font-display text-2xl font-bold text-text">
        {t('heading')}
      </h1>
      <p className="mb-8 max-w-[24rem] text-text-secondary">{t('description')}</p>
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center rounded-lg bg-brand px-6 py-3 font-button text-on-brand transition-colors hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      >
        {t('backHome')}
      </Link>
    </div>
  );
}
