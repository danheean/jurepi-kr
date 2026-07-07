import { useTranslations } from 'next-intl';
import { BookOpen } from 'lucide-react';

export function HowtoIntro() {
  const t = useTranslations('tools.howto');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-brand" />
        <span className="text-xs font-bold uppercase tracking-wide text-brand">
          {t('intro.eyebrow')}
        </span>
      </div>
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">
          {t('intro.title')}
        </h1>
        <p className="text-lg text-text-secondary">
          {t('intro.lead')}
        </p>
      </div>
    </div>
  );
}
