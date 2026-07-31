import { useTranslations } from 'next-intl';
import { MONTH_SLUGS } from '@/lib/birthday-secret/schema';

interface MonthGridProps {
  locale: string;
}

/**
 * Server-rendered index of the 12 monthly spoke pages. Rendered at the route
 * level (gate-outside SSR) so the spoke anchors land in the prerendered HTML
 * for crawlers and internal linking.
 */
export function MonthGrid({ locale }: MonthGridProps) {
  const t = useTranslations('tools.birthday-secret');
  return (
    <section aria-labelledby="bs-grid-heading" className="mt-10 space-y-3">
      <div>
        <h2 id="bs-grid-heading" className="text-lg font-bold text-text">
          {t('grid.title')}
        </h2>
        <p className="text-sm text-text-secondary">{t('grid.subtitle')}</p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {MONTH_SLUGS.map((slug) => (
          <li key={slug} className="min-w-0">
            <a
              href={`/${locale}/tools/birthday-secret/${slug}`}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-hairline bg-surface px-3 py-2 text-center font-semibold text-text transition-colors hover:bg-accent-rose-soft hover:text-accent-rose-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {t(`months.${slug}`)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
