'use client';

import { useTranslations } from 'next-intl';
import { BarcodeFormat, BarcodeErrorCode } from '@/lib/barcode-generator';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  format: BarcodeFormat;
  error: BarcodeErrorCode | null;
  maxLength?: number;
}

const MAX_LENGTH = 256;
const PLACEHOLDERS: Record<BarcodeFormat, string> = {
  EAN13: 'input.placeholder.ean13',
  UPC: 'input.placeholder.upc',
  CODE39: 'input.placeholder.code39',
  CODE128: 'input.placeholder.code128',
};

export function InputArea({
  value,
  onChange,
  format,
  error,
  maxLength = MAX_LENGTH,
}: InputAreaProps) {
  const t = useTranslations('tools.barcode-generator');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.substring(0, maxLength));
  };

  const getErrorMessage = () => {
    if (!error) return null;
    // Only `lengthError` has format-specific variants in the catalog
    // (invalidCharacter/checksumError/encodingFailed are flat). next-intl
    // doesn't throw for a missing message by default — it renders the raw
    // dotted key as a "graceful" fallback — so a try/catch here would never
    // actually catch anything; branch explicitly instead.
    if (error === 'lengthError' && (format === 'EAN13' || format === 'UPC')) {
      return t(`error.lengthError.${format.toLowerCase()}`);
    }
    return t(`error.${error}`);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="barcode-input"
        className="block text-sm font-medium text-brand-ink"
      >
        {t('input.label')}
      </label>
      <input
        id="barcode-input"
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={t(PLACEHOLDERS[format])}
        maxLength={maxLength}
        className={`
          w-full px-3 py-2 border rounded-md text-base
          bg-surface border-hairline
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
          transition-colors
          ${error ? 'border-danger' : ''}
        `}
        data-testid="barcode-input"
      />

      <div className="flex justify-between items-center text-xs text-text-secondary">
        <div>
          {t('input.charCount', {
            current: value.length,
            max: maxLength,
          })}
        </div>
        {error && (
          <div role="alert" className="text-danger-ink">
            {getErrorMessage()}
          </div>
        )}
      </div>
    </div>
  );
}
