'use client';

import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl, definedTermSetJsonLd } from '@/lib/seo';
import { markdownToPlainText } from '@/lib/markdown/markdownToPlainText';

interface MergedTerm {
  slug: string;
  topic: 'mz' | 'tech';
  ko: { term: string; definition: string };
  en: { term: string; definition: string };
}

interface NewWordStructuredDataProps {
  catalog: MergedTerm[];
}

/**
 * NewWord structured data (JSON-LD) component.
 * Injects SoftwareApplication + DefinedTermSet JSON-LD unconditionally.
 * Locale and catalog are props; rendered server-side before any client hydration.
 */
export function NewWordStructuredData({ catalog }: NewWordStructuredDataProps) {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.new-word');

  const toolUrl = absoluteToolUrl(locale, 'new-word');
  const title = t('intro.title');
  const description = t('intro.lead');

  // SoftwareApplication
  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  });

  // DefinedTermSet: build term list from catalog
  const termList = catalog.map((term) => ({
    slug: term.slug,
    term: locale === 'ko' ? term.ko.term : term.en.term,
    definition: markdownToPlainText(
      locale === 'ko' ? term.ko.definition : term.en.definition
    ),
  }));

  const definedTermSet = definedTermSetJsonLd({
    name: title,
    description,
    url: toolUrl,
    terms: termList,
  });

  return (
    <>
      {/* SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />

      {/* DefinedTermSet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSet) }}
      />
    </>
  );
}
