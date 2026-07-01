'use client';

import { SlidersHorizontal } from 'lucide-react';
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
      type="button"
      className="inline-flex items-center gap-1.5 rounded-pill border border-hairline-strong bg-surface px-3 py-1.5 text-body-sm font-semibold text-brand-ink transition-colors duration-fast hover:border-brand-soft hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
    >
      <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
      {t('consentReopen')}
    </button>
  );
}
