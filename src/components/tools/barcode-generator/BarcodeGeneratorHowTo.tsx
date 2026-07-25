'use client';

import { useTranslations } from 'next-intl';

export function BarcodeGeneratorHowTo() {
  const t = useTranslations('tools.barcode-generator');

  return (
    <div className="space-y-8 bg-surface-muted rounded-lg border border-hairline p-6">
      <h2 className="text-2xl font-bold text-brand-ink">{t('howTo.title')}</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-ink mb-2">
            {t('howTo.whatIsTitle')}
          </h3>
          <p className="text-text-secondary leading-relaxed">
            {t('howTo.whatIsBody')}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-brand-ink mb-2">
            {t('howTo.useCasesTitle')}
          </h3>
          <p className="text-text-secondary leading-relaxed">
            {t('howTo.useCasesBody')}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-brand-ink mb-2">
            {t('howTo.tipsTitle')}
          </h3>
          <p className="text-text-secondary leading-relaxed">
            {t('howTo.tipsBody')}
          </p>
        </div>
      </div>
    </div>
  );
}
