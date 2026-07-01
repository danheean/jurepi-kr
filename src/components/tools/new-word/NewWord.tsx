'use client';

import { useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { MergedTerm } from '@/lib/new-word/schema';
import termsData from './data/terms.generated.json';
import { Toast } from '@/components/ui/Toast';
import { useGlossary } from './useGlossary';
import { TermSearch } from './TermSearch';
import { TopicTabs } from './TopicTabs';
import { TermList } from './TermList';
import { TermDetail } from './TermDetail';
import { NewWordIntro } from './NewWordIntro';
import { NewWordHowTo } from './NewWordHowTo';
import { NewWordFaq } from './NewWordFaq';
import { NewWordStructuredData } from './NewWordStructuredData';

// Static catalog import: available at SSR/prerender time so the term list AND the
// DefinedTermSet JSON-LD render into the initial HTML (AI crawlers don't run JS).
// Code-split: this module is only imported on the /tools/new-word route chunk.
const CATALOG = termsData as MergedTerm[];

export function NewWord() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.new-word');
  const g = useGlossary(CATALOG);

  const [toast, setToast] = useState<string | null>(null);

  const handleCopy = useCallback(
    async (text: string): Promise<boolean> => {
      const ok = await g.copy(text);
      if (ok) setToast(t('toast.copied'));
      return ok;
    },
    [g, t]
  );

  const handleToggleFav = useCallback(
    (slug: string) => {
      const wasFav = g.favorites.includes(slug);
      g.toggleFavorite(slug);
      setToast(wasFav ? t('toast.unfavorited') : t('toast.favorited'));
    },
    [g, t]
  );

  return (
    <div className="space-y-16">
      {/* SEO/GEO: rendered unconditionally (outside any mounted gate) so it lands
          in the prerendered HTML for search engines and answer engines. */}
      <NewWordIntro />

      {/* Interactive glossary island — desktop 2-split, mobile stacked */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">
        <div className="min-w-0 space-y-4">
          <TermSearch query={g.query} setQuery={g.setQuery} resultCount={g.resultCount} />
          <TopicTabs
            activeTopic={g.activeTopic}
            setActiveTopic={g.setActiveTopic}
            favCount={g.favorites.length}
            recentCount={g.recents.length}
          />
          <TermList
            terms={g.filtered}
            selectedSlug={g.selectedSlug}
            favorites={g.favorites}
            query={g.query}
            activeTopic={g.activeTopic}
            onSelect={g.select}
            onToggleFav={handleToggleFav}
            onClearQuery={() => g.setQuery('')}
            currentLocale={locale}
          />
        </div>

        {/* Detail: sticky card on desktop; on mobile only shown once a term is picked */}
        <aside
          className={`${
            g.selectedTerm ? 'mt-6 block lg:mt-0' : 'hidden lg:block'
          } lg:sticky lg:top-8 lg:self-start rounded-3xl border border-hairline bg-surface p-6 shadow-card`}
        >
          <TermDetail
            term={g.selectedTerm}
            displayLang={g.displayLang}
            setDisplayLang={g.setDisplayLang}
            onClose={() => g.select(null)}
            onSelect={g.select}
            onCopy={handleCopy}
            catalog={g.catalog}
            currentLocale={locale}
          />
        </aside>
      </div>

      <NewWordHowTo />
      <NewWordFaq />
      <NewWordStructuredData catalog={CATALOG} />

      {toast && (
        <Toast
          message={toast}
          type="success"
          open={!!toast}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
