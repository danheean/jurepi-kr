'use client';

import { useTranslations } from 'next-intl';

/**
 * Reopens Google's certified consent message (AdSense "Privacy & messaging"),
 * letting users change their ad/analytics consent after their first choice.
 * Uses the Funding Choices API exposed by the adsbygoogle loader. If no message
 * has been shown (e.g. outside consent-required regions, or before the message
 * is enabled in the AdSense console), the call is a safe no-op.
 */
export function ConsentReopenButton(): React.ReactNode {
  const t = useTranslations('footer');

  const reopen = () => {
    if (typeof window === 'undefined') {
      return;
    }
    const w = window as unknown as {
      googlefc?: {
        callbackQueue?: Array<unknown>;
        showRevocationMessage?: () => void;
      };
    };
    w.googlefc = w.googlefc || {};
    w.googlefc.callbackQueue = w.googlefc.callbackQueue || [];
    w.googlefc.callbackQueue.push(() => w.googlefc?.showRevocationMessage?.());
  };

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
