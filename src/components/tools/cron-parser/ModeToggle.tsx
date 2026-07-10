'use client';

import { useTranslations } from 'next-intl';

interface ModeToggleProps {
  mode: 'unix' | 'quartz';
  onChange: (mode: 'unix' | 'quartz') => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const t = useTranslations('tools.cron-parser');

  const handleModeChange = (newMode: 'unix' | 'quartz') => {
    if (newMode !== mode) {
      onChange(newMode);
    }
  };

  const segmentClass = (active: boolean): string =>
    `px-4 py-2 min-h-[44px] rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand ${
      active
        ? 'bg-brand text-on-brand'
        : 'bg-surface-muted border border-hairline text-text hover:bg-surface-sunken'
    }`;

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-text">
        {t('mode.label')}
      </span>
      <div role="group" aria-label={t('mode.label')} className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('unix')}
          aria-pressed={mode === 'unix'}
          className={segmentClass(mode === 'unix')}
        >
          {t('mode.unix')}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('quartz')}
          aria-pressed={mode === 'quartz'}
          className={segmentClass(mode === 'quartz')}
        >
          {t('mode.quartz')}
        </button>
      </div>
    </div>
  );
}
