import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import koMessages from '@/i18n/messages/ko.json';
import enMessages from '@/i18n/messages/en.json';

// Real catalogs (not a hand-maintained subset) — a mock catalog can drift from
// the actual keys (e.g. missing `howTo`, mismatched `empty.noResults` interpolation)
// while every test still stays green. Import the whole locale file so any key
// used by a component either resolves for real or fails loudly (MISSING_MESSAGE).
const messagesByLocale: Record<string, any> = {
  ko: koMessages,
  en: enMessages,
};

interface IntlProviderProps {
  children: ReactNode;
  locale?: string;
}

export function IntlProvider({ children, locale = 'en' }: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string;
}

export function renderWithIntl(ui: ReactNode, { locale = 'en', ...options }: CustomRenderOptions = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <IntlProvider locale={locale}>
        {children}
      </IntlProvider>
    ),
    ...options,
  });
}

export * from '@testing-library/react';
