'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { EncodedBarcode } from '@/lib/barcode-generator';

type ToastType = 'success' | 'error' | 'info';

interface DownloadButtonsProps {
  encoded: EncodedBarcode | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Surfaces user-visible feedback via the shared platform Toast (SPEC: do not reimplement). */
  onToast: (message: string, type: ToastType) => void;
}

export function DownloadButtons({ encoded, canvasRef, onToast }: DownloadButtonsProps) {
  const t = useTranslations('tools.barcode-generator');
  const linkRef = useRef<HTMLAnchorElement>(null);

  const downloadFile = useCallback(
    (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      if (linkRef.current) {
        linkRef.current.href = url;
        linkRef.current.download = filename;
        linkRef.current.click();
      }
      URL.revokeObjectURL(url);
      onToast(t('toasts.downloadSuccess'), 'success');
    },
    [onToast, t]
  );

  const handleDownloadPng = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob((blob) => {
        if (blob) {
          downloadFile(blob, 'barcode.png');
        }
      }, 'image/png');
    } catch (err) {
      onToast(t('toasts.downloadFail'), 'error');
    }
  }, [canvasRef, downloadFile, onToast, t]);

  const handleDownloadSvg = useCallback(() => {
    if (!encoded) return;

    try {
      const blob = new Blob([encoded.svgString], { type: 'image/svg+xml' });
      downloadFile(blob, 'barcode.svg');
    } catch (err) {
      onToast(t('toasts.downloadFail'), 'error');
    }
  }, [encoded, downloadFile, onToast, t]);

  const handleCopyToClipboard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          onToast(t('toasts.copyFail'), 'error');
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          onToast(t('toasts.copySuccess'), 'success');
        } catch {
          onToast(t('toasts.copyFail'), 'error');
        }
      }, 'image/png');
    } catch (err) {
      onToast(t('toasts.copyFail'), 'error');
    }
  }, [canvasRef, onToast, t]);

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={handleDownloadPng}
        disabled={!encoded}
        className={`
          min-h-[44px] px-4 py-2 rounded-md font-medium text-sm transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
          ${
            encoded
              ? 'bg-brand text-on-brand hover:bg-brand-strong active:scale-95'
              : 'bg-surface-muted text-text-secondary cursor-not-allowed'
          }
        `}
        data-testid="download-png-button"
      >
        {t('buttons.downloadPng')}
      </button>

      <button
        onClick={handleDownloadSvg}
        disabled={!encoded}
        className={`
          min-h-[44px] px-4 py-2 rounded-md font-medium text-sm transition-colors border
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
          ${
            encoded
              ? 'bg-surface-muted border-hairline text-brand-ink hover:bg-surface-sunken active:scale-95'
              : 'bg-surface-muted border-hairline text-text-secondary cursor-not-allowed'
          }
        `}
        data-testid="download-svg-button"
      >
        {t('buttons.downloadSvg')}
      </button>

      <button
        onClick={handleCopyToClipboard}
        disabled={!encoded}
        className={`
          min-h-[44px] px-4 py-2 rounded-md font-medium text-sm transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
          ${
            encoded
              ? 'bg-surface border border-hairline text-brand-ink hover:bg-surface-muted active:scale-95'
              : 'bg-surface-muted text-text-secondary cursor-not-allowed'
          }
        `}
        data-testid="copy-button"
      >
        {t('buttons.copy')}
      </button>

      <a ref={linkRef} style={{ display: 'none' }} />
    </div>
  );
}
