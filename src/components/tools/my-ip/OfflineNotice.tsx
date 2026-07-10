'use client';

import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';

export function OfflineNotice() {
  const t = useTranslations('tools.my-ip');

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-5 h-5 text-warning-ink flex-shrink-0" />
        <p className="text-text-secondary text-sm font-medium">{t('offline.notice')}</p>
      </div>
    </div>
  );
}
