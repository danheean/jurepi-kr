'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

type CopyTarget = 'base64' | 'dataUri' | 'text';
type FeedbackTarget = CopyTarget | 'image';

interface DecodedImagePreview {
  dataUri: string;
  mimeType: string;
  sizeBytes: number;
}

interface DecodedFilePreview {
  mimeType: string;
  sizeBytes: number;
}

interface Props {
  outputText: string;
  direction: 'encode' | 'decode';
  onCopy: (target: CopyTarget) => Promise<boolean>;
  onDownload: () => void;
  showDownload?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  decodedImage?: DecodedImagePreview | null;
  onDownloadImage?: () => void;
  onCopyImage?: () => Promise<boolean>;
  decodedFile?: DecodedFilePreview | null;
  onDownloadFile?: () => void;
}

const COPIED_FEEDBACK_MS = 1600;

/** Human-readable byte size. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Short, human label for a MIME type (e.g. "image/png" → "PNG"). */
function mimeLabel(mimeType: string): string {
  if (mimeType === 'application/octet-stream') return 'BIN';
  const sub = mimeType.split('/')[1] ?? mimeType;
  return sub.replace('svg+xml', 'svg').replace('x-icon', 'ico').toUpperCase();
}

// Neutral checkerboard so transparent PNGs read clearly against the page.
const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
};

export function OutputDisplay({
  outputText,
  direction,
  onCopy,
  onDownload,
  showDownload = false,
  isLoading = false,
  disabled = false,
  decodedImage = null,
  onDownloadImage,
  onCopyImage,
  decodedFile = null,
  onDownloadFile,
}: Props) {
  const t = useTranslations('tools.base64-encoder');
  const [copiedTarget, setCopiedTarget] = useState<FeedbackTarget | null>(null);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const flagCopied = (target: FeedbackTarget) => {
    setCopiedTarget(target);
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = setTimeout(() => {
      setCopiedTarget(null);
    }, COPIED_FEEDBACK_MS);
  };

  const handleCopy = async (target: CopyTarget) => {
    const success = await onCopy(target);
    if (success) flagCopied(target);
  };

  const handleCopyImage = async () => {
    if (!onCopyImage) return;
    const success = await onCopyImage();
    if (success) flagCopied('image');
  };

  const showImage = direction === 'decode' && decodedImage !== null;

  const primaryButtonClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      active
        ? 'bg-success text-on-success'
        : 'bg-brand text-on-brand hover:bg-brand-strong'
    }`;

  const secondaryButtonClass =
    'px-4 py-2 rounded-lg text-sm font-medium bg-surface-muted border border-hairline text-text hover:bg-surface-sunken transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  // Image result: render a visual preview instead of garbled text.
  if (showImage && decodedImage) {
    return (
      <div className="space-y-3">
        <figure className="space-y-3">
          <div
            className="rounded-lg border border-hairline overflow-hidden p-4"
            style={CHECKERBOARD_STYLE}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={decodedImage.dataUri}
              alt={t('output.imageAlt')}
              className="mx-auto block max-h-96 max-w-full object-contain"
            />
          </div>
          <figcaption className="text-sm text-text-secondary">
            {mimeLabel(decodedImage.mimeType)} · {formatBytes(decodedImage.sizeBytes)}
          </figcaption>
        </figure>

        <div aria-live="polite" className="sr-only">
          {copiedTarget === 'image' ? t('output.copied') : ''}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => onDownloadImage?.()} className={secondaryButtonClass}>
            {t('output.downloadImage')}
          </button>
          {onCopyImage && (
            <button onClick={handleCopyImage} className={primaryButtonClass(copiedTarget === 'image')}>
              {copiedTarget === 'image' ? t('output.copied') : t('output.copyImage')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Non-image binary result (e.g. a decoded PDF): offer a file download rather
  // than rendering unreadable bytes as text.
  const showFile = direction === 'decode' && decodedFile !== null;
  if (showFile && decodedFile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-muted p-4">
          <span aria-hidden className="text-2xl leading-none">
            📄
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">{t('output.fileReady')}</p>
            <p className="text-sm text-text-secondary">
              {mimeLabel(decodedFile.mimeType)} · {formatBytes(decodedFile.sizeBytes)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onDownloadFile?.()} className={primaryButtonClass(false)}>
            {t('output.downloadFile')}
          </button>
        </div>
      </div>
    );
  }

  const hasOutput = outputText.length > 0;
  const isButtonDisabled = !hasOutput || isLoading || disabled;

  const copyButtonLabel = (target: CopyTarget, labelKey: string) =>
    copiedTarget === target ? t('output.copied') : t(labelKey);

  return (
    <div className="space-y-3">
      <textarea
        readOnly
        value={outputText}
        placeholder={t('output.placeholder')}
        aria-label={t('output.label')}
        className="w-full min-h-32 p-4 border border-hairline rounded-lg bg-surface-muted text-text placeholder-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring resize-vertical font-mono text-sm"
      />

      <div aria-live="polite" className="sr-only">
        {copiedTarget ? t('output.copied') : ''}
      </div>

      <div className="flex flex-wrap gap-2">
        {direction === 'encode' && (
          <>
            <button
              onClick={() => handleCopy('base64')}
              disabled={isButtonDisabled}
              className={primaryButtonClass(copiedTarget === 'base64')}
            >
              {copyButtonLabel('base64', 'output.copyBase64')}
            </button>
            <button
              onClick={() => handleCopy('dataUri')}
              disabled={isButtonDisabled}
              className={primaryButtonClass(copiedTarget === 'dataUri')}
            >
              {copyButtonLabel('dataUri', 'output.copyDataUri')}
            </button>
          </>
        )}

        {direction === 'decode' && (
          <button
            onClick={() => handleCopy('text')}
            disabled={isButtonDisabled}
            className={primaryButtonClass(copiedTarget === 'text')}
          >
            {copyButtonLabel('text', 'output.copyText')}
          </button>
        )}

        {showDownload && (
          <button
            onClick={() => onDownload()}
            disabled={isButtonDisabled}
            className={secondaryButtonClass}
          >
            {t('output.download')}
          </button>
        )}
      </div>
    </div>
  );
}
