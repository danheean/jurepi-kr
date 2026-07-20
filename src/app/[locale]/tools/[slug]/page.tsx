import { getToolBySlug, getLiveTools } from '@/tools/registry';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { buildToolMetadata } from '@/lib/seo';
import guidesData from '@/components/tools/howto/data/guides.generated.json';
import { UrlEncoderHowTo } from '@/components/tools/url-encoder/UrlEncoderHowTo';
import { UrlEncoderFaq } from '@/components/tools/url-encoder/UrlEncoderFaq';
import { UrlEncoderStructuredData } from '@/components/tools/url-encoder/UrlEncoderStructuredData';
import { SpeedQuizHowTo } from '@/components/tools/speed-quiz/SpeedQuizHowTo';
import { SpeedQuizFaq } from '@/components/tools/speed-quiz/SpeedQuizFaq';
import { SpeedQuizStructuredData } from '@/components/tools/speed-quiz/SpeedQuizStructuredData';
import { AgeCalculatorHowTo } from '@/components/tools/age-calculator/AgeCalculatorHowTo';
import { AgeCalculatorFaq } from '@/components/tools/age-calculator/AgeCalculatorFaq';
import { AgeCalculatorStructuredData } from '@/components/tools/age-calculator/AgeCalculatorStructuredData';
import { LunarConverterHowTo } from '@/components/tools/lunar-converter/LunarConverterHowTo';
import { LunarConverterFaq } from '@/components/tools/lunar-converter/LunarConverterFaq';
import { LunarConverterStructuredData } from '@/components/tools/lunar-converter/LunarConverterStructuredData';
import { ShareButtons } from '@/components/share';
import { ToolIntro } from '@/components/tools/shared/ToolIntro';
import { QRCodeHowTo } from '@/components/tools/qr-code/QRCodeHowTo';
import { QRCodeFaq } from '@/components/tools/qr-code/QRCodeFaq';
import { QRCodeStructuredData } from '@/components/tools/qr-code/QRCodeStructuredData';
import { DevPeopleHowTo } from '@/components/tools/dev-people/DevPeopleHowTo';
import { DevPeopleFaq } from '@/components/tools/dev-people/DevPeopleFaq';
import { DevPeopleStructuredData } from '@/components/tools/dev-people/DevPeopleStructuredData';
import { TransparentBgHowTo } from '@/components/tools/transparent-background/TransparentBgHowTo';
import { TransparentBgFaq } from '@/components/tools/transparent-background/TransparentBgFaq';
import { TransparentBgStructuredData } from '@/components/tools/transparent-background/TransparentBgStructuredData';
import { JsonFormatterHowTo } from '@/components/tools/json-formatter/JsonFormatterHowTo';
import { JsonFormatterFaq } from '@/components/tools/json-formatter/JsonFormatterFaq';
import { JsonFormatterStructuredData } from '@/components/tools/json-formatter/JsonFormatterStructuredData';
import { MyIpHowTo } from '@/components/tools/my-ip/MyIpHowTo';
import { MyIpFaq } from '@/components/tools/my-ip/MyIpFaq';
import { MyIpStructuredData } from '@/components/tools/my-ip/MyIpStructuredData';
import { RouletteHowTo } from '@/components/tools/roulette/RouletteHowTo';
import { RouletteFaq } from '@/components/tools/roulette/RouletteFaq';
import { RouletteStructuredData } from '@/components/tools/roulette/RouletteStructuredData';
import { CheerHowTo } from '@/components/tools/cheer/CheerHowTo';
import { CheerFaq } from '@/components/tools/cheer/CheerFaq';
import { CheerStructuredData } from '@/components/tools/cheer/CheerStructuredData';
import { CounterHowTo } from '@/components/tools/character-counter/CounterHowTo';
import { CounterFaq } from '@/components/tools/character-counter/CounterFaq';
import { CounterStructuredData } from '@/components/tools/character-counter/CounterStructuredData';
import { FindReplaceHowTo } from '@/components/tools/find-replace/FindReplaceHowTo';
import { FindReplaceFaq } from '@/components/tools/find-replace/FindReplaceFaq';
import { FindReplaceStructuredData } from '@/components/tools/find-replace/FindReplaceStructuredData';
import { Base64EncoderHowTo } from '@/components/tools/base64-encoder/Base64EncoderHowTo';
import { Base64EncoderFaq } from '@/components/tools/base64-encoder/Base64EncoderFaq';
import { Base64EncoderStructuredData } from '@/components/tools/base64-encoder/Base64EncoderStructuredData';
import { CronParserHowTo } from '@/components/tools/cron-parser/CronParserHowTo';
import { CronParserFaq } from '@/components/tools/cron-parser/CronParserFaq';
import { CronParserStructuredData } from '@/components/tools/cron-parser/CronParserStructuredData';
import { UnitConverterHowTo } from '@/components/tools/unit-converter/UnitConverterHowTo';
import { UnitConverterFaq } from '@/components/tools/unit-converter/UnitConverterFaq';
import { UnitConverterStructuredData } from '@/components/tools/unit-converter/UnitConverterStructuredData';
import { KnittingGaugeHowTo } from '@/components/tools/knitting-gauge/KnittingGaugeHowTo';
import { KnittingGaugeFaq } from '@/components/tools/knitting-gauge/KnittingGaugeFaq';
import { KnittingGaugeStructuredData } from '@/components/tools/knitting-gauge/KnittingGaugeStructuredData';
import { HowtoHowTo } from "@/components/tools/howto/HowtoHowTo";
import { HowtoFaq } from "@/components/tools/howto/HowtoFaq";
import { HowtoStructuredData } from "@/components/tools/howto/HowtoStructuredData";
import { JwtDecoderHowTo } from "@/components/tools/jwt-decoder/JwtDecoderHowTo";
import { JwtDecoderFaq } from "@/components/tools/jwt-decoder/JwtDecoderFaq";
import { JwtDecoderStructuredData } from "@/components/tools/jwt-decoder/JwtDecoderStructuredData";

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

