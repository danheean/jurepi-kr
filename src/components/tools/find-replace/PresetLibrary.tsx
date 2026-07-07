'use client';

import { useTranslations } from 'next-intl';
import type { Preset } from '@/lib/find-replace';

interface PresetLibraryProps {
  presets: Preset[];
  onSelectPreset: (preset: Preset) => void;
}

/**
 * Display preset buttons. Click any preset to apply it (replaces rules or applies transform).
 */
export function PresetLibrary({ presets, onSelectPreset }: PresetLibraryProps) {
  const t = useTranslations('tools.find-replace');

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text">{t('preset.title')}</h3>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className="px-3 py-2 text-xs font-medium bg-surface-muted text-text rounded-lg hover:bg-surface-sunken transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            data-testid={`preset-${preset.id}`}
          >
            {t(preset.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
