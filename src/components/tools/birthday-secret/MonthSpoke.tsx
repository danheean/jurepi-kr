import { useLocale, useTranslations } from 'next-intl';
import { Markdown } from '@/components/markdown';
import type { MergedMonth, MergedStone, MergedFlower, Locale } from '@/lib/birthday-secret/schema';
import { googleImageUrl } from '@/lib/birthday-secret/external-links';

interface MonthSpokeProps {
  month: MergedMonth;
  stone: MergedStone;
  flowerSamples: MergedFlower[];
  prevSlug: string;
  nextSlug: string;
}

/** Server-rendered spoke content for one month (gate-outside SSR). */
export function MonthSpoke({ month, stone, flowerSamples, prevSlug, nextSlug }: MonthSpokeProps) {
  const t = useTranslations('tools.birthday-secret');
  const locale = useLocale() as Locale;
  const m = month[locale];
  const s = stone[locale];

  return (
    <article className="space-y-8">
      <h1 className="font-display text-display-lg font-bold text-text">{m.title}</h1>

      {/* Long-form body */}
      <Markdown className="space-y-4 leading-relaxed text-text-secondary">{m.body}</Markdown>

      {/* Stone facts panel */}
      <section className="rounded-2xl border border-hairline bg-surface-muted p-5">
        <h2 className="text-lg font-bold text-text">💎 {s.name}</h2>
        <p className="mt-1 text-text-secondary">{s.meaning}</p>
        <p className="mt-2 text-sm text-text-muted">
          {t('result.colorName')}: {s.color} · {t('result.hardness')}: {s.hardness} · {t('result.origin')}: {s.origin}
        </p>
        <a
          href={googleImageUrl(stone.googleQuery[locale])}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-[36px] items-center rounded font-medium text-accent-rose-ink underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {t('result.googleImage')}
        </a>
      </section>

      {/* Representative flowers */}
      {flowerSamples.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-text">🌸 {t('spoke.flowerHeading')}</h2>
          <ul className="space-y-1 text-text-secondary">
            {flowerSamples.map((f) => (
              <li key={f.key}>
                <span className="font-semibold text-text">{f[locale].name}</span>
                {f[locale].meaning ? ` — ${f[locale].meaning}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related months + hub */}
      <nav aria-label={t('spoke.related')} className="flex flex-wrap items-center gap-3 border-t border-hairline pt-6">
        <a
          href={`/${locale}/tools/birthday-secret/${prevSlug}`}
          className="min-h-[44px] rounded-xl border border-hairline px-4 py-2 font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          ‹ {t(`months.${prevSlug}`)}
        </a>
        <a
          href={`/${locale}/tools/birthday-secret/${nextSlug}`}
          className="min-h-[44px] rounded-xl border border-hairline px-4 py-2 font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {t(`months.${nextSlug}`)} ›
        </a>
        <a
          href={`/${locale}/tools/birthday-secret`}
          className="min-h-[44px] rounded-xl bg-brand px-4 py-2 font-semibold text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {t('spoke.viewTool')}
        </a>
      </nav>

      <p className="text-xs text-text-muted">{t('spoke.disclaimer')}</p>
    </article>
  );
}
