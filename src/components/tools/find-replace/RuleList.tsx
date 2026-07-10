'use client';

import { useTranslations } from 'next-intl';
import { RuleRow } from './RuleRow';
import type { Rule, ApplyRulesResult } from '@/lib/find-replace';

interface RuleListProps {
  rules: Rule[];
  applyResult: ApplyRulesResult;
  onAddRule: () => void;
  onUpdateRule: (index: number, updates: Partial<Rule>) => void;
  onRemoveRule: (index: number) => void;
  onReorderRule: (from: number, to: number) => void;
  onDuplicateRule: (index: number) => void;
  onToggleRuleEnabled: (index: number) => void;
}

/**
 * Container for rule rows. Shows ruleList.description for transparency.
 * Empty state when rules.length === 0 (shouldn't happen — hook keeps 1 rule minimum).
 * Add-rule button at the bottom.
 */
export function RuleList({
  rules,
  applyResult,
  onAddRule,
  onUpdateRule,
  onRemoveRule,
  onReorderRule,
  onDuplicateRule,
  onToggleRuleEnabled,
}: RuleListProps) {
  const t = useTranslations('tools.find-replace');

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-text">{t('ruleList.title')}</h3>
        <p className="text-xs text-text-secondary mt-1">{t('ruleList.description')}</p>
      </div>

      {rules.length === 0 ? (
        <div className="bg-surface rounded-lg border border-hairline p-4 text-center text-sm text-text-secondary">
          {t('ruleList.empty')}
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, idx) => {
            const perRuleResult = applyResult.perRuleCounts.find(
              (r) => r.ruleId === rule.id
            );
            return (
              <RuleRow
                key={rule.id}
                rule={rule}
                index={idx}
                totalRules={rules.length}
                ruleCount={perRuleResult?.count}
                error={perRuleResult?.error}
                onUpdate={(updates) => onUpdateRule(idx, updates)}
                onDelete={() => onRemoveRule(idx)}
                onMoveUp={() => onReorderRule(idx, idx - 1)}
                onMoveDown={() => onReorderRule(idx, idx + 1)}
                onDuplicate={() => onDuplicateRule(idx)}
              />
            );
          })}
        </div>
      )}

      <button
        onClick={onAddRule}
        className="w-full inline-flex items-center justify-center min-h-11 px-4 py-2 bg-brand text-on-brand rounded-lg font-medium text-sm hover:bg-brand-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        data-testid="add-rule-button"
      >
        {t('ruleList.addRule')}
      </button>
    </div>
  );
}
