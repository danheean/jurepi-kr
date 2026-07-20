import { useTranslations } from 'next-intl';
import { Markdown } from '@/components/markdown';

/**
 * SSR long-form guide (게이트 밖 — 검색·AI 엔진 발견성).
 * howTo.items[]는 각 섹션 제목과 마크다운 설명.
 */
export function LottoGeneratorHowTo() {
  const t = useTranslations('tools.lotto-generator');

  const howToItems = (t.raw('howTo.items') || []) as Array<{
    title: string;
    description: string;
  }>;

  return (
    <section
      aria-labelledby="lotto-generator-howto-heading"
      className="my-12 space-y-6 border-t border-hairline pt-8"
    >
      <h2
        id="lotto-generator-howto-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('howTo.title')}
      </h2>

      <div className="space-y-8">
        {howToItems.map((item, idx) => (
          <article key={idx} className="space-y-3">
            <h3 className="text-xl font-semibold text-text">{item.title}</h3>
            <Markdown>{item.description}</Markdown>
          </article>
        ))}
      </div>
    </section>
  );
}
