'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

export function LocaleSwitcher(): React.ReactNode {
  const t = useTranslations();
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

  return (
    <div className="flex items-center gap-px">
      <button
        onClick={() => handleLocaleSwitch('ko')}
        aria-label={t('header.localeAria')}
        className="px-3 py-2 text-sm font-medium transition-colors duration-150 text-text hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        data-testid="locale-ko"
      >
        KO
      </button>
      <span className="text-hairline">|</span>
      <button
        onClick={() => handleLocaleSwitch('en')}
        aria-label={t('header.localeAria')}
        className="px-3 py-2 text-sm font-medium transition-colors duration-150 text-text hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        data-testid="locale-en"
      >
        EN
      </button>
    </div>
  );
}
