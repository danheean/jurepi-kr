'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useJwtDecoder } from './useJwtDecoder';
import { TokenInput } from './TokenInput';
import { ColorizedToken } from './ColorizedToken';
import { ErrorMessage } from './ErrorMessage';
import { ValidityIndicator } from './ValidityIndicator';
import { ClaimsTable } from './ClaimsTable';
import { TimestampDisplay } from './TimestampDisplay';
import { VerificationSection } from './VerificationSection';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface JwtDecoderProps {
  children?: React.ReactNode;
}

/**
 * JWT Decoder Orchestrator
 * - Owns useJwtDecoder hook
 * - Composes layout and wires state → components
 * - Handles keyboard shortcuts (Ctrl/Cmd+A, Ctrl/Cmd+C)
 * - Manages copy/download functionality
 * - Handles 1s validity timer updates
 */
export function JwtDecoder({ children }: JwtDecoderProps) {
  const hookState = useJwtDecoder();
  const locale = useLocale();
  const t = useTranslations('tools.jwt-decoder');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [copiedPart, setCopiedPart] = useState<string | null>(null);

  const isUnsecuredAlg = hookState.decoded?.header?.alg === 'none';

  // Extract payload values for TimestampDisplay
  const payload = hookState.decoded?.payload as any;
  const exp = payload?.exp;
  const iat = payload?.iat;
  const nbf = payload?.nbf;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard against IME composition
      if ((e as any).isComposing || e.keyCode === 229) return;

      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd+A: select all in textarea
      if (modifier && e.key === 'a') {
        e.preventDefault();
        if (textareaRef.current) {
          textareaRef.current.select();
        }
      }

      // Ctrl/Cmd+C: copy token
      if (modifier && e.key === 'c') {
        if (textareaRef.current === document.activeElement) {
          e.preventDefault();
          if (hookState.token) {
            navigator.clipboard
              .writeText(hookState.token)
              .then(() => setCopiedPart('token'))
              .catch(() => setCopiedPart('error'));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hookState.token]);

  // Clear copied feedback after 2s
  useEffect(() => {
    if (copiedPart) {
      const timer = setTimeout(() => setCopiedPart(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedPart]);

  // Copy part to clipboard
  const copyPart = useCallback(
    async (part: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedPart(part);
      } catch {
        setCopiedPart('error');
      }
    },
    []
  );

  // Download token as file
  const downloadToken = useCallback(() => {
    if (!hookState.token) return;

    try {
      const blob = new Blob([hookState.token], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'token.jwt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [hookState.token]);

  return (
    <>
      {/* SEO Sections rendered outside (from route level) */}
      {children}

      {/* Main Interactive Area */}
      <div className="space-y-6 mt-8">
        {/* Error or Unsecured Warning */}
        <ErrorMessage
          parseError={hookState.parseError}
          unsecuredWarning={isUnsecuredAlg}
        />

        {/* Two-Column Layout: Desktop | Stacked: Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input */}
          <div className="space-y-4">
            <TokenInput
              ref={textareaRef}
              value={hookState.token}
              onChange={(e) => hookState.setToken(e.target.value)}
              error={!!hookState.parseError}
            />
          </div>

          {/* Right Column: Output */}
          {hookState.decoded && (
            <div className="flex flex-col gap-4">
              {/* Colorized Token Display */}
              <ColorizedToken
                header={
                  hookState.decoded.header
                    ? JSON.stringify(hookState.decoded.header)
                    : ''
                }
                payload={
                  hookState.decoded.payload
                    ? JSON.stringify(hookState.decoded.payload)
                    : ''
                }
                signature={hookState.decoded.signature}
              />

              {/* Validity Indicator */}
              <ValidityIndicator
                status={hookState.validity.status}
                expiryCountdown={hookState.validity.expiryCountdown}
              />

              {/* Tab Switcher */}
              <div className="flex gap-2 border-b border-hairline">
                <button
                  onClick={() => hookState.setTab('claims')}
                  className={`
                    px-4 py-2 font-medium text-sm
                    border-b-2 transition-all
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand
                    ${
                      hookState.tab === 'claims'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-text-muted hover:text-text'
                    }
                  `}
                >
                  {t('tabs.claims')}
                </button>
                <button
                  onClick={() => hookState.setTab('raw')}
                  className={`
                    px-4 py-2 font-medium text-sm
                    border-b-2 transition-all
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand
                    ${
                      hookState.tab === 'raw'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-text-muted hover:text-text'
                    }
                  `}
                >
                  {t('tabs.raw')}
                </button>
              </div>

              {/* Tab Content */}
              <div
                className={`
                  transition-opacity
                  ${prefersReducedMotion ? 'duration-0' : 'duration-150'}
                `}
              >
                {hookState.tab === 'claims' ? (
                  <div className="space-y-4">
                    <ClaimsTable payload={hookState.decoded.payload} locale={locale} />
                    <TimestampDisplay
                      exp={exp}
                      iat={iat}
                      nbf={nbf}
                      locale={locale}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-surface rounded-lg border border-hairline font-mono text-sm overflow-x-auto max-h-96">
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(hookState.decoded.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Verification Section */}
              <VerificationSection
                mode={hookState.verificationMode}
                secret={hookState.secret}
                publicKey={hookState.publicKey}
                result={hookState.verificationResult}
                onModeChange={hookState.setVerificationMode}
                onSecretChange={hookState.setSecret}
                onKeyChange={hookState.setPublicKey}
                onVerify={hookState.verifySignature}
                isVerifying={hookState.isVerifying}
              />

              {/* Copy/Download Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => copyPart('payload', JSON.stringify(hookState.decoded!.payload))}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand
                    transition-colors duration-200
                    bg-surface-muted hover:bg-surface-sunken text-text
                  `}
                >
                  {copiedPart === 'payload' ? t('copy.success') : t('copy.payload')}
                </button>
                <button
                  onClick={downloadToken}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand
                    transition-colors duration-200
                    bg-surface-muted hover:bg-surface-sunken text-text
                  `}
                >
                  {t('download.button')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
