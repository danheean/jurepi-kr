import type { Metadata } from 'next';

/**
 * Build metadata for a tool page.
 * Constructs canonical URL, hreflang alternates, and Open Graph tags.
 */
export function buildToolMetadata({
  locale,
  slug,
  title,
  description,
}: {
  locale: string;
  slug: string;
  title: string;
  description: string;
}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';
  const canonicalUrl = `${siteUrl}/${locale}/tools/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ko: `${siteUrl}/ko/tools/${slug}`,
        en: `${siteUrl}/en/tools/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'Jurepi',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      images: [
        {
          url: `${siteUrl}/og-default.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/og-default.png`],
    },
  };
}

/**
 * Build metadata for a page (About, Privacy, Terms, Contact, etc.).
 * Constructs canonical URL, hreflang alternates, and Open Graph tags.
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';
  const canonicalUrl = `${siteUrl}/${locale}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ko: `${siteUrl}/ko${path}`,
        en: `${siteUrl}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'Jurepi',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      images: [
        {
          url: `${siteUrl}/og-default.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/og-default.png`],
    },
  };
}

/**
 * Absolute canonical URL for a tool — used by client-side JSON-LD so structured
 * data matches the <link rel="canonical"> built by buildToolMetadata.
 */
export function absoluteToolUrl(locale: string, slug: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';
  return `${siteUrl}/${locale}/tools/${slug}`;
}

/**
 * Build SoftwareApplication JSON-LD schema.
 * Structured data for search engines to understand the tool.
 */
export function softwareApplicationJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory: 'UtilityApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    downloadUrl: url,
    operatingSystem: 'Any',
  };
}

/**
 * Build FAQPage JSON-LD schema.
 * Structured data for FAQ snippets in search results.
 */
export function faqPageJsonLd(
  items: Array<{ q: string; a: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

/**
 * Build schema.org DefinedTermSet JSON-LD for glossaries.
 * Structured data for search engines to recognize the glossary and expose terms in knowledge panels.
 */
export function definedTermSetJsonLd({
  name,
  description,
  url,
  terms,
}: {
  name: string;
  description: string;
  url: string;
  terms: Array<{ slug: string; term: string; definition: string }>;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': url,
    url,
    name,
    description,
    hasDefinedTerm: terms.map((item) => ({
      '@type': 'DefinedTerm',
      name: item.term,
      description: item.definition,
      inDefinedTermSet: { '@id': url },
      url: `${url}#${item.slug}`,
    })),
  };
}
