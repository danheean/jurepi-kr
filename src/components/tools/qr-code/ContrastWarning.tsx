'use client';

import { AlertCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  isVisible: boolean;
  contrastValue: number;
  onConfirm?: () => void;
}

export function ContrastWarning({ isVisible, contrastValue, onConfirm }: Props) {
  const t = useTranslations('tools.qr-code');

  if (!isVisible) return null;

  return (
    <div className="rounded-md bg-surface-muted border border-warning p-4 space-y-2">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-warning-ink flex-shrink-0 mt-0.5" />
        <p className="text-sm text-warning-ink">{t('warnings.lowContrast')}</p>
      </div>
      <p className="text-xs text-text-secondary ml-8">
        {t('colors.contrast', { value: contrastValue })}
      </p>
    </div>
  );
}
