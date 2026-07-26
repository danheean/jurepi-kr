import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { MergedTopic } from '@/lib/bookmarks/schema';
import { TopicSections } from './TopicSections';
import { ShareButtons } from '@/components/share/ShareButtons';
import { Markdown } from '@/components/markdown/Markdown';
import { absoluteEntityUrl } from '@/lib/seo';

interface TopicDetailProps {
  topic: MergedTopic;
  onClose: () => void;
  locale: 'ko' | 'en';
}

export function TopicDetail({ topic, onClose, locale }: TopicDetailProps) {
  const t = useTranslations('tools.bookmarks.detail');

  const localeData = locale === 'ko' ? topic.ko : topic.en;

  // Handle Esc key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="space-y-5">
      {/* Header: title + close button (mobile) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="bookmarks-detail-heading" className="text-xl font-bold text-text leading-tight">
            {localeData.title}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">{localeData.description}</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden inline-flex items-center justify-center min-h-11 min-w-11 hover:bg-surface-muted rounded-lg transition-colors flex-shrink-0"
          aria-label={t('close')}
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Share buttons — entity-specific URL + title */}
      <div className="flex justify-end">
        <ShareButtons
          url={absoluteEntityUrl(locale, 'bookmarks', topic.slug)}
          title={localeData.title}
        />
      </div>

      {/* Sections */}
      <TopicSections sections={localeData.sections} locale={locale} />

      {/* Long-form markdown body (if present) */}
      {localeData.body && (
        <div data-testid="bookmarks-detail-body" className="pt-2 border-t border-hairline">
          <Markdown>{localeData.body}</Markdown>
        </div>
      )}
    </div>
  );
}
