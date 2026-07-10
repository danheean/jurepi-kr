import { useTranslations } from 'next-intl';
import { useRef } from 'react';

interface VerificationSectionProps {
  mode: 'off' | 'hmac' | 'rsa';
  secret: string;
  publicKey: string;
  result?: { verified: boolean; error?: string };
  onModeChange: (mode: 'off' | 'hmac' | 'rsa') => void;
  onSecretChange: (secret: string) => void;
  onKeyChange: (key: string) => void;
  onVerify: () => Promise<void>;
  isVerifying: boolean;
}

export function VerificationSection({
  mode,
  secret,
  publicKey,
  result,
  onModeChange,
  onSecretChange,
  onKeyChange,
  onVerify,
  isVerifying,
}: VerificationSectionProps) {
  const t = useTranslations('tools.jwt-decoder');
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const getResultBadge = () => {
    if (!result) return null;

    if (result.verified) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-success/10 text-success">
          <span className="text-sm">{t('verification.verified')}</span>
        </div>
      );
    }

    const code = result.error?.includes('Unsupported') ? 'unsupported' : 'failed';

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${
          code === 'unsupported'
            ? 'bg-warning/10 text-warning-ink'
            : 'bg-danger/10 text-danger-ink'
        }`}
      >
        <span className="text-sm">
          {code === 'unsupported' ? t('verification.unsupported') : t('verification.failed')}
        </span>
      </div>
    );
  };

  return (
    <details
      ref={detailsRef}
      className="group/details cursor-pointer"
    >
      <summary className="flex items-center justify-between py-3 px-4 rounded-lg bg-surface-muted hover:bg-surface-sunken transition-colors cursor-pointer select-none">
        <span className="font-medium text-text">{t('verification.title')}</span>
        <svg
          className="w-5 h-5 text-text-muted transition-transform group-open/details:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </summary>

      <div className="mt-4 flex flex-col gap-4 p-4 bg-surface-muted rounded-lg">
        {/* Mode Selection */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-text mb-2">{t('verification.mode.legend')}</legend>

          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="verify-off"
              name="verification-mode"
              value="off"
              checked={mode === 'off'}
              onChange={() => onModeChange('off')}
              className="accent-brand"
            />
            <label htmlFor="verify-off" className="text-sm text-text cursor-pointer">
              {t('verification.mode.off')}
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="verify-hmac"
              name="verification-mode"
              value="hmac"
              checked={mode === 'hmac'}
              onChange={() => onModeChange('hmac')}
              className="accent-brand"
            />
            <label htmlFor="verify-hmac" className="text-sm text-text cursor-pointer">
              {t('verification.mode.hmac')}
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="verify-rsa"
              name="verification-mode"
              value="rsa"
              checked={mode === 'rsa'}
              onChange={() => onModeChange('rsa')}
              className="accent-brand"
            />
            <label htmlFor="verify-rsa" className="text-sm text-text cursor-pointer">
              {t('verification.mode.rsa')}
            </label>
          </div>
        </fieldset>

        {/* HMAC Secret Input */}
        {mode === 'hmac' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="hmac-secret" className="text-sm font-medium text-text">
              {t('verification.secret.label')}
            </label>
            <textarea
              id="hmac-secret"
              value={secret}
              onChange={(e) => onSecretChange(e.target.value)}
              placeholder={t('verification.secret.placeholder')}
              className={`
                w-full h-24 p-3 font-mono text-sm
                bg-surface border rounded-lg
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand
                resize-none
                transition-colors duration-200
                border-hairline
              `}
              spellCheck="false"
              autoComplete="off"
            />
          </div>
        )}

        {/* RSA Public Key Input */}
        {mode === 'rsa' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="rsa-key" className="text-sm font-medium text-text">
              {t('verification.key.label')}
            </label>
            <textarea
              id="rsa-key"
              value={publicKey}
              onChange={(e) => onKeyChange(e.target.value)}
              placeholder={t('verification.key.placeholder')}
              className={`
                w-full h-24 p-3 font-mono text-sm
                bg-surface border rounded-lg
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand
                resize-none
                transition-colors duration-200
                border-hairline
              `}
              spellCheck="false"
              autoComplete="off"
            />
          </div>
        )}

        {/* Verify Button */}
        {mode !== 'off' && (
          <button
            onClick={onVerify}
            disabled={isVerifying}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand
              transition-colors duration-200
              ${
                isVerifying
                  ? 'bg-brand/50 text-on-brand cursor-not-allowed'
                  : 'bg-brand text-on-brand hover:bg-brand-strong active:bg-brand-strong'
              }
            `}
          >
            {isVerifying ? t('verification.verifying') : t('verification.button')}
          </button>
        )}

        {/* Verification Result */}
        {result && (
          <div className="flex items-center p-3 bg-surface rounded-lg border border-hairline">
            {getResultBadge()}
          </div>
        )}
      </div>
    </details>
  );
}