const QRCodeGenerator = dynamic(() =>
  import('@/components/tools/qr-code/QRCodeGenerator').then((m) => ({
    default: m.QRCodeGenerator,
  }))
);

const DevPeople = dynamic(() =>
  import('@/components/tools/dev-people/DevPeople').then((m) => ({
    default: m.DevPeople,
  }))
);

const TransparentBackgroundMaker = dynamic(() =>
  import('@/components/tools/transparent-background/TransparentBackgroundMaker').then((m) => ({
    default: m.TransparentBackgroundMaker,
  }))
);

const RestaurantMap = dynamic(() =>
  import('@/components/tools/restaurant-map/RestaurantMap').then((m) => ({
    default: m.RestaurantMap,
  }))
);

const JsonFormatter = dynamic(() =>
  import('@/components/tools/json-formatter/JsonFormatter').then((m) => ({
    default: m.JsonFormatter,
  }))
);

const MyIp = dynamic(() =>
  import('@/components/tools/my-ip/MyIp').then((m) => ({
    default: m.MyIp,
  }))
);

const Roulette = dynamic(() =>
  import('@/components/tools/roulette/Roulette').then((m) => ({
    default: m.Roulette,
  }))
);

const Cheer = dynamic(() =>
  import('@/components/tools/cheer/Cheer').then((m) => ({
    default: m.Cheer,
  }))
);

const CharacterCounter = dynamic(() =>
  import('@/components/tools/character-counter/CharacterCounter').then((m) => ({
    default: m.CharacterCounter,
  }))
);

const FindReplace = dynamic(() =>
  import('@/components/tools/find-replace/FindReplace').then((m) => ({
    default: m.FindReplace,
  }))
);

const Base64Encoder = dynamic(() =>
  import('@/components/tools/base64-encoder/Base64Encoder').then((m) => ({
    default: m.Base64Encoder,
  }))
);

const CronParser = dynamic(() =>
  import('@/components/tools/cron-parser/CronParser').then((m) => ({
    default: m.CronParser,
  }))
);

const UnitConverter = dynamic(() =>
  import('@/components/tools/unit-converter/UnitConverter').then((m) => ({
    default: m.UnitConverter,
  }))
);

const KnittingGauge = dynamic(() =>
  import('@/components/tools/knitting-gauge/KnittingGauge').then((m) => ({
    default: m.KnittingGauge,
  }))
);

const Howto = dynamic(() =>
  import('@/components/tools/howto/Howto').then((m) => ({
    default: m.Howto,
  }))
);

const JwtDecoder = dynamic(() =>
  import('@/components/tools/jwt-decoder/JwtDecoder').then((m) => ({
    default: m.JwtDecoder,
  }))
);

const LottoGenerator = dynamic(() =>
  import('@/components/tools/lotto-generator/LottoGenerator').then((m) => ({
    default: m.LottoGenerator,
  }))
);

const LottoGeneratorHowTo = dynamic(() =>
  import('@/components/tools/lotto-generator/LottoGeneratorHowTo').then((m) => ({
    default: m.LottoGeneratorHowTo,
  }))
);

const LottoGeneratorFaq = dynamic(() =>
  import('@/components/tools/lotto-generator/LottoGeneratorFaq').then((m) => ({
    default: m.LottoGeneratorFaq,
  }))
);

const LottoGeneratorStructuredData = dynamic(() =>
  import('@/components/tools/lotto-generator/LottoGeneratorStructuredData').then((m) => ({
    default: m.LottoGeneratorStructuredData,
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
  } else if (slug === 'qr-code') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'dev-people') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'transparent-background') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'character-counter') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'find-replace') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'restaurant-map') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'roulette') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'cheer') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'base64-encoder') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'cron-parser') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'unit-converter') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'my-ip') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'json-formatter') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'knitting-gauge') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'howto') {
    // howto's catalog uses top-level title/description (no meta.* block).
    title = t('title');
    description = t('description');
  } else if (slug === 'jwt-decoder') {
    title = t('meta.title');
    description = t('meta.description');
  } else if (slug === 'lotto-generator') {
    title = t('title');
    description = t('description');
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

  // Shared tool-page header — one uniform title area for every tool, rendered
  // at the route level (server) so it lands in the prerendered SEO/GEO HTML.
  const t = await getTranslations({ locale, namespace: `tools.${slug}` });

  return (
    <>
      <ToolIntro
        slug={slug}
        accent={tool.accent}
        eyebrow={t('intro.eyebrow')}
        title={t('intro.title')}
        description={t('intro.lead')}
      />
      <ToolBody slug={slug} locale={locale} />
    </>
  );
}

