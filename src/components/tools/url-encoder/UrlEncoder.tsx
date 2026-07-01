'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useUrlEncoder } from './useUrlEncoder';
import { ModeToggle } from './ModeToggle';
import { CharsetToggle } from './CharsetToggle';
import { DirectionToggle } from './DirectionToggle';
import { TextInput } from './TextInput';
import { BatchToggle } from './BatchToggle';
import { PlusAsSpaceToggle } from './PlusAsSpaceToggle';
import { ResultOutput } from './ResultOutput';
import { AlreadyEncodedWarning } from './AlreadyEncodedWarning';
import { QueryTableView } from './QueryTableView';
import { RecentsList } from './RecentsList';

interface Props {
  locale: string;
}

export function UrlEncoder({ locale }: Props) {
  const t = useTranslations('tools.url-encoder');
  const [state, actions] = useUrlEncoder();
  const [mounted, setMounted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingInput, setPendingInput] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when not typing in an input
      if (e.target === document.body || (e.target as HTMLElement)?.tagName === 'BODY') {
        if (e.key === '/') {
          e.preventDefault();
          const input = document.querySelector('input[type="text"], textarea');
          if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
            input.focus();
          }
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          // Toggle recents - handled by component
        }
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          actions.setDirection(state.direction === 'encode' ? 'decode' : 'encode');
        }
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          actions.setMode(state.mode === 'component' ? 'uri' : 'component');
        }
        if (e.key === 'u' || e.key === 'U') {
          e.preventDefault();
          actions.setCharset(state.charset === 'utf-8' ? 'euc-kr' : 'utf-8');
        }
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          actions.setBatchMode(!state.batchMode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.direction, state.mode, state.charset, state.batchMode, actions]);

  const handleProcess = async () => {
    if (state.alreadyEncodedHint && state.direction === 'encode' && !showWarning) {
      setPendingInput(state.text);
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    await actions.process();
    if (state.text.trim()) {
      actions.addRecent(state.text);
    }
  };

  const handleWarningProceed = async () => {
    setShowWarning(false);
    await actions.process();
    if (state.text.trim()) {
      actions.addRecent(state.text);
    }
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
    setPendingInput('');
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Main interactive area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode selection */}
          <ModeToggle value={state.mode} onChange={actions.setMode} />

          {/* Charset selection */}
          <CharsetToggle
            value={state.charset}
            onChange={actions.setCharset}
            isLoading={state.isLoading}
          />

          {/* Direction toggle */}
          <DirectionToggle
            value={state.direction}
            onChange={actions.setDirection}
          />

          {/* Main text input */}
          <TextInput
            value={state.text}
            onChange={actions.setText}
            onProcess={handleProcess}
            batchMode={state.batchMode}
            onClear={actions.clearAll}
          />

          {/* Batch toggle */}
          <BatchToggle value={state.batchMode} onChange={actions.setBatchMode} />

          {/* Plus as space toggle (decode only) */}
          {state.direction === 'decode' && (
            <PlusAsSpaceToggle
              value={state.plusAsSpace}
              onChange={actions.setPlusAsSpace}
            />
          )}

          {/* Already encoded warning */}
          {showWarning && state.alreadyEncodedHint && (
            <AlreadyEncodedWarning
              visible={showWarning}
              onProceed={handleWarningProceed}
              onCancel={handleWarningCancel}
            />
          )}
        </div>

        {/* Right column: result (sticky on desktop) */}
        <div className="lg:col-span-1 lg:sticky lg:top-8 h-fit">
          <ResultOutput
            result={state.result}
            error={state.error}
            onCopy={actions.copyResult}
            isLoading={state.isLoading}
          />
        </div>
      </div>

      {/* Query table view */}
      <QueryTableView
        rows={state.queryTableRows}
        rawInput={state.queryTableInput}
        onRowsChange={actions.setQueryTableRows}
        onInputChange={actions.setQueryTableInput}
        onRebuild={async (query) => {
          await actions.copyResult();
        }}
        isLoading={state.isLoading}
      />

      {/* Recents list */}
      <RecentsList
        recents={state.recents}
        onSelect={(text) => {
          actions.setText(text);
        }}
        onClear={actions.clearRecents}
      />

      {/* Keyboard shortcuts hint */}
      <details className="text-sm text-text-secondary border border-hairline rounded-lg p-4">
        <summary className="font-semibold cursor-pointer text-text">
          {t('shortcuts.help')}
        </summary>
        <div className="mt-3 space-y-1 text-xs">
          <p>{t('shortcuts.focus')}</p>
          <p>{t('shortcuts.toggleRecents')}</p>
          <p>{t('shortcuts.toggleDirection')}</p>
          <p>{t('shortcuts.toggleMode')}</p>
          <p>{t('shortcuts.toggleCharset')}</p>
          <p>{t('shortcuts.toggleBatch')}</p>
          <p>{t('shortcuts.process')}</p>
          <p>{t('shortcuts.clear')}</p>
        </div>
      </details>
    </div>
  );
}
