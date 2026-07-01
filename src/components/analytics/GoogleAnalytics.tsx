'use client';

import Script from 'next/script';

/**
 * Google Analytics 4 (gtag.js).
 *
 * Renders nothing unless `NEXT_PUBLIC_GA_ID` is set. Consent is governed by
 * Google Consent Mode v2 (see ConsentMode) together with Google's certified
 * CMP: `analytics_storage` defaults to 'denied' in consent-required regions
 * (EEA/UK/CH) until the user opts in via the CMP, and runs normally elsewhere.
 * There is no custom consent gate.
 *
 * Loaded `afterInteractive` → static-export compatible. GA4 enhanced
 * measurement (on by default) captures SPA route changes without manual wiring.
 */
export function GoogleAnalytics(): React.ReactNode {
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();
  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}
