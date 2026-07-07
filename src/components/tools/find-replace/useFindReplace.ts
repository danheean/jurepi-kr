'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  Rule,
  ApplyRulesResult,
  SavedRuleSet,
  Preset,
  TransformId,
} from '@/lib/find-replace';
import {
  applyRules,
  applyTransform,
  APPLY_DEBOUNCE,
  DEADLINE_MS,
  deserializeStore,
  parseStore,
  PRESETS,
  pruneInvalid,
  pushRecent,
  removeSet,
  RULES_MAX,
  saveSet,
  serializeStore,
  STORAGE_KEY,
  STORE_VERSION,
} from '@/lib/find-replace';

/** Generate a stable rule id (crypto.randomUUID with a safe fallback). */
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** A fresh, blank rule with all defaults. */
function createBlankRule(): Rule {
  return {
    id: newId(),
    find: '',
    replace: '',
    isRegex: false,
    caseSensitive: false,
    wholeWord: false,
    firstOnly: false,
    enabled: true,
  };
}

export interface UseFindReplaceState {
  text: string;
  rules: Rule[];
  applyResult: ApplyRulesResult;
  savedSets: SavedRuleSet[];
  recents: string[];
}

export interface UseFindReplaceActions {
  setText: (text: string) => void;
  addRule: (index?: number) => void;
  updateRule: (index: number, updates: Partial<Rule>) => void;
  removeRule: (index: number) => void;
  reorderRule: (fromIndex: number, toIndex: number) => void;
  toggleRuleEnabled: (index: number) => void;
  duplicateRule: (index: number) => void;
  selectPreset: (preset: Preset) => void;
  saveRuleSet: (name: string) => void;
  applyRuleSet: (setName: string) => void;
  removeRuleSet: (setName: string) => void;
  pushRecentsText: (text: string) => void;
  copyResult: () => Promise<void>;
  downloadResult: (filename?: string) => void;
}

/**
 * useFindReplace: Hook owning text + rules state, localStorage persistence, debounced apply, and mutators.
 * - Reads/writes localStorage key 'jurepi-find-replace' via parseStore/serializeStore
 * - Applies rules via applyRules(..., { deadlineMs: DEADLINE_MS })
 * - Debounces apply 150ms; debounces persist 500ms (separate timers)
 * - Derives latest text/rules passed as arguments (no stale closures)
 * - Exposes mutators: add/update/remove/reorder/toggle/duplicate rules, presets, savedSets, recents
 */
