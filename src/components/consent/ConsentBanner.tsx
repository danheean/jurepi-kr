'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useConsent } from './ConsentProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function ConsentBanner(): React.ReactNode {
  const t = useTranslations('consent');
  const { showBanner, accept, decline } = useConsent();
  const prefersReducedMotion = useReducedMotion();

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      role="region"
      aria-label={t('title')}
      aria-live="polite"
    >
      {/* Banner card */}
      <div
        className="relative mx-auto max-w-container px-4 sm:px-6 py-4 sm:py-6 bg-surface border-t border-hairline-strong shadow-card"
        style={{
          animation: prefersReducedMotion
            ? 'none'
            : 'slideUpBanner var(--duration-normal) ease-out forwards',
        }}
      >
        <style>{`
          @keyframes slideUpBanner {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Content */}
          <div className="flex-1">
            <h2 className="font-display text-sm font-bold text-text mb-2">
              {t('title')}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {t('body')}{' '}
              <Link
                href="/privacy"
                className="font-semibold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand"
              >
                {t('learnMore')}
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={decline}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap rounded-md border border-hairline-strong bg-surface text-text-secondary hover:bg-surface-muted active:bg-surface-sunken transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              type="button"
              aria-label={t('decline')}
            >
              {t('decline')}
            </button>
            <button
              onClick={accept}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap rounded-md bg-brand text-on-brand hover:bg-brand-strong active:opacity-90 transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              type="button"
              aria-label={t('accept')}
            >
              {t('accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
