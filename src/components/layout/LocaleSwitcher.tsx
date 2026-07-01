'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

export function LocaleSwitcher(): React.ReactNode {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleLocaleSwitch = (newLocale: 'ko' | 'en') => {
    // Preserve the current query string. Read it from the client at click time
    // (instead of useSearchParams) so the shell stays statically rendered.
    const queryString =
      typeof window !== 'undefined'
        ? window.location.search.replace(/^\?/, '')
        : '';
    const href = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(href, { locale: newLocale });
  };

  const baseClasses = 'inline-flex items-center justify-center min-h-11 px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2';
  const activeClasses = 'text-brand-ink font-semibold';
  const inactiveClasses = 'text-text hover:text-brand-ink';

  return (
    <div className="flex items-center gap-px">
      <button
        onClick={() => handleLocaleSwitch('ko')}
        aria-label={t('header.localeKo')}
        aria-current={locale === 'ko' ? 'true' : undefined}
        className={`${baseClasses} ${locale === 'ko' ? activeClasses : inactiveClasses}`}
        data-testid="locale-ko"
      >
        KO
      </button>
      <span className="text-hairline">|</span>
      <button
        onClick={() => handleLocaleSwitch('en')}
        aria-label={t('header.localeEn')}
        aria-current={locale === 'en' ? 'true' : undefined}
        className={`${baseClasses} ${locale === 'en' ? activeClasses : inactiveClasses}`}
        data-testid="locale-en"
      >
        EN
      </button>
    </div>
  );
}
