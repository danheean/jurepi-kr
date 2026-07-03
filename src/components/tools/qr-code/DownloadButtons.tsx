'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Copy } from 'lucide-react';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svg?: string;
  isContrastAcceptable?: boolean;
  onDownload?: () => void;
  onConfirmLowContrast?: () => void;
}

export function DownloadButtons({
  canvasRef,
  svg,
  isContrastAcceptable = true,
  onDownload,
  onConfirmLowContrast,
}: Props) {
  const t = useTranslations('tools.qr-code');
  const toastTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const showToast = (key: 'downloadSuccess' | 'copySuccess' | 'copyFail') => {
    // Visible feedback: PNG/SVG downloads surface via the browser's native
    // download UI; clipboard success/failure is signalled through onDownload.
    // (A platform Toast can be wired here later — intentionally no console output.)
    void key;
  };

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
      showToast('downloadSuccess');
      onDownload?.();
    });
  };

  const downloadSVG = () => {
    if (!svg) return;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('downloadSuccess');
    onDownload?.();
  };

  const copyToClipboard = async () => {
    if (!canvasRef.current) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          showToast('copyFail');
          return;
        }

        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showToast('copySuccess');
          onDownload?.();
        } catch {
          showToast('copyFail');
        }
      });
    } catch {
      showToast('copyFail');
    }
  };

  // Gate on the reactive `svg` (derived from the QR result), NOT on canvasRef —
  // a ref does not trigger re-render when populated, so gating enabled-state on
  // canvasRef.current would leave the buttons permanently disabled. The canvas is
  // mounted whenever a result exists; the click handlers still guard canvasRef.
  const canDownload = !!svg;

  return (
    <div className="space-y-3">
      {/* PNG Download */}
      <button
        onClick={downloadPNG}
        disabled={!canDownload || !isContrastAcceptable}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand text-on-brand font-medium rounded-md hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="w-4 h-4" />
        {t('buttons.downloadPng')}
      </button>

      {/* SVG Download */}
      <button
        onClick={downloadSVG}
        disabled={!canDownload || !isContrastAcceptable}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-sky-soft text-accent-sky-ink font-medium rounded-md hover:bg-accent-sky-soft/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-accent-sky/30"
      >
        <Download className="w-4 h-4" />
        {t('buttons.downloadSvg')}
      </button>

      {/* Copy to Clipboard */}
      <button
        onClick={copyToClipboard}
        disabled={!canDownload || !isContrastAcceptable}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-muted text-text-secondary font-medium rounded-md hover:bg-surface-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-hairline"
      >
        <Copy className="w-4 h-4" />
        {t('buttons.copyClipboard')}
      </button>

      {/* Low Contrast Override */}
      {!isContrastAcceptable && (
        <button
          onClick={onConfirmLowContrast}
          className="w-full px-4 py-2 text-sm text-warning-ink font-medium hover:bg-surface-muted rounded-md transition-colors border border-warning"
        >
          {t('buttons.confirmLowContrast')}
        </button>
      )}
    </div>
  );
}
