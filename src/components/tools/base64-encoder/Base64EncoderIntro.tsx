import { useTranslations } from 'next-intl';

/**
 * Base64EncoderIntro: SSR hero section for SEO.
 * Displays eyebrow, H1, and lead text.
 * Rendered server-side outside of mounted gate.
 */
export function Base64EncoderIntro() {
  const t = useTranslations('tools.base64-encoder');

  return (
    <section className="space-y-4 py-12">
      {/* Eyebrow: DEVELOPER TOOL */}
      <p className="text-xs font-bold uppercase tracking-widest text-brand">
        {t('intro.category')}
      </p>

      {/* H1 */}
      <h1 className="text-4xl font-bold text-text">
        {t('intro.heading')}
      </h1>

      {/* Lead paragraph */}
      <p className="text-lg text-text-secondary">
        {t('intro.lead')}
      </p>

      {/* NOTE: Base64 is encoding, not encryption disclaimer will be in FAQ/HowTo */}
    </section>
  );
}