async function ToolBody({ slug, locale }: { slug: string; locale: string }) {
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
        <LunarConverter locale={locale} />
        <LunarConverterHowTo />
        <LunarConverterFaq />
      </>
    );
  }

  if (slug === 'qr-code') {
    return (
      <>
        <QRCodeStructuredData />
        <QRCodeGenerator locale={locale} />
        <QRCodeHowTo />
        <QRCodeFaq />
      </>
    );
  }

  if (slug === 'dev-people') {
    return (
      <>
        <DevPeopleStructuredData />
        <DevPeople />
        <DevPeopleHowTo />
        <DevPeopleFaq />
      </>
    );
  }

  if (slug === 'transparent-background') {
    return (
      <>
        <TransparentBgStructuredData />
        <TransparentBackgroundMaker />
        <TransparentBgHowTo />
        <TransparentBgFaq />
      </>
    );
  }

  if (slug === 'roulette') {
    return (
      <>
        <RouletteStructuredData />
        <Roulette />
        <RouletteHowTo />
        <RouletteFaq />
      </>
    );
  }

  if (slug === 'lotto-generator') {
    return (
      <>
        <LottoGeneratorStructuredData />
        <LottoGenerator />
        <LottoGeneratorHowTo />
        <LottoGeneratorFaq />
      </>
    );
  }

  if (slug === 'cheer') {
    return (
      <>
        <CheerStructuredData />
        <Cheer />
        <CheerHowTo />
        <CheerFaq />
      </>
    );
  }

  if (slug === 'character-counter') {
    return (
      <>
        <CounterStructuredData />
        <CharacterCounter />
        <CounterHowTo />
        <CounterFaq />
      </>
    );
  }

  if (slug === 'find-replace') {
    return (
      <>
        <FindReplaceStructuredData />
        <FindReplace />
        <FindReplaceHowTo />
        <FindReplaceFaq />
      </>
    );
  }

  if (slug === 'restaurant-map') {
    return <RestaurantMap />;
  }

  if (slug === 'base64-encoder') {
    return (
      <>
        <Base64EncoderStructuredData />
        <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
          <Base64Encoder locale={locale} />
        </Suspense>
        <Base64EncoderHowTo />
        <Base64EncoderFaq />
        <ShareButtons />
      </>
    );
  }

  if (slug === 'cron-parser') {
    return (
      <>
        <CronParserStructuredData />
        <CronParser />
        <CronParserHowTo />
        <CronParserFaq />
      </>
    );
  }

  if (slug === 'unit-converter') {
    return (
      <>
        <UnitConverterStructuredData />
        <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
          <UnitConverter locale={locale} />
        </Suspense>
        <UnitConverterHowTo />
        <UnitConverterFaq />
      </>
    );
  }

  if (slug === 'my-ip') {
    return (
      <>
        <MyIpStructuredData />
        <MyIp />
        <MyIpHowTo />
        <MyIpFaq />
      </>
    );
  }

  if (slug === 'json-formatter') {
    return (
      <>
        <JsonFormatterStructuredData />
        <JsonFormatter />
        <JsonFormatterHowTo />
        <JsonFormatterFaq />
      </>
    );
  }

  if (slug === 'knitting-gauge') {
    return (
      <>
        <KnittingGaugeStructuredData />
        <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
          <KnittingGauge />
        </Suspense>
        <KnittingGaugeHowTo />
        <KnittingGaugeFaq />
      </>
    );
  }


  if (slug === 'howto') {
    return (
      <>
        <HowtoStructuredData catalog={guidesData as any} />
        <Suspense fallback={<div className="text-text-secondary">Loading...</div>}>
          <Howto />
        </Suspense>
        <HowtoHowTo />
        <HowtoFaq />
      </>
    );
  }

  if (slug === 'jwt-decoder') {
    return (
      <>
        <JwtDecoderStructuredData />
        <JwtDecoder />
        <JwtDecoderHowTo />
        <JwtDecoderFaq />
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
        {/* Breadcrumb + SNS share (share is part of the tool-page template:
            every current and future tool gets it automatically) */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <a
            href={`/${locale}`}
            className="inline-flex min-h-[44px] items-center text-brand-ink hover:text-brand-ink-strong"
          >
            ← {t('back')}
          </a>
          <ShareButtons />
        </div>

        {/* Tool Content with Error Boundary. The tool's title area (avatar +
            eyebrow + H1 + lead) is rendered uniformly by <ToolIntro> at the top
            of <ToolContent> — see ToolIntro. */}
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
