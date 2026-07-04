'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { type FormatOptions } from '@/lib/json-formatter';

interface FormatOptionsProps {
  indent: FormatOptions['indent'];
  sortKeys: boolean;
  isValid: boolean;
  onIndentChange: (indent: FormatOptions['indent']) => void;
  onSortKeysToggle: () => void;
  onFormat: () => void;
  onMinify: () => void;
  onClear: () => void;
}

export function FormatOptions({
  indent,
  sortKeys,
  isValid,
  onIndentChange,
  onSortKeysToggle,
  onFormat,
  onMinify,
  onClear,
}: FormatOptionsProps) {
  const t = useTranslations('tools.json-formatter');

  return (
    <div className="space-y-4">
      {/* Indent Selection */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 min-w-0">
          <label className="text-sm font-medium text-text block mb-2">
            {t('options.indent')}
          </label>
          <div className="flex gap-2">
            {(['2', '4', 'tab'] as const).map((value) => (
              <button
                key={value}
                onClick={() => onIndentChange(value)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    indent === value
                      ? 'bg-brand text-on-brand'
                      : 'bg-surface-muted text-text hover:bg-hairline-strong'
                  }
                `}
                type="button"
              >
                {value === '2'
                  ? t('options.spaces2')
                  : value === '4'
                    ? t('options.spaces4')
                    : t('options.tab')}
              </button>
            ))}
          </div>
        </div>

        {/* Status Icon */}
        <div className="flex items-center gap-2">
          {isValid ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="text-sm text-text-secondary">
                {t('options.statusValid')}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-danger" />
              <span className="text-sm text-text-secondary">
                {t('options.statusInvalid')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Sort Keys Toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={sortKeys}
            onChange={onSortKeysToggle}
            className="w-4 h-4 rounded border-surface-muted focus:ring-2 focus:ring-brand"
          />
          <span className="ml-2 text-sm font-medium text-text">
            {t('options.sortKeys')}
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onFormat}
          variant="primary"
          className="flex-1 sm:flex-none"
        >
          {t('actions.format')}
        </Button>
        <Button
          onClick={onMinify}
          variant="secondary"
          className="flex-1 sm:flex-none"
        >
          {t('actions.minify')}
        </Button>
        <Button
          onClick={onClear}
          variant="ghost"
          className="flex-1 sm:flex-none"
        >
          {t('actions.clear')}
        </Button>
      </div>
    </div>
  );
}
