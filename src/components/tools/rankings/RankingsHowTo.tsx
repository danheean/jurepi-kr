import { useTranslations } from 'next-intl';

export function RankingsHowTo() {
  const t = useTranslations('tools.rankings.howTo');

  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold text-text">{t('heading')}</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-text">{t('whatIsTitle')}</h3>
          <p className="text-text-secondary leading-relaxed">{t('whatIsBody')}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-lg text-text">{t('howToTitle')}</h3>
          <p className="text-text-secondary leading-relaxed">{t('howToBody')}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-lg text-text">{t('featuresTitle')}</h3>
          <p className="text-text-secondary leading-relaxed">{t('featuresBody')}</p>
        </div>
      </div>
    </section>
  );
}
