'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import type { SavedRuleSet } from '@/lib/find-replace';

interface SavedRuleSetsProps {
  savedSets: SavedRuleSet[];
  onSaveRuleSet: (name: string) => void;
  onApplyRuleSet: (name: string) => void;
  onRemoveRuleSet: (name: string) => void;
}

/**
 * Manage saved rule sets: save, apply, delete.
 * Shows empty state when no sets are saved.
 */
export function SavedRuleSets({
  savedSets,
  onSaveRuleSet,
  onApplyRuleSet,
  onRemoveRuleSet,
}: SavedRuleSetsProps) {
  const t = useTranslations('tools.find-replace');
  const [saveNameInput, setSaveNameInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (saveNameInput.trim()) {
      onSaveRuleSet(saveNameInput);
      setSaveNameInput('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveNameInput]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text">{t('savedSets.title')}</h3>

      {/* Save input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={saveNameInput}
          onChange={(e) => setSaveNameInput(e.target.value)}
          placeholder={t('savedSets.saveNamePlaceholder')}
          className="flex-1 px-3 py-2 rounded border border-hairline bg-surface-muted text-text placeholder-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          data-testid="save-ruleset-input"
        />
        <button
          onClick={handleSave}
          disabled={!saveNameInput.trim()}
          className="px-3 py-2 bg-brand text-on-brand rounded font-medium text-sm hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          data-testid="save-ruleset-button"
        >
          {t('savedSets.save')}
        </button>
      </div>

      {/* Saved sets list */}
      {savedSets.length === 0 ? (
        <div className="text-xs text-text-secondary text-center p-2">
          {t('savedSets.empty')}
        </div>
      ) : (
        <div className="space-y-1">
          {savedSets.map((set) => (
            <div
              key={set.name}
              className="bg-surface rounded border border-hairline p-2 flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text truncate">
                  {set.name}
                </div>
                <div className="text-xs text-text-secondary">
                  {set.rules.length} {set.rules.length === 1 ? 'rule' : 'rules'}
                </div>
              </div>
              <button
                onClick={() => onApplyRuleSet(set.name)}
                className="px-2 py-1 text-xs font-medium bg-accent-grape text-on-brand rounded hover:bg-accent-grape/90 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                data-testid={`apply-ruleset-${set.name}`}
              >
                {t('savedSets.apply')}
              </button>
              <button
                onClick={() => onRemoveRuleSet(set.name)}
                className="p-1 text-text-secondary hover:text-danger rounded focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors"
                aria-label={t('savedSets.delete')}
                data-testid={`delete-ruleset-${set.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