export function useFindReplace(): UseFindReplaceState & UseFindReplaceActions {
  const t = useTranslations('tools.find-replace');

  // State
  const [text, setText] = useState<string>('');
  const [rules, setRules] = useState<Rule[]>([]);
  const [savedSets, setSavedSets] = useState<SavedRuleSet[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [applyResult, setApplyResult] = useState<ApplyRulesResult>({
    output: '',
    perRuleCounts: [],
    spans: [],
    totalCount: 0,
  });

  // Refs mirror state so stable callbacks read the latest value synchronously
  // (mutators update these at call time, before React re-renders).
  const textRef = useRef(text);
  const rulesRef = useRef(rules);
  const savedSetsRef = useRef(savedSets);
  const recentsRef = useRef(recents);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const applyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep refs in sync (belt-and-suspenders; mutators also set them synchronously)
  useEffect(() => {
    textRef.current = text;
  }, [text]);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);
  useEffect(() => {
    savedSetsRef.current = savedSets;
  }, [savedSets]);
  useEffect(() => {
    recentsRef.current = recents;
  }, [recents]);

  // === Initialize from localStorage on mount ===
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // parseStore takes the raw JSON string (it parses internally); never double-parse.
      const store = stored
        ? pruneInvalid(parseStore(stored))
        : null;

      const initialRules = store?.rules?.length ? store.rules : [createBlankRule()];
      const initialSets = store?.savedSets ?? [];
      const initialRecents = store?.recents ?? [];
      rulesRef.current = initialRules;
      savedSetsRef.current = initialSets;
      recentsRef.current = initialRecents;
      setRules(initialRules);
      setSavedSets(initialSets);
      setRecents(initialRecents);
    } catch {
      // localStorage unavailable or corrupt → start fresh
      const blank = [createBlankRule()];
      rulesRef.current = blank;
      setRules(blank);
      setSavedSets([]);
      setRecents([]);
    }
  }, []);

  // === Debounced apply (150ms) ===
  const triggerApply = useCallback(() => {
    clearTimeout(applyTimerRef.current);
    applyTimerRef.current = setTimeout(() => {
      const result = applyRules(textRef.current, rulesRef.current, {
        deadlineMs: DEADLINE_MS,
      });
      setApplyResult(result);
      // Push to recents if text is non-empty
      if (textRef.current.trim()) {
        setRecents((prev) =>
          pushRecent(prev, textRef.current.substring(0, 100), 10)
        );
      }
    }, APPLY_DEBOUNCE);
  }, []);

  // === Debounced persist (500ms, separate timer) ===
  const triggerPersist = useCallback(
    (state: { rules: Rule[]; savedSets: SavedRuleSet[]; recents: string[] }) => {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(() => {
        try {
          // serializeStore already returns a JSON string — do NOT stringify again.
          const serialized = serializeStore({
            version: STORE_VERSION,
            rules: state.rules,
            savedSets: state.savedSets,
            recents: state.recents,
            meta: { createdAt: Date.now() },
          });
          localStorage.setItem(STORAGE_KEY, serialized);
        } catch {
          // Quota exceeded, private mode, etc. — silent fail (in-memory only)
        }
      }, 500);
    },
    []
  );

  // === Text mutations ===
  const setText_: (text: string) => void = useCallback((newText: string) => {
    setText(newText);
    textRef.current = newText;
    triggerApply();
  }, [triggerApply]);

  // === Rule mutations ===
  // Commit a new rules array: sync the ref (so same-tick reads see it), update
  // state, persist, and re-apply. Side effects run OUTSIDE any setState updater.
  const commitRules = useCallback(
    (next: Rule[]) => {
      rulesRef.current = next;
      setRules(next);
      triggerPersist({
        rules: next,
        savedSets: savedSetsRef.current,
        recents: recentsRef.current,
      });
      triggerApply();
    },
    [triggerPersist, triggerApply]
  );

  const addRule = useCallback(
    (index?: number) => {
      const prev = rulesRef.current;
      if (prev.length >= RULES_MAX) return;
      const next = [...prev];
      const newRule = createBlankRule();
      if (index !== undefined) next.splice(index, 0, newRule);
      else next.push(newRule);
      commitRules(next);
    },
    [commitRules]
  );

  const updateRule = useCallback(
    (index: number, updates: Partial<Rule>) => {
      const prev = rulesRef.current;
      if (index < 0 || index >= prev.length) return;
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      commitRules(next);
    },
    [commitRules]
  );

  const removeRule = useCallback(
    (index: number) => {
      const prev = rulesRef.current;
      if (prev.length <= 1) return; // keep at least one rule
      commitRules(prev.filter((_, i) => i !== index));
    },
    [commitRules]
  );

  const reorderRule = useCallback(
    (fromIndex: number, toIndex: number) => {
      const prev = rulesRef.current;
      if (fromIndex === toIndex) return;
      if (fromIndex < 0 || fromIndex >= prev.length) return;
      if (toIndex < 0 || toIndex >= prev.length) return;
      const next = [...prev];
      const [rule] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, rule);
      commitRules(next);
    },
    [commitRules]
  );

  const toggleRuleEnabled = useCallback(
    (index: number) => {
      const prev = rulesRef.current;
      if (index < 0 || index >= prev.length) return;
      const next = [...prev];
      next[index] = { ...next[index], enabled: !next[index].enabled };
      commitRules(next);
    },
    [commitRules]
  );

  const duplicateRule = useCallback(
    (index: number) => {
      const prev = rulesRef.current;
      if (index < 0 || index >= prev.length) return;
      const next = [...prev];
      next.splice(index + 1, 0, { ...next[index], id: newId() });
      commitRules(next);
    },
    [commitRules]
  );

  // === Preset selection ===
  const selectPreset = useCallback(
    (preset: Preset) => {
      if (preset.kind === 'ruleset' && preset.rules) {
        // Give preset rules fresh ids so React keys/reorder stay stable.
        commitRules(preset.rules.map((r) => ({ ...r, id: newId() })));
      } else if (preset.kind === 'builtin' && preset.transform) {
        const transformed = applyTransform(preset.transform, textRef.current);
        setText_(transformed);
      }
    },
    [commitRules, setText_]
  );

  // === Saved rule-sets ===
  const saveRuleSet = useCallback(
    (name: string) => {
      const currentRules = rulesRef.current; // snapshot at call time
      const nextSets = saveSet(savedSetsRef.current, name, currentRules);
      savedSetsRef.current = nextSets;
      setSavedSets(nextSets);
      triggerPersist({
        rules: currentRules,
        savedSets: nextSets,
        recents: recentsRef.current,
      });
    },
    [triggerPersist]
  );

  const applyRuleSet = useCallback(
    (setName: string) => {
      const set = savedSetsRef.current.find((s) => s.name === setName);
      if (set) {
        // Fresh ids so the loaded rules get stable, unique React keys.
        commitRules(set.rules.map((r) => ({ ...r, id: newId() })));
      }
    },
    [savedSets, triggerPersist, triggerApply, recents]
  );

  const removeRuleSet = useCallback(
    (setName: string) => {
      setSavedSets((prev) => {
        const next = removeSet(prev, setName);
        triggerPersist({ rules, savedSets: next, recents });
        return next;
      });
    },
    [triggerPersist, rules, recents]
  );

  // === Recents ===
  const pushRecentsText = useCallback(
    (text: string) => {
      setRecents((prev) => {
        const next = pushRecent(prev, text, 10);
        triggerPersist({ rules, savedSets, recents: next });
        return next;
      });
    },
    [triggerPersist, rules, savedSets]
  );

  // === Copy result ===
  const copyResult = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(applyResult.output);
      } else {
        // Fallback: textarea execCommand
        const ta = document.createElement('textarea');
        ta.value = applyResult.output;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {
      // Silent fail
    }
  }, [applyResult.output]);

  // === Download result ===
  const downloadResult = useCallback((filename = 'result.txt') => {
    const blob = new Blob([applyResult.output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [applyResult.output]);

  // === Cleanup ===
  useEffect(() => {
    return () => {
      clearTimeout(applyTimerRef.current);
      clearTimeout(persistTimerRef.current);
    };
  }, []);

  return {
    text,
    rules,
    applyResult,
    savedSets,
    recents,
    setText: setText_,
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
    pushRecentsText,
    copyResult,
    downloadResult,
  };
}
