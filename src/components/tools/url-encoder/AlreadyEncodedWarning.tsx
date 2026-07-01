'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
  visible: boolean;
  onProceed: () => void;
  onCancel: () => void;
}

export function AlreadyEncodedWarning({ visible, onProceed, onCancel }: Props) {
  const t = useTranslations('tools.url-encoder');

  if (!visible) return null;

  return (
    <div
      className="flex gap-3 bg-warning/10 border border-warning/30 rounded-lg p-4"
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-warning-ink flex-shrink-0 mt-0.5" strokeWidth={1.75} />
      <div className="flex-1 space-y-3">
        <p className="text-sm text-text">{t('alreadyEncoded.hint')}</p>
        <div className="flex gap-2">
          <button
            onClick={onProceed}
            className="px-3 py-1.5 text-xs font-medium bg-warning text-white rounded hover:opacity-90 transition"
            aria-label={t('alreadyEncoded.proceed')}
          >
            {t('alreadyEncoded.proceed')}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium bg-surface-muted text-text rounded hover:bg-hairline-strong transition"
            aria-label={t('alreadyEncoded.cancel')}
          >
            {t('alreadyEncoded.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
