'use client';

import { useTranslations } from 'next-intl';
import { BarcodeFormat } from '@/lib/barcode-generator';

interface FormatSelectorProps {
  selectedFormat: BarcodeFormat;
  onChange: (format: BarcodeFormat) => void;
}

const FORMATS: BarcodeFormat[] = ['EAN13', 'UPC', 'CODE39', 'CODE128'];

export function FormatSelector({ selectedFormat, onChange }: FormatSelectorProps) {
  const t = useTranslations('tools.barcode-generator');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = FORMATS.indexOf(selectedFormat);
    let newIndex = currentIndex;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + FORMATS.length) % FORMATS.length;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % FORMATS.length;
    }

    if (newIndex !== currentIndex) {
      onChange(FORMATS[newIndex]);
    }
  };

  return (
    <div
      role="tablist"
      className="flex gap-2 flex-wrap"
      onKeyDown={handleKeyDown}
    >
      {FORMATS.map((format) => (
        <button
          key={format}
          role="tab"
          aria-selected={selectedFormat === format}
          onClick={() => onChange(format)}
          className={`
            px-4 py-2 rounded-full font-medium text-sm transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
            ${
              selectedFormat === format
                ? 'bg-brand text-on-brand'
                : 'bg-surface-muted border border-hairline text-text-secondary'
            }
          `}
          data-testid={`format-tab-${format.toLowerCase()}`}
        >
          {t(`format.${format.toLowerCase()}`)}
        </button>
      ))}
    </div>
  );
}
