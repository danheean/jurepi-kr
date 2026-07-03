import { getToolBySlug, getLiveTools } from '@/tools/registry';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo';
import { UrlEncoderIntro } from '@/components/tools/url-encoder/UrlEncoderIntro';
import { UrlEncoderHowTo } from '@/components/tools/url-encoder/UrlEncoderHowTo';
import { UrlEncoderFaq } from '@/components/tools/url-encoder/UrlEncoderFaq';
import { UrlEncoderStructuredData } from '@/components/tools/url-encoder/UrlEncoderStructuredData';
import { SpeedQuizIntro } from '@/components/tools/speed-quiz/SpeedQuizIntro';
import { SpeedQuizHowTo } from '@/components/tools/speed-quiz/SpeedQuizHowTo';
import { SpeedQuizFaq } from '@/components/tools/speed-quiz/SpeedQuizFaq';
import { SpeedQuizStructuredData } from '@/components/tools/speed-quiz/SpeedQuizStructuredData';
import { AgeCalculatorIntro } from '@/components/tools/age-calculator/AgeCalculatorIntro';
import { AgeCalculatorHowTo } from '@/components/tools/age-calculator/AgeCalculatorHowTo';
import { AgeCalculatorFaq } from '@/components/tools/age-calculator/AgeCalculatorFaq';
import { AgeCalculatorStructuredData } from '@/components/tools/age-calculator/AgeCalculatorStructuredData';
import { LunarConverterIntro } from '@/components/tools/lunar-converter/LunarConverterIntro';
import { LunarConverterHowTo } from '@/components/tools/lunar-converter/LunarConverterHowTo';
import { LunarConverterFaq } from '@/components/tools/lunar-converter/LunarConverterFaq';
import { LunarConverterStructuredData } from '@/components/tools/lunar-converter/LunarConverterStructuredData';

const LadderGame = dynamic(() =>
  import('@/components/tools/ladder/LadderGame').then((m) => ({
    default: m.LadderGame,
  }))
);

const DailyQuestion = dynamic(() =>
  import('@/components/tools/qna-a-day/DailyQuestion').then((m) => ({
    default: m.DailyQuestion,
  }))
);

const NewWord = dynamic(() =>
  import('@/components/tools/new-word/NewWord').then((m) => ({
    default: m.NewWord,
  }))
);

const UrlEncoder = dynamic(() =>
  import('@/components/tools/url-encoder/UrlEncoder').then((m) => ({
    default: m.UrlEncoder,
  }))
);

const Rankings = dynamic(() =>
  import('@/components/tools/rankings/Rankings').then((m) => ({
    default: m.Rankings,
  }))
);

const Bookmarks = dynamic(() =>
  import('@/components/tools/bookmarks').then((m) => ({
    default: m.Bookmarks,
  }))
);

const SpeedQuiz = dynamic(() =>
  import('@/components/tools/speed-quiz/SpeedQuiz').then((m) => ({
    default: m.SpeedQuiz,
  }))
);

const AgeCalculator = dynamic(() =>
  import('@/components/tools/age-calculator/AgeCalculator').then((m) => ({
    default: m.AgeCalculator,
  }))
);

const LunarConverter = dynamic(() =>
  import('@/components/tools/lunar-converter/LunarConverter').then((m) => ({
    default: m.LunarConverter,
  }))
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.status !== 'live') {
    return {};
  }

  const t = await getTranslations({ locale, namespace: `tools.${slug}` });

  // Each tool exposes its own title/description message keys.
  let title: string;
  let description: string;
  if (slug === 'qna-a-day') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'ladder') {
    title = t('title');
    description = t('lead');
  } else if (slug === 'new-word') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'url-encoder') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'rankings') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'bookmarks') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'speed-quiz') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'age-calculator') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'lunar-converter') {
    title = t('meta.title');
    description = t('meta.description');
  } else {
    return {};
  }

  return buildToolMetadata({ locale, slug, title, description });
}

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

async function ToolContent({ slug, locale }: { slug: string; locale: string }) {
  const tool = getToolBySlug(slug);

  if (!tool || tool.status !== 'live') {
    notFound();
  }

  // Mount tool based on slug
  if (slug === 'ladder') {
    return <LadderGame />;
  }

  if (slug === 'qna-a-day') {
    return <DailyQuestion />;
  }

  if (slug === 'new-word') {
    return <NewWord />;
  }

  if (slug === 'url-encoder') {
    return (
      <>
        <UrlEncoderStructuredData />
        <UrlEncoderIntro />
        <UrlEncoder locale={locale} />
        <UrlEncoderHowTo />
        <UrlEncoderFaq />
      </>
    );
  }

  if (slug === 'rankings') {
    return (
      <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
        <Rankings />
      </Suspense>
    );
  }

  if (slug === 'bookmarks') {
    return (
      <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
        <Bookmarks />
      </Suspense>
    );
  }

  if (slug === 'speed-quiz') {
    return (
      <>
        <SpeedQuizStructuredData />
        <SpeedQuizIntro />
        <SpeedQuiz />
        <SpeedQuizHowTo />
        <SpeedQuizFaq />
      </>
    );
  }

  if (slug === 'age-calculator') {
    return (
      <>
        <AgeCalculatorStructuredData />
        <AgeCalculatorIntro />
        <AgeCalculator />
        <AgeCalculatorHowTo />
        <AgeCalculatorFaq />
      </>
    );
  }

  if (slug === 'lunar-converter') {
    return (
      <>
        <LunarConverterStructuredData />
        <LunarConverterIntro />
        <LunarConverter locale={locale} />
        <LunarConverterHowTo />
        <LunarConverterFaq />
      </>
    );
  }

  notFound();
}

export default async function ToolPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'toolPage' });

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-container px-6 py-16">
        {/* Breadcrumb */}
        <div className="mb-8">
          <a href={`/${locale}`} className="text-brand-ink hover:text-brand-ink-strong">
            ← {t('back')}
          </a>
        </div>

        {/* Tool Content with Error Boundary */}
        <ErrorBoundary
          title={t('errorTitle')}
          body={t('errorBody')}
          actionLabel={t('errorAction')}
        >
          <Suspense fallback={<div className="text-text-secondary">{t('loading')}</div>}>
            <ToolContent slug={slug} locale={locale} />
          </Suspense>
        </ErrorBoundary>

        {/* Ads are inserted automatically by Google AdSense Auto Ads
            (loader in <head>); no manual ad slot is placed here. */}
      </div>
    </div>
  );
}
