import { getToolBySlug, getLiveTools } from '@/tools/registry';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import dynamic from 'next/dynamic';

const LadderGame = dynamic(() =>
  import('@/components/tools/ladder/LadderGame').then((m) => ({
    default: m.LadderGame,
  }))
);

export function generateStaticParams() {
  return getLiveTools().map((tool) => ({
    locale: 'ko',
    slug: tool.slug,
  }))
  .concat(
    getLiveTools().map((tool) => ({
      locale: 'en',
      slug: tool.slug,
    }))
  );
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

async function ToolContent({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);

  if (!tool || tool.status !== 'live') {
    notFound();
  }

  // Mount tool based on slug
  if (slug === 'ladder') {
    return <LadderGame />;
  }

  notFound();
}

export default async function ToolPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-container px-6 py-16">
        {/* Breadcrumb */}
        <div className="mb-8">
          <a href={`/${locale}`} className="text-brand hover:text-brand-strong">
            ← Back
          </a>
        </div>

        {/* Tool Content with Error Boundary */}
        <ErrorBoundary>
          <Suspense fallback={<div>Loading tool...</div>}>
            <ToolContent slug={slug} />
          </Suspense>
        </ErrorBoundary>

        {/* AdSlot Stub (fixed height, no render until consent) */}
        <div className="mt-24 flex justify-center">
          <div
            className="w-full max-w-2xl rounded-lg bg-surface-muted"
            style={{ height: '250px', minHeight: '250px' }}
            role="region"
            aria-label="Advertisement"
          >
            <div className="flex items-center justify-center h-full text-text-muted text-sm">
              Ad Slot (Reserved Height)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
