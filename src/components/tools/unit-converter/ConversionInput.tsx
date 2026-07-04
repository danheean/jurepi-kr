'use client';

import { useTranslations } from 'next-intl';

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

/**
 * ConversionInput: Number input with validation feedback.
 */
export function ConversionInput({ value, onChange, error }: Props) {
  const t = useTranslations('tools.unit-converter');

  return (
    <div>
      <label htmlFor="unit-conversion-input" className="block text-sm font-medium text-text mb-2">
        {t('conversionInput.label')}
      </label>
      <div>
        <input
          id="unit-conversion-input"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('conversionInput.placeholder')}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-colors
            font-medium text-base
            placeholder:text-text-muted
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
            ${
              error
                ? 'border-danger/50 bg-danger/5 text-text'
                : 'border-hairline bg-surface hover:border-hairline-strong'
            }
          `}
        />
        {error && (
          <div
            aria-live="polite"
            role="alert"
            className="mt-2 text-sm text-danger-ink font-medium"
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
