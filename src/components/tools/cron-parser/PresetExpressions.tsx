'use client';

import { useTranslations } from 'next-intl';
import { PRESET_EXPRESSIONS, QUARTZ_PRESETS } from '@/lib/cron-parser';

interface PresetExpressionsProps {
  mode?: 'unix' | 'quartz';
  onSelect: (expression: string) => void;
}

export function PresetExpressions({ mode = 'unix', onSelect }: PresetExpressionsProps) {
  const t = useTranslations('tools.cron-parser');
  const presets = mode === 'quartz' ? QUARTZ_PRESETS : PRESET_EXPRESSIONS;

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelect(preset.expression)}
          className="min-h-[44px] px-3 py-2 rounded-lg border border-hairline bg-surface hover:bg-surface-muted text-text text-sm font-medium transition-all duration-200 motion-safe:active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring"
          aria-label={t(preset.descriptionKey)}
        >
          {t(preset.descriptionKey)}
        </button>
      ))}
    </div>
  );
}
