import { useTranslations } from 'next-intl';

/**
 * Base64EncoderHowTo: SSR educational content for SEO.
 * "What is Base64?" long-form explanation.
 * Rendered server-side outside of mounted gate.
 */
export function Base64EncoderHowTo() {
  const t = useTranslations('tools.base64-encoder');
  const howToItems = t.raw('howTo.items') as string[];

  return (
    <section className="space-y-6 py-12">
      <h2 className="text-2xl font-bold text-text">
        {t('howTo.title')}
      </h2>

      <div className="space-y-4 text-text-secondary">
        {howToItems.map((item, idx) => (
          <p key={idx} className="leading-relaxed">
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}
