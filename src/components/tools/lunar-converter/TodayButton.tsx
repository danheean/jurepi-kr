'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useCallback } from 'react';
import { Calendar } from 'lucide-react';

interface TodayButtonProps {
  onSetToday: (year: number, month: number, day: number) => void;
}

export function TodayButton({ onSetToday }: TodayButtonProps) {
  const t = useTranslations('tools.lunar-converter');
  const locale = useLocale();

  const handleClick = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    onSetToday(year, month, day);
  }, [onSetToday]);

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm bg-accent-grape text-white hover:bg-accent-grape-ink transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-grape"
      aria-label={t('today')}
    >
      <Calendar className="w-4 h-4" />
      {t('today')}
    </button>
  );
}
