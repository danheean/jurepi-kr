import { useTranslations } from 'next-intl';

export function QnaIntro() {
  const t = useTranslations('tools.qna-a-day');

  return (
    <section className="space-y-4 mb-12">
      <div className="text-xs font-semibold uppercase tracking-widest text-accent-grape">
        {t('intro.eyebrow')}
      </div>

      <h1 className="text-headline font-gmarket font-bold clamp-headline">
        {t('intro.title')}
      </h1>

      <p className="text-body-lg text-text-secondary leading-relaxed">
        {t('intro.lead')}
      </p>
    </section>
  );
}
