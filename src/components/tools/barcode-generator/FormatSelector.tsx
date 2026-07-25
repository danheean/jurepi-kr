'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { BarcodeFormat } from '@/lib/barcode-generator';

interface FormatSelectorProps {
  selectedFormat: BarcodeFormat;
  onChange: (format: BarcodeFormat) => void;
}

const FORMATS: BarcodeFormat[] = ['EAN13', 'UPC', 'CODE39', 'CODE128'];

export function FormatSelector({ selectedFormat, onChange }: FormatSelectorProps) {
  const t = useTranslations('tools.barcode-generator');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

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
      // Roving tabindex (WAI-ARIA APG Tabs pattern): move DOM focus with the
      // selection so it doesn't stay behind on the previously-active tab —
      // .focus() works on a tabIndex=-1 element even before `selectedFormat`
      // re-renders from the parent.
      tabRefs.current[newIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      className="flex gap-2 flex-wrap"
      onKeyDown={handleKeyDown}
    >
      {FORMATS.map((format, index) => (
        <button
          key={format}
          ref={(el) => {
            tabRefs.current[index] = el;
          }}
          role="tab"
          aria-selected={selectedFormat === format}
          tabIndex={selectedFormat === format ? 0 : -1}
          onClick={() => onChange(format)}
          className={`
            min-h-[44px] px-4 py-2 rounded-full font-medium text-sm transition-colors
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
