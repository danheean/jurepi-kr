import { useTranslations } from 'next-intl';
import type { MergedTopic } from '@/lib/bookmarks/schema';
import { TopicSections } from './TopicSections';

interface BookmarksSpokeProps {
  topic: MergedTopic;
  locale: 'ko' | 'en';
}

// Synchronous, isomorphic `useTranslations` (not async `getTranslations`) so this
// SSR section renders in vitest too — matches RankingsSpoke and the jurepi-tdd rule.
export function BookmarksSpoke({ topic, locale }: BookmarksSpokeProps) {
  const t = useTranslations('tools.bookmarks');
  const localeData = topic[locale];

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <nav
        aria-label="Breadcrumb"
        data-testid="bookmarks-spoke-breadcrumb"
        className="flex items-center gap-2 text-sm"
      >
        <a
          href={`/${locale}`}
          className="text-text-secondary hover:text-text transition-colors"
        >
          {t('spoke.breadcrumbHome')}
        </a>
        <span className="text-text-muted">›</span>
        <a
          href={`/${locale}/tools/bookmarks`}
          className="text-text-secondary hover:text-text transition-colors"
        >
          {t('intro.title')}
        </a>
        <span className="text-text-muted">›</span>
        <span className="text-text">{localeData.title}</span>
      </nav>

      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-text leading-tight">
          {localeData.title}
        </h1>
      </div>

      {/* Description */}
      <p className="text-base text-text-secondary leading-relaxed">
        {localeData.description}
      </p>

      {/* Sections and links — SSR'd outside any mounted gate */}
      <TopicSections sections={localeData.sections} locale={locale} />

      {/* Back to hub link */}
      <div className="pt-4 border-t border-hairline">
        <a
          href={`/${locale}/tools/bookmarks`}
          data-testid="bookmarks-spoke-back-to-hub"
          className="inline-flex items-center text-text-secondary hover:text-text transition-colors font-medium no-underline"
        >
          {t('spoke.backToHub')}
        </a>
      </div>
    </div>
  );
}
