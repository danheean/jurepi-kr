import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';

export function RestaurantMapIntro() {
  const t = useTranslations('tools.restaurant-map');

  return (
    <header className="space-y-4 px-4 py-8">
      <div className="flex items-center gap-2">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-ink">
          {t('intro.eyebrow')}
        </span>
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-text">{t('title')}</h1>
        <p className="text-lg text-text-secondary">{t('intro.lead')}</p>
      </div>
    </header>
  );
}
