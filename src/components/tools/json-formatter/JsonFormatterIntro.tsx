import { useTranslations } from 'next-intl';
import { Braces } from 'lucide-react';

export function JsonFormatterIntro() {
  const t = useTranslations('tools.json-formatter');

  return (
    <section
      className="space-y-4 mb-12 pb-8 border-b border-surface-muted"
      aria-labelledby="json-formatter-heading"
    >
      {/* Eyebrow */}
      <p className="text-xs font-bold text-brand uppercase tracking-wide">
        {t('intro.eyebrow')}
      </p>

      {/* Heading */}
      <h1
        id="json-formatter-heading"
        className="text-4xl sm:text-5xl font-bold text-text"
      >
        {t('intro.title')}
      </h1>

      {/* Lead */}
      <p className="text-lg text-text-secondary max-w-2xl">
        {t('intro.lead')}
      </p>
    </section>
  );
}
