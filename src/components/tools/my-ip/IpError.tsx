'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, WifiOff } from 'lucide-react';
import type { FetchErrorCode } from '@/lib/my-ip/schema';

interface IpErrorProps {
  error: FetchErrorCode;
  onRetry: () => void;
  isLoading?: boolean;
}

export function IpError({ error, onRetry, isLoading = false }: IpErrorProps) {
  const t = useTranslations('tools.my-ip');

  const message = t(`errors.${error}`);
  const isNetworkError = error === 'NETWORK_ERROR';
  const Icon = isNetworkError ? WifiOff : AlertCircle;

  return (
    <div
      className="flex flex-col items-center gap-4 p-6 bg-danger/10 border border-danger/30 rounded-lg"
      role="alert"
      aria-live="assertive"
    >
      <Icon className="w-8 h-8 text-danger-ink flex-shrink-0" />
      <p className="text-text-secondary text-center text-sm font-medium">{message}</p>
      <button
        onClick={onRetry}
        disabled={isLoading}
        className="px-4 py-2 bg-danger-ink text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label={t('errors.retry')}
      >
        {t('errors.retry')}
      </button>
    </div>
  );
}
