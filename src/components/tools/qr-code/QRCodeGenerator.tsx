'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useQRCode } from './useQRCode';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { InputModeSelector, INPUT_PANEL_ID } from './InputModeSelector';
import { InputArea } from './InputArea';
import { ECCSelector } from './ECCSelector';
import { SizeControls } from './SizeControls';
import { ColorPickers } from './ColorPickers';
import { LogoUpload } from './LogoUpload';
import { QRPreview } from './QRPreview';
import { DownloadButtons } from './DownloadButtons';
import { ContrastWarning } from './ContrastWarning';
import { MAX_INPUT_LENGTH, deltaE } from '@/lib/qr-code';

interface Props {
  locale: string;
}

export function QRCodeGenerator({ locale }: Props) {
  const t = useTranslations('tools.qr-code');
  const [state, actions] = useQRCode();
  const [mounted, setMounted] = useState(false);
  const [showContrastWarning, setShowContrastWarning] = useState(false);
  const [confirmLowContrast, setConfirmLowContrast] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const contrastValue = Math.round(deltaE(state.options.fgColor, state.options.bgColor));
  const isContrastAcceptable = state.result?.contrastAcceptable ?? true;
  // The effective download gate: low contrast is downloadable once the user
  // confirms "Generate anyway". Buttons AND keyboard shortcuts share this gate.
  const canDownloadWithContrast = isContrastAcceptable || confirmLowContrast;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcuts: Cmd/Ctrl+S for PNG, Cmd/Ctrl+C for copy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd+S / Ctrl+S → Download PNG (respects the contrast gate)
      if (isCmdOrCtrl && e.key === 's') {
        e.preventDefault();
        if (canvasRef.current && state.result && canDownloadWithContrast) {
          downloadPNG();
        }
      }

      // Cmd+C / Ctrl+C → Copy to clipboard (when focus is not on input)
      if (
        isCmdOrCtrl &&
        e.key === 'c' &&
        (e.target === document.body ||
          (e.target instanceof HTMLElement && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA'))
      ) {
        e.preventDefault();
        if (canvasRef.current && state.result && canDownloadWithContrast) {
          copyToClipboard();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.result, canDownloadWithContrast]);

  const downloadPNG = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qr-code.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      actions.addRecent(state.input);
    });
  };

  const copyToClipboard = async () => {
    if (!canvasRef.current) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          // Success handled by DownloadButtons via onToast
        } catch {
          // Fail silently; no false success toast
        }
      });
    } catch {
      // Fail silently
    }
  };

  // Show warning if contrast is low and user hasn't confirmed
  useEffect(() => {
    setShowContrastWarning(!isContrastAcceptable && !confirmLowContrast);
  }, [isContrastAcceptable, confirmLowContrast]);

  // Pre-hydration skeleton: reserves the real layout shape so nothing shifts
  // (CLS) when the interactive tool mounts. Honors reduced-motion.
  if (!mounted) {
    const shimmer = prefersReducedMotion ? '' : 'animate-pulse';
    return (
      <div className="space-y-8" aria-hidden="true">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`h-11 rounded-full bg-surface-muted ${shimmer}`} />
            <div className={`h-32 rounded-md bg-surface-muted ${shimmer}`} />
            <div className={`h-24 rounded-md bg-surface-muted ${shimmer}`} />
            <div className={`h-40 rounded-md bg-surface-muted ${shimmer}`} />
          </div>
          <div className="lg:col-span-1">
            <div className={`w-full aspect-square rounded-lg bg-surface-muted ${shimmer}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main interactive area: 2-col desktop, stacked mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: form inputs (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input mode selector */}
          <div>
            <InputModeSelector mode={state.mode} onModeChange={actions.setMode} />
          </div>

          {/* Input area — tabpanel controlled by the InputModeSelector tabs */}
          <div id={INPUT_PANEL_ID} role="tabpanel" aria-label={t('modes.label')}>
            <InputArea
              mode={state.mode}
              value={state.input}
              onChange={actions.setInput}
              maxLength={MAX_INPUT_LENGTH}
            />
          </div>

          {/* Error message if encoding failed */}
          {state.error && (
            <div className="rounded-md bg-surface-muted border border-danger px-4 py-3">
              <p className="text-danger-ink text-sm font-medium">{t('errors.encodingFailed')}</p>
              <button
                onClick={actions.clearError}
                className="text-xs text-danger-ink underline hover:no-underline mt-1"
              >
                {t('errors.dismiss')}
              </button>
            </div>
          )}

          {/* ECC selector */}
          <div>
            <ECCSelector
              value={state.options.eccLevel}
              onChange={(ecc: any) => actions.setOptions({ eccLevel: ecc })}
            />
          </div>

          {/* Size controls */}
          <div>
            <SizeControls
              size={state.options.size}
              quietZone={state.options.quietZone}
              onSizeChange={(size: number) => actions.setOptions({ size })}
              onQzChange={(qz: number) => actions.setOptions({ quietZone: qz })}
            />
          </div>

          {/* Color pickers */}
          <div>
            <ColorPickers
              fgColor={state.options.fgColor}
              bgColor={state.options.bgColor}
              onFgChange={(fg) => actions.setOptions({ fgColor: fg })}
              onBgChange={(bg) => actions.setOptions({ bgColor: bg })}
              contrast={contrastValue}
              isContrastAcceptable={isContrastAcceptable}
            />
          </div>

          {/* Logo upload */}
          <div>
            <LogoUpload logoUrl={state.logoUrl} onLogoUrlChange={actions.setLogoUrl} />
          </div>

          {/* Download buttons */}
          <div className="pt-4">
            <DownloadButtons
              canvasRef={canvasRef}
              svg={state.result?.svg}
              isContrastAcceptable={canDownloadWithContrast}
              onDownload={() => actions.addRecent(state.input)}
              onConfirmLowContrast={() => setConfirmLowContrast(true)}
            />
          </div>
        </div>

        {/* Right column: preview (sticky on desktop) */}
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <div className="space-y-4">
            <QRPreview
              ref={canvasRef}
              result={state.result}
              isLoading={state.isEncoding}
              error={state.error}
              size={state.options.size}
              quietZone={state.options.quietZone}
              fgColor={state.options.fgColor}
              bgColor={state.options.bgColor}
              logoUrl={state.logoUrl}
              prefersReducedMotion={prefersReducedMotion}
            />

            {/* Contrast warning */}
            {showContrastWarning && (
              <ContrastWarning
                isVisible={showContrastWarning}
                contrastValue={contrastValue}
                onConfirm={() => {
                  setConfirmLowContrast(true);
                  setShowContrastWarning(false);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
