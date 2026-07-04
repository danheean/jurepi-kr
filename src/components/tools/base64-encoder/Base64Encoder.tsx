'use client';

import { useState, useEffect } from 'react';
import { useBase64 } from './useBase64';
import { ModeToggle } from './ModeToggle';
import { VariantToggle } from './VariantToggle';
import { DirectionToggle } from './DirectionToggle';
import { TextInput } from './TextInput';
import { FileInput } from './FileInput';
import { OutputDisplay } from './OutputDisplay';
import { useTranslations } from 'next-intl';

interface Props {
  locale: string;
}

/**
 * Base64Encoder: Main orchestrator component for Base64 encoding/decoding tool.
 * Manages mode (text/file), variant (standard/URL-safe), direction (encode/decode).
 * All interaction is local SPA — no page reload or route navigation.
 */
export function Base64Encoder({ locale }: Props) {
  const t = useTranslations('tools.base64-encoder');
  const [state, actions] = useBase64();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Main interactive area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: settings */}
        <div className="lg:col-span-1 space-y-6">
          <ModeToggle value={state.mode} onChange={actions.setMode} />
          <VariantToggle value={state.variant} onChange={actions.setVariant} />
          <DirectionToggle value={state.direction} onChange={actions.setDirection} />
        </div>

        {/* Right column: input/output */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text">
              {state.mode === 'text' ? t('input.label') : t('input.fileSelect')}
            </label>
            {state.mode === 'text' ? (
              <TextInput
                value={state.inputText}
                onChange={actions.setInputText}
                disabled={state.isLoading}
              />
            ) : (
              <FileInput
                onFileSelect={actions.setInputFile}
                selectedFile={state.inputFile}
                disabled={state.isLoading}
              />
            )}
          </div>

          {/* Process button */}
          <button
            onClick={() => actions.process()}
            disabled={!state.isValidInput || state.isLoading}
            className="w-full px-4 py-3 bg-brand text-on-brand rounded-lg font-medium hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.isLoading ? t('process.loading') : t('process.button')}
          </button>

          {/* Error display */}
          {state.error && (
            <div
              aria-live="polite"
              className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger-ink"
            >
              {t(`errors.${state.error.code}`)}
            </div>
          )}

          {/* Output */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text">{t('output.label')}</label>
            <OutputDisplay
              outputText={state.outputText}
              direction={state.direction}
              onCopy={actions.copy}
              onDownload={actions.download}
              showDownload={state.mode === 'file' && state.direction === 'encode'}
              isLoading={state.isLoading}
              disabled={!state.outputText}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
