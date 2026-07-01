'use client';

import { useTranslations } from 'next-intl';
import { useConsent } from './ConsentProvider';

export function ConsentReopenButton(): React.ReactNode {
  const t = useTranslations('footer');
  const { reopen } = useConsent();

  return (
    <button
      onClick={reopen}
      className="text-xs sm:text-sm text-text-secondary hover:text-text transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
      type="button"
    >
      {t('consentReopen')}
    </button>
  );
}
