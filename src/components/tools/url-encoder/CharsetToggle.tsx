'use client';

import { useTranslations } from 'next-intl';

interface Props {
  value: 'utf-8' | 'euc-kr';
  onChange: (charset: 'utf-8' | 'euc-kr') => void;
  isLoading?: boolean;
}

// Map internal charset values to the frozen i18n key names (no hyphen).
const CHARSET_LABEL_KEY = {
  'utf-8': 'charset.utf8',
  'euc-kr': 'charset.euckr',
} as const;

export function CharsetToggle({ value, onChange, isLoading }: Props) {
  const t = useTranslations('tools.url-encoder');

  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-semibold text-text">{t('charset.label')}</legend>
      <div className="flex gap-2">
        {(['utf-8', 'euc-kr'] as const).map((charset) => (
          <button
            key={charset}
            onClick={() => onChange(charset)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === charset
                ? 'bg-accent-grape text-white'
                : 'bg-surface-muted text-text hover:bg-hairline-strong'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-pressed={value === charset}
            aria-label={t(CHARSET_LABEL_KEY[charset])}
          >
            {t(CHARSET_LABEL_KEY[charset])}
          </button>
        ))}
      </div>
      <p className="text-xs text-text-secondary">{t('charset.help')}</p>
    </fieldset>
  );
}
