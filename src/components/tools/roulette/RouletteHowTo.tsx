import { useTranslations } from 'next-intl';
import { Markdown } from '@/components/markdown';

/**
 * SSR long-form guide (게이트 밖 — 검색·AI 엔진 발견성).
 * howTo.content는 마크다운 문자열 — 공유 Markdown 렌더러 사용.
 */
export function RouletteHowTo() {
  const t = useTranslations('tools.roulette');

  return (
    <section
      aria-labelledby="roulette-howto-heading"
      className="my-12 space-y-6 border-t border-hairline pt-8"
    >
      <h2
        id="roulette-howto-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('howTo.title')}
      </h2>

      <Markdown>{t('howTo.content')}</Markdown>
    </section>
  );
}
