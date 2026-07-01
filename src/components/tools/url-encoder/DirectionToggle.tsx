'use client';

import { useTranslations } from 'next-intl';
import { ArrowRightLeft } from 'lucide-react';

interface Props {
  value: 'encode' | 'decode';
  onChange: (direction: 'encode' | 'decode') => void;
}

export function DirectionToggle({ value, onChange }: Props) {
  const t = useTranslations('tools.url-encoder');

  return (
    <button
      onClick={() => onChange(value === 'encode' ? 'decode' : 'encode')}
      className="flex items-center gap-2 px-4 py-2 bg-brand text-on-brand rounded-lg font-semibold hover:bg-brand-strong transition-colors"
      aria-label={t('direction.toggle')}
      title={t('direction.toggle')}
    >
      <ArrowRightLeft className="w-5 h-5" strokeWidth={1.75} />
      {value === 'encode' ? t('direction.encode') : t('direction.decode')}
    </button>
  );
}
