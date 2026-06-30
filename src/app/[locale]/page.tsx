import { setRequestLocale, getTranslations } from 'next-intl/server';
import { tools } from '@/tools/registry';
import { Hero } from '@/components/home/Hero';
import { ToolExplorer } from '@/components/home/ToolExplorer';
import type { SearchableTool } from '@/lib/tool-search';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();

  // Resolve registry entries to localized, searchable tools (server-side) so
  // the full grid — and every tool link — is in the static HTML.
  const searchableTools: SearchableTool[] = tools.map((tool) => ({
    ...tool,
    name: t(`tools.${tool.id}.title`),
    description: t(`tools.${tool.id}.description`),
  }));

  return (
    <>
      <Hero />
      <ToolExplorer initialTools={searchableTools} />
    </>
  );
}
