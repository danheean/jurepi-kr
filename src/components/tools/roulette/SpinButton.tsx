'use client';

import { useTranslations } from 'next-intl';

export interface SpinButtonProps {
  disabled: boolean;
  spinning: boolean;
  onClick: () => void;
}

export function SpinButton({ disabled, spinning, onClick }: SpinButtonProps) {
  const t = useTranslations('tools.roulette');

  return (
    <button
      onClick={onClick}
      disabled={disabled || spinning}
      data-testid="roulette-spin-button"
      className="w-full h-14 rounded-lg font-bold text-center text-on-brand bg-brand transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:scale-105 active:enabled:scale-98"
      aria-label={
        disabled
          ? t('spin.disabled')
          : spinning
            ? t('spin.spinning')
            : t('spin.button')
      }
    >
      {spinning ? t('spin.spinning') : t('spin.button')}
    </button>
  );
}
