import { useTranslations } from 'next-intl';

export function QnaHowTo() {
  const t = useTranslations('tools.qna-a-day');

  return (
    <section className="space-y-4 py-12 border-t border-hairline">
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer font-medium text-body-lg text-text hover:text-accent-grape transition-colors">
          <span className="inline-block w-5 h-5 text-accent-grape group-open:rotate-90 transition-transform">
            ▶
          </span>
          {t('howTo.heading')}
        </summary>

        <div className="mt-6 space-y-6 ml-7 text-body text-text-secondary leading-relaxed">
          {/* What section */}
          <div>
            <h3 className="text-body font-semibold text-text mb-2">
              {t('howTo.whatTitle')}
            </h3>
            <p>{t('howTo.whatBody')}</p>
          </div>

          {/* How section */}
          <div>
            <h3 className="text-body font-semibold text-text mb-2">
              {t('howTo.howTitle')}
            </h3>
            <p>{t('howTo.howBody')}</p>
          </div>

          {/* Why section */}
          <div>
            <h3 className="text-body font-semibold text-text mb-2">
              {t('howTo.whyTitle')}
            </h3>
            <p>{t('howTo.whyBody')}</p>
          </div>
        </div>
      </details>
    </section>
  );
}
