'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FIELD_RANGES, MONTH_NAMES, DAY_NAMES } from '@/lib/cron-parser';

export function CronCheatsheet() {
  const t = useTranslations('tools.cron-parser');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
      className="bg-surface border border-hairline rounded-lg p-6 space-y-4"
    >
      <summary className="cursor-pointer font-medium text-text text-lg hover:text-brand">
        {t('cheatsheetLabel')}
      </summary>

      <div className="space-y-6 text-sm text-text-secondary">
        {/* Field definitions */}
        <div>
          <h3 className="font-semibold text-text mb-3">
            {t('fieldsHeading')}
          </h3>
          <div className="space-y-2 font-mono text-xs">
            {(['minute', 'hour', 'dom', 'month', 'dow'] as const).map((field) => {
              const range = FIELD_RANGES[field];
              return (
                <div key={field} className="flex gap-3">
                  <span className="font-semibold text-text w-20">{field}:</span>
                  <span>{range.min}–{range.max}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Special syntax */}
        <div>
          <h3 className="font-semibold text-text mb-3">
            {t('syntax', { defaultValue: 'Syntax' })}
          </h3>
          <div className="space-y-2 font-mono text-xs">
            <div>
              <span className="font-semibold text-text">*</span> = All values
            </div>
            <div>
              <span className="font-semibold text-text">1-5</span> = Range
            </div>
            <div>
              <span className="font-semibold text-text">*/15</span> = Every 15th
            </div>
            <div>
              <span className="font-semibold text-text">1,3,5</span> = List
            </div>
          </div>
        </div>

        {/* Common names */}
        <div>
          <h3 className="font-semibold text-text mb-3">
            {t('names', { defaultValue: 'Names' })}
          </h3>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div>
              <span className="font-semibold text-text block mb-1">
                {t('months', { defaultValue: 'Months' })}
              </span>
              <span>{MONTH_NAMES.join(', ')}</span>
            </div>
            <div>
              <span className="font-semibold text-text block mb-1">
                {t('days', { defaultValue: 'Days' })}
              </span>
              <span>{DAY_NAMES.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
