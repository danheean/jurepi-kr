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
        {/* Left column: settings — grouped in a muted panel, sticky so the
            column reads as an intentional settings rail rather than dead space */}
        <div className="lg:col-span-1">
          <div className="space-y-6 rounded-xl bg-surface-muted p-5 lg:sticky lg:top-8">
            <ModeToggle value={state.mode} onChange={actions.setMode} />
            <VariantToggle value={state.variant} onChange={actions.setVariant} />
            <DirectionToggle value={state.direction} onChange={actions.setDirection} />
          </div>
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

          {/* Error display — conversion is live (SPEC), no manual trigger */}
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
              decodedImage={state.decodedImage}
              onDownloadImage={actions.downloadImage}
              onCopyImage={actions.copyImage}
              decodedFile={state.decodedFile}
              onDownloadFile={actions.downloadDecodedFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
