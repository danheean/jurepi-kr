import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { tools } from '@/tools/registry';
import { Hero } from '@/components/home/Hero';
import { ToolExplorer } from '@/components/home/ToolExplorer';
import { toSearchableTools } from '@/lib/searchable-tools';
import { buildPageMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  // Empty path → canonical `${siteUrl}/${locale}` with ko/en hreflang alternates.
  return buildPageMetadata({
    locale,
    path: '',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();

  // Resolve registry entries to localized, searchable tools (server-side) so
  // the full grid — and every tool link — is in the static HTML.
  const searchableTools = toSearchableTools(tools, t);

  return (
    <>
      <Hero />
      <ToolExplorer initialTools={searchableTools} />
    </>
  );
}
