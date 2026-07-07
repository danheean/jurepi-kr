import type { Metadata } from 'next';
import type { MergedPerson } from './dev-people/schema';

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

/**
 * Build schema.org ItemList JSON-LD for rankings.
 * Structured data for search engines to recognize and cite ranked lists in AI-generated answers.
 */
export function itemListJsonLd({
  name,
  description,
  url,
  items,
}: {
  name: string;
  description?: string;
  url: string;
  items: Array<{ position: number; name: string; description: string; url?: string }>;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': url,
    url,
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      description: item.description,
      url: item.url || url,
    })),
  };
}

/**
 * Build absolute URL for an entity (spoke) page — canonical/JSON-LD/sitemap single source.
 * Example: `/ko/tools/new-word/god-saeng` → `https://jurepi.kr/ko/tools/new-word/god-saeng`
 */
export function absoluteEntityUrl(locale: string, toolSlug: string, entitySlug: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';
  return `${siteUrl}/${locale}/tools/${toolSlug}/${entitySlug}`;
}

/**
 * Build metadata for an entity (spoke) page — mirrors buildToolMetadata but for individual entities.
 * Constructs canonical URL to entity page, hreflang alternates (ko/en), and Open Graph tags with type='article'.
 */
export function buildToolEntityMetadata({
  locale,
  toolSlug,
  entitySlug,
  title,
  description,
}: {
  locale: string;
  toolSlug: string;
  entitySlug: string;
  title: string;
  description: string;
}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';
  const canonicalUrl = absoluteEntityUrl(locale, toolSlug, entitySlug);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ko: absoluteEntityUrl('ko', toolSlug, entitySlug),
        en: absoluteEntityUrl('en', toolSlug, entitySlug),
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
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
 * Build a single DefinedTerm JSON-LD.
 * Used for spoke pages to mark up individual terms in a glossary.
 */
export function definedTermJsonLd({
  name,
  description,
  url,
  inDefinedTermSetUrl,
}: {
  name: string;
  description: string;
  url: string;
  inDefinedTermSetUrl: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name,
    description,
    url,
    inDefinedTermSet: {
      '@id': inDefinedTermSetUrl,
    },
  };
}

/**
 * Build BreadcrumbList JSON-LD.
 * Structured data for breadcrumb navigation on spoke pages.
 */
export function breadcrumbListJsonLd(items: Array<{ name: string; url: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Build a Person JSON-LD for developer/engineer spoke pages.
 * Used on individual person profile pages to mark up biographical information.
 */
export function personJsonLd(person: MergedPerson, locale: string): Record<string, unknown> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';
  const personUrl = `${siteUrl}/${locale}/tools/dev-people/${person.slug}`;
  const localePerson = locale === 'ko' ? person.ko : person.en;

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: localePerson.name,
    description: localePerson.knownFor,
    url: personUrl,
  };

  // Birth date (year precision)
  if (person.birthYear) {
    ld.birthDate = `${person.birthYear}`;
  }

  // Death date (year precision)
  if (person.deathYear) {
    ld.deathDate = `${person.deathYear}`;
  }

  // Nationality (two-letter country code mapping)
  const countryMap: Record<string, string> = {
    US: 'United States',
    UK: 'United Kingdom',
    CA: 'Canada',
    FI: 'Finland',
    CH: 'Switzerland',
  };
  if (person.nationality && countryMap[person.nationality]) {
    ld.nationality = {
      '@type': 'Country',
      name: countryMap[person.nationality],
    };
  }

  // Tags/Knowledge areas
  if (person.tags && person.tags.length > 0) {
    ld.knowsAbout = person.tags;
  }

  // External links (Wikipedia, GitHub, etc.)
  const sameAsLinks: string[] = [];
  if (person.links && person.links.length > 0) {
    person.links.forEach((link) => {
      if (link.url.includes('wikipedia.org') || link.url.includes('github.com')) {
        sameAsLinks.push(link.url);
      }
    });
  }
  if (sameAsLinks.length > 0) {
    ld.sameAs = sameAsLinks;
  }

  // Photo/image (if available)
  if (person.photo) {
    const photoUrl = `${siteUrl}/images/dev-people/${person.photo}`;
    ld.image = {
      '@type': 'ImageObject',
      url: photoUrl,
      name: `${localePerson.name} portrait`,
    };
  }

  return ld;
}

/**
 * Build TechArticle JSON-LD for how-to guide spoke pages.
 * Used on individual guide pages to mark up technical article content.
 */
export function techArticleJsonLd({
  headline,
  description,
  url,
  datePublished,
  inLanguage,
}: {
  headline: string;
  description: string;
  url: string;
  datePublished?: string;
  inLanguage: string;
}): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    url,
    inLanguage,
  };

  if (datePublished) {
    ld.datePublished = datePublished;
    ld.dateModified = datePublished;
  }

  return ld;
}
