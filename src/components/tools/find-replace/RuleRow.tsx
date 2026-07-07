'use client';

import { useTranslations } from 'next-intl';
import { Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import type { Rule, InvalidPatternError } from '@/lib/find-replace';

interface RuleRowProps {
  rule: Rule;
  index: number;
  totalRules: number;
  ruleCount?: number; // Number of replacements for this rule
  error?: InvalidPatternError; // Error, if any
  onUpdate: (updates: Partial<Rule>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
}

/**
 * A single find-replace rule row.
 * Inputs are CONTROLLED so typing works. Option toggles show aria-pressed.
 * Per-rule count badge and error display.
 */
export function RuleRow({
  rule,
  index,
  totalRules,
  ruleCount = 0,
  error,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
}: RuleRowProps) {
  const t = useTranslations('tools.find-replace');

  return (
    <div className="bg-surface rounded-lg border border-hairline p-3 space-y-3">
      {/* Find & Replace inputs */}
      <div className="space-y-2">
        <input
          type="text"
          value={rule.find}
          onChange={(e) => onUpdate({ find: e.target.value })}
          placeholder={t('rule.find.placeholder')}
          aria-label={t('rule.find.label')}
          className="w-full px-3 py-2 rounded border border-hairline bg-surface-muted text-text placeholder-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          data-testid={`rule-find-${rule.id}`}
        />
        <input
          type="text"
          value={rule.replace}
          onChange={(e) => onUpdate({ replace: e.target.value })}
          placeholder={t('rule.replace.placeholder')}
          aria-label={t('rule.replace.label')}
          className="w-full px-3 py-2 rounded border border-hairline bg-surface-muted text-text placeholder-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          data-testid={`rule-replace-${rule.id}`}
        />
      </div>

      {/* Option toggles. `field` is the Rule property to flip (note: regex → isRegex),
          `i18n` is the option namespace for label/description. */}
      <div className="flex flex-wrap gap-2">
        {([
          { field: 'caseSensitive', i18n: 'caseSensitive', icon: 'Aa' },
          { field: 'wholeWord', i18n: 'wholeWord', icon: 'W' },
          { field: 'isRegex', i18n: 'regex', icon: '.*' },
          { field: 'firstOnly', i18n: 'firstOnly', icon: '1' },
        ] as const).map((opt) => {
          const active = Boolean((rule as Record<string, unknown>)[opt.field]);
          return (
            <button
              key={opt.field}
              onClick={() => onUpdate({ [opt.field]: !active } as Partial<Rule>)}
              aria-pressed={active}
              aria-label={t(`option.${opt.i18n}.label`)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                active
                  ? 'bg-brand text-on-brand'
                  : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
              } focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2`}
              title={t(`option.${opt.i18n}.description`)}
              data-testid={`rule-toggle-${opt.field}-${rule.id}`}
            >
              {opt.icon}
            </button>
          );
        })}
      </div>

      {/* Flags input (shown only when regex is ON) */}
      {rule.isRegex && (
        <input
          type="text"
          value={rule.flags || ''}
          onChange={(e) => onUpdate({ flags: e.target.value || undefined })}
          placeholder={t('option.flags.label')}
          aria-label={t('option.flags.label')}
          className="w-full px-3 py-2 rounded border border-hairline bg-surface-muted text-text text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          maxLength={6}
          data-testid={`rule-flags-${rule.id}`}
        />
      )}

      {/* Per-rule count badge */}
      {!error && ruleCount > 0 && (
        <div className="text-xs text-text-secondary">
          {t('rule.count', { count: ruleCount })}
        </div>
      )}

      {/* Per-rule error display */}
      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded px-2 py-1 text-xs text-danger-ink space-y-1">
          <div className="font-medium">{t('error.invalidRegex')}</div>
          <div>{t('error.invalidRegexDetail', { detail: error.message })}</div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onUpdate({ enabled: !rule.enabled })}
          aria-pressed={rule.enabled}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            rule.enabled
              ? 'bg-accent-grape text-on-brand'
              : 'bg-surface-muted text-text-secondary'
          } focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2`}
          title={t('rule.enable')}
          data-testid={`rule-enable-${rule.id}`}
        >
          ✓
        </button>
        <button
          onClick={onDuplicate}
          className="p-1 text-text-secondary hover:text-text rounded focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors"
          title={t('rule.duplicate')}
          aria-label={t('rule.duplicate')}
          data-testid={`rule-duplicate-${rule.id}`}
        >
          <Copy size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-text-secondary hover:text-danger rounded focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors"
          title={t('rule.delete')}
          aria-label={t('rule.delete')}
          data-testid={`rule-delete-${rule.id}`}
        >
          <Trash2 size={16} />
        </button>
        {index > 0 && (
          <button
            onClick={onMoveUp}
            className="p-1 text-text-secondary hover:text-text rounded focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors"
            title={t('rule.moveUp')}
            aria-label={t('rule.moveUp')}
            data-testid={`rule-moveup-${rule.id}`}
          >
            <ChevronUp size={16} />
          </button>
        )}
        {index < totalRules - 1 && (
          <button
            onClick={onMoveDown}
            className="p-1 text-text-secondary hover:text-text rounded focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors"
            title={t('rule.moveDown')}
            aria-label={t('rule.moveDown')}
            data-testid={`rule-movedown-${rule.id}`}
          >
            <ChevronDown size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
