import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Copy, Check, AlertTriangle } from 'lucide-react';

interface ExportButtonProps {
  resultBlob?: Blob;
  canExport: boolean;
  onDownload: () => Promise<Blob | null>;
  onCopyClipboard: () => Promise<boolean>;
}

type FeedbackState = 'idle' | 'success' | 'fail';

const FEEDBACK_DURATION_MS = 2000;

export function ExportButton({
  resultBlob,
  canExport,
  onDownload,
  onCopyClipboard,
}: ExportButtonProps) {
  const t = useTranslations('tools.transparent-background');
  const [downloadState, setDownloadState] = useState<FeedbackState>('idle');
  const [copyState, setCopyState] = useState<FeedbackState>('idle');

  const showDownloadFeedback = (state: FeedbackState) => {
    setDownloadState(state);
    setTimeout(() => setDownloadState('idle'), FEEDBACK_DURATION_MS);
  };

  const showCopyFeedback = (state: FeedbackState) => {
    setCopyState(state);
    setTimeout(() => setCopyState('idle'), FEEDBACK_DURATION_MS);
  };

  const handleDownload = async () => {
    try {
      const blob = await onDownload();
      if (!blob) {
        showDownloadFeedback('fail');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transparent-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showDownloadFeedback('success');
    } catch (err) {
      showDownloadFeedback('fail');
    }
  };

  const handleCopy = async () => {
    try {
      const succeeded = await onCopyClipboard();
      showCopyFeedback(succeeded ? 'success' : 'fail');
    } catch (err) {
      showCopyFeedback('fail');
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        onClick={handleDownload}
        disabled={!canExport}
        aria-live="polite"
        className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
          downloadState === 'fail'
            ? 'bg-danger text-white'
            : canExport
              ? 'bg-brand text-on-brand hover:bg-brand-strong'
              : 'cursor-not-allowed bg-surface-muted text-text-muted'
        }`}
        title={!canExport ? t('export.downloadDisabled') : undefined}
      >
        {downloadState === 'success' && (
          <>
            <Check className="h-5 w-5" />
            {t('export.downloadSuccess')}
          </>
        )}
        {downloadState === 'fail' && (
          <>
            <AlertTriangle className="h-5 w-5" />
            {t('export.downloadFail')}
          </>
        )}
        {downloadState === 'idle' && (
          <>
            <Download className="h-5 w-5" />
            {t('export.download')}
          </>
        )}
      </button>

      <button
        onClick={handleCopy}
        disabled={!canExport}
        aria-live="polite"
        className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
          copyState === 'fail'
            ? 'border border-danger bg-surface-muted text-danger-ink'
            : canExport
              ? 'border border-hairline bg-surface-muted text-text hover:bg-surface-sunken'
              : 'cursor-not-allowed border border-hairline bg-surface-muted text-text-muted'
        }`}
        title={!canExport ? t('export.downloadDisabled') : undefined}
      >
        {copyState === 'success' && (
          <>
            <Check className="h-5 w-5" />
            {t('export.copySuccess')}
          </>
        )}
        {copyState === 'fail' && (
          <>
            <AlertTriangle className="h-5 w-5" />
            {t('export.copyFail')}
          </>
        )}
        {copyState === 'idle' && (
          <>
            <Copy className="h-5 w-5" />
            {t('export.copy')}
          </>
        )}
      </button>
    </div>
  );
}
