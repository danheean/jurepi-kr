'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

export function ResponsibilityDisclaimer() {
  const t = useTranslations('tools.lotto-generator');

  return (
    <div className="p-4 rounded-lg bg-warning/10 border-l-4 border-warning">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-warning mb-2">{t('disclaimer.heading')}</h3>
          <p className="text-sm text-text">{t('disclaimer.text')}</p>
        </div>
      </div>
    </div>
  );
}
