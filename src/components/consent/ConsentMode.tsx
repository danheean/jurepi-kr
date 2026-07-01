/**
 * Google Consent Mode v2 bootstrap.
 *
 * Rendered in <head> BEFORE the AdSense/GA loaders so the default consent
 * state is set before any Google tag reads it. We deny ad + analytics storage
 * by default ONLY in regions that legally require prior consent (EEA, UK,
 * Switzerland); Google's certified CMP (enabled in the AdSense console under
 * "Privacy & messaging") then updates these signals once the user chooses.
 *
 * No `region` default is set for the rest of the world, so tags run normally
 * there (e.g. Korea) without a blocking consent gate.
 *
 * This is a plain inline <script> (not next/script) so it is emitted verbatim
 * into the static HTML and executes synchronously on parse, guaranteeing it
 * runs before the async adsbygoogle loader.
 */

// EEA + UK + Switzerland — regions where prior consent is required.
const CONSENT_REQUIRED_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH',
];

export function ConsentMode(): React.ReactNode {
  const script = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','wait_for_update':500,'region':${JSON.stringify(
    CONSENT_REQUIRED_REGIONS
  )}});
gtag('set','ads_data_redaction',true);
gtag('set','url_passthrough',true);`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
