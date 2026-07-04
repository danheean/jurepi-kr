import { useTranslations } from 'next-intl';

export function DevPeopleIntro() {
  const t = useTranslations('tools.dev-people.intro');

  return (
    <section className="space-y-4 text-center md:text-left mb-8">
      <p className="text-xs font-bold uppercase tracking-wider text-accent-sky-ink">
        {t('eyebrow')}
      </p>
      <h1 className="text-4xl font-bold text-text leading-tight">{t('title')}</h1>
      <p className="text-lg text-text-secondary max-w-2xl">{t('lead')}</p>
    </section>
  );
}
