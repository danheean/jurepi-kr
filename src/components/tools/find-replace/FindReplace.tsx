'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFindReplace } from './useFindReplace';
import { FindReplaceSkeleton } from './FindReplaceSkeleton';
import { SourceTextInput } from './SourceTextInput';
import { RuleList } from './RuleList';
import { ResultOutput } from './ResultOutput';
import { PresetLibrary } from './PresetLibrary';
import { SavedRuleSets } from './SavedRuleSets';
import { RegexCheatsheet } from './RegexCheatsheet';
import { PRESETS } from '@/lib/find-replace';

/**
 * Main find-replace orchestrator (Client Component).
 * - Manages mounted gate (for localStorage hydration)
 * - Owns keyboard shortcuts (single window listener, not per-component)
 * - Layout: source textarea + result (left), rules/presets/saved/cheatsheet (right)
 */
export function FindReplace() {
  const t = useTranslations('tools.find-replace');
  const [mounted, setMounted] = useState(false);

  const {
    text,
    rules,
    applyResult,
    savedSets,
    setText,
    addRule,
    updateRule,
    removeRule,
    reorderRule,
    toggleRuleEnabled,
    duplicateRule,
    selectPreset,
    saveRuleSet,
    applyRuleSet,
    removeRuleSet,
    copyResult,
    downloadResult,
  } = useFindReplace();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcuts (single window listener)
  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform.startsWith('Mac');
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd+Enter: add rule
      if (isCtrlOrCmd && e.key === 'Enter') {
        e.preventDefault();
        addRule();
      }

      // Ctrl/Cmd+Shift+C: copy result
      if (isCtrlOrCmd && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        copyResult();
      }

      // Esc: no default action in this tool (future: close panels, etc.)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, addRule, copyResult]);

  if (!mounted) {
    return <FindReplaceSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* sr-only region heading so the interactive tool has an h2 between the page h1
          and the panel h3s (avoids a heading-level skip for screen-reader navigation) */}
      <h2 className="sr-only">{t('workspaceHeading')}</h2>

      {/* Left: Source text input (top) → result (bottom) — the text flow (2/3 on desktop) */}
      <div className="lg:col-span-2 space-y-6">
        <SourceTextInput text={text} onChange={setText} />

        {/* Result */}
        <ResultOutput
          output={applyResult.output}
          spans={applyResult.spans}
          totalCount={applyResult.totalCount}
          ruleCount={rules.filter((r) => r.enabled).length}
          timedOut={applyResult.timedOut}
          onCopy={copyResult}
          onDownload={downloadResult}
        />
      </div>

      {/* Right: Rules, presets, saved sets, cheatsheet — controls (1/3 on desktop) */}
      <div className="lg:col-span-1 space-y-6">
        {/* Rules */}
        <RuleList
          rules={rules}
          applyResult={applyResult}
          onAddRule={() => addRule()}
          onUpdateRule={(index, updates) => updateRule(index, updates)}
          onRemoveRule={(index) => removeRule(index)}
          onReorderRule={(from, to) => reorderRule(from, to)}
          onDuplicateRule={(index) => duplicateRule(index)}
          onToggleRuleEnabled={(index) => toggleRuleEnabled(index)}
        />

        {/* Presets */}
        <PresetLibrary presets={PRESETS} onSelectPreset={selectPreset} />

        {/* Saved rule sets */}
        <SavedRuleSets
          savedSets={savedSets}
          onSaveRuleSet={saveRuleSet}
          onApplyRuleSet={applyRuleSet}
          onRemoveRuleSet={removeRuleSet}
        />

        {/* Regex cheatsheet */}
        <RegexCheatsheet />
      </div>
    </div>
  );
}
