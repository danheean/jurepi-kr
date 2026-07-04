'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { OptionSet } from '@/lib/roulette/schema';

export interface SaveLoadPanelProps {
  options: { label: string }[];
  savedSets: OptionSet[];
  onSave: (setName: string) => void;
  onLoad: (setName: string) => void;
  onDelete: (setName: string) => void;
}

export function SaveLoadPanel({
  options,
  savedSets,
  onSave,
  onLoad,
  onDelete,
}: SaveLoadPanelProps) {
  const t = useTranslations('tools.roulette');

  const [saveName, setSaveName] = useState(
    `${t('save.default')} ${savedSets.length + 1}`
  );

  const handleSave = () => {
    if (saveName.trim()) {
      onSave(saveName);
      setSaveName(`${t('save.default')} ${savedSets.length + 2}`);
    }
  };

  const handleSaveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="space-y-6">
      {/* Save section */}
      <div className="space-y-2">
        <label htmlFor="save-input" className="block text-sm font-semibold text-text">
          {t('save.label')}
        </label>
        <div className="flex gap-2">
          <input
            id="save-input"
            type="text"
            data-testid="roulette-save-input"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={handleSaveKeyDown}
            maxLength={50}
            placeholder={t('save.input')}
            className="flex-1 px-3 py-2 border border-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-rose"
          />
          <button
            onClick={handleSave}
            data-testid="roulette-save-button"
            disabled={!saveName.trim()}
            className="px-4 py-2 bg-brand text-on-brand rounded-lg font-semibold disabled:opacity-50 hover:enabled:scale-105 transition-transform"
          >
            {t('save.button')}
          </button>
        </div>
      </div>

      {/* Load section */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text">
          {t('load.label')}
        </label>

        {savedSets.length === 0 ? (
          <p className="text-sm text-text-secondary italic">{t('load.empty')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {savedSets.map((set) => (
              <button
                key={set.name}
                onClick={() => onLoad(set.name)}
                data-testid={`roulette-load-set-${set.name.replace(/\s+/g, '-').toLowerCase()}`}
                className="relative p-3 text-left border border-hairline rounded-lg hover:shadow-sm transition-shadow group"
              >
                <div className="text-sm font-semibold text-text truncate">
                  {set.name}
                </div>
                <div className="text-xs text-text-secondary">
                  {t('load.itemCount', { count: set.options.length })}
                </div>

                {/* Delete button (hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(set.name);
                  }}
                  className="absolute top-2 right-2 text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete ${set.name}`}
                >
                  ✕
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
