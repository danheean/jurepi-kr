import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { MergedTerm } from '@/lib/new-word/schema';
import { Markdown } from '@/components/markdown';
import { RelatedChips } from './RelatedChips';

interface TermDetailProps {
  term: MergedTerm | null;
  displayLang: 'ko' | 'en' | 'both';
  setDisplayLang: (l: 'ko' | 'en' | 'both') => void;
  onClose: () => void;
  onSelect: (slug: string) => void;
  onCopy: (text: string) => Promise<boolean>;
  catalog: MergedTerm[];
  currentLocale: 'ko' | 'en';
}

export function TermDetail({
  term,
  displayLang,
  setDisplayLang,
  onClose,
  onSelect,
  onCopy,
  catalog,
  currentLocale,
}: TermDetailProps) {
  const t = useTranslations('tools.new-word');
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle Esc to close
  useEffect(() => {
    if (!term) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.key === 'l' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        if (e.key === 'l') {
          // Cycle language: ko → en → both → ko
          setDisplayLang(displayLang === 'ko' ? 'en' : displayLang === 'en' ? 'both' : 'ko');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [term, displayLang, setDisplayLang, onClose]);

  if (!term) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-text-muted py-12">
        <p>{currentLocale === 'ko' ? '용어를 선택하세요' : 'Select a term'}</p>
      </div>
    );
  }

  const displayKo = displayLang === 'ko' || displayLang === 'both';
  const displayEn = displayLang === 'en' || displayLang === 'both';

  const renderContent = (locale: 'ko' | 'en') => {
    const content = term[locale];
    return (
      <div key={locale} className={displayLang === 'both' ? 'mb-8 pb-8 border-b border-hairline last:border-0 last:mb-0 last:pb-0' : ''}>
        {displayLang === 'both' && (
          <h3 className="text-xs font-medium text-text-muted uppercase mb-4">
            {locale === 'ko' ? '한국어' : 'English'}
          </h3>
        )}

        {/* Definition */}
        <div className="mb-6">
          <p className="text-sm font-medium text-text-muted mb-2">{t('detail.definition')}</p>
          <p className="text-base leading-relaxed text-text">{content.definition}</p>
        </div>

        {/* Examples */}
        {content.examples.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-text-muted mb-3">{t('detail.examples')}</p>
            <ul className="space-y-2">
              {content.examples.map((ex, i) => (
                <li key={i} className="text-sm text-text-secondary">
                  • {ex}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Origin/Etymology */}
        {content.origin && (
          <div className="mb-6">
            <p className="text-sm font-medium text-text-muted mb-2">{t('detail.origin')}</p>
            <p className="text-sm text-text-secondary">{content.origin}</p>
          </div>
        )}

        {/* Extended explanation (markdown body) — rendered via shared <Markdown> */}
        {content.body && content.body.trim() && (
          <div className="mb-2">
            <Markdown>{content.body}</Markdown>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      className="flex flex-col h-full overflow-y-auto"
      data-testid="term-detail"
    >
      {/* Header */}
      <div className="sticky top-0 bg-surface border-b border-hairline px-4 py-4 -mx-4 -mt-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-text truncate">{term[currentLocale].term}</h2>
            {term[currentLocale].reading && (
              <p className="text-sm text-text-muted">{term[currentLocale].reading}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close detail"
            className="shrink-0 ml-2 text-text-muted hover:text-text transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand rounded"
            data-testid="term-detail-close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Language toggle */}
        <div className="flex gap-2">
          {(['ko', 'en', 'both'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setDisplayLang(lang)}
              className={`
                px-3 py-1 text-xs font-medium rounded transition-colors
                ${
                  displayLang === lang
                    ? 'bg-brand text-on-brand'
                    : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
                }
              `}
              data-testid={`lang-toggle-${lang}`}
            >
              {lang === 'ko' ? t('langToggle.ko') : lang === 'en' ? t('langToggle.en') : t('langToggle.both')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-6">
        {displayKo && renderContent('ko')}
        {displayEn && renderContent('en')}

        {/* Metadata row: topic + year + tags + copy buttons */}
        <div className="space-y-3 pt-4 border-t border-hairline">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium px-2 py-1 rounded bg-surface-muted text-text-muted">
              {term.topic.toUpperCase()}
            </span>
            {term.coinedYear && (
              <span className="text-xs px-2 py-1 rounded bg-surface-muted text-text-muted">
                {term.coinedYear}
              </span>
            )}
            {term.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded bg-surface-muted text-text-muted">
                {tag}
              </span>
            ))}
          </div>

          {/* Copy buttons */}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const success = await onCopy(
                  term[currentLocale === 'ko' ? (displayLang === 'en' ? 'en' : 'ko') : 'en'].term
                );
                if (success) {
                  // Toast handled by parent
                }
              }}
              className="flex-1 text-xs px-3 py-2 rounded bg-surface-muted text-text-secondary hover:bg-surface-sunken transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
              data-testid="copy-term"
            >
              {t('detail.copyTerm')}
            </button>
            <button
              onClick={async () => {
                const success = await onCopy(
                  term[currentLocale === 'ko' ? (displayLang === 'en' ? 'en' : 'ko') : 'en'].definition
                );
                if (success) {
                  // Toast handled by parent
                }
              }}
              className="flex-1 text-xs px-3 py-2 rounded bg-surface-muted text-text-secondary hover:bg-surface-sunken transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
              data-testid="copy-definition"
            >
              {t('detail.copyDefinition')}
            </button>
          </div>
        </div>

        {/* Related terms */}
        {term.related.length > 0 && (
          <div className="pt-4 border-t border-hairline">
            <RelatedChips
              related={term.related}
              catalog={catalog}
              onSelect={onSelect}
              currentLocale={currentLocale}
            />
          </div>
        )}
      </div>
    </div>
  );
}
