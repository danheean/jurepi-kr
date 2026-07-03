'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import type { ConversionError } from '@/lib/lunar-converter/schema';

interface ErrorMessageProps {
  error: ConversionError | null;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  const t = useTranslations('tools.lunar-converter');

  if (!error || !('error' in error)) {
    return null;
  }

  const errorKey = error.error as 'out_of_range' | 'no_leap_month' | 'invalid_date';
  const message = t(`errors.${errorKey}`);

  return (
    <div
      className="flex gap-3 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger-ink"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
