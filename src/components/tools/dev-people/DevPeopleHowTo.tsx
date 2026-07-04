import { useTranslations } from 'next-intl';

export function DevPeopleHowTo() {
  const t = useTranslations('tools.dev-people.howTo');

  return (
    <section className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8" aria-labelledby="dev-people-howto-heading">
      <h2 id="dev-people-howto-heading" className="text-2xl font-bold text-text">
        {t('heading')}
      </h2>
      <div className="space-y-6 text-text-secondary">
        <div>
          <h3 className="text-lg font-bold text-text mb-2">{t('whatIsTitle')}</h3>
          <p className="leading-relaxed">{t('whatIsBody')}</p>
        </div>
        <div>
          <h3 className="text-lg font-bold text-text mb-2">{t('howToTitle')}</h3>
          <p className="leading-relaxed">{t('howToBody')}</p>
        </div>
        <div>
          <h3 className="text-lg font-bold text-text mb-2">{t('featuresTitle')}</h3>
          <p className="leading-relaxed">{t('featuresBody')}</p>
        </div>
      </div>
    </section>
  );
}
