'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { type DateKey } from '@/lib/qna-a-day/date';
import { type DailyJournalState, type DailyJournalActions } from './useDailyJournal';

interface SettingsPanelProps extends DailyJournalState, DailyJournalActions {
  testId?: string;
}

export function SettingsPanel({
  totalAnswered,
  exportJson,
  importJson,
  reset,
  storageError,
  mounted,
  testId,
}: SettingsPanelProps) {
  const t = useTranslations('tools.qna-a-day');
  const [importing, setImporting] = useState(false);
  const [importDiff, setImportDiff] = useState<{
    newCount: number;
    conflictCount: number;
  } | null>(null);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace'>('merge');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const { blob, filename } = exportJson();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB cap)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('settings.importInvalid'));
      return;
    }

    setImporting(true);
    try {
      const result = await importJson(file, importStrategy);
      if (result.success) {
        setImportDiff({ newCount: 0, conflictCount: 0 });
        alert('가져오기 완료');
        setImportDiff(null);
      } else {
        alert(t('settings.importInvalid'));
      }
    } finally {
      setImporting(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (resetConfirmText.toLowerCase() === '모두 삭제') {
      reset();
      setShowResetConfirm(false);
      setResetConfirmText('');
      alert('모든 기록이 삭제되었습니다.');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="space-y-8"
      data-testid={testId ? `${testId}-settings-panel` : undefined}
    >
      {/* Storage error warning */}
      {storageError.type && (
        <div className="p-4 rounded-lg bg-semantic-error/10 border border-semantic-error/30">
          <p className="text-sm font-medium text-semantic-error mb-2">
            {storageError.type === 'UNAVAILABLE'
              ? t('settings.storageUnavailable')
              : storageError.type === 'QUOTA_EXCEEDED'
                ? t('settings.quotaExceeded')
                : t('settings.corruptRecovered')}
          </p>
          {storageError.type === 'CORRUPT' && (
            <button className="text-sm text-semantic-error hover:text-semantic-error-dark font-medium">
              {t('settings.downloadCorrupt')}
            </button>
          )}
        </div>
      )}

      {/* Export section */}
      <div className="space-y-3">
        <h3 className="text-body-lg font-medium text-text">
          {t('settings.exportTitle')}
        </h3>
        <p className="text-body text-text-secondary">
          {totalAnswered > 0
            ? `${totalAnswered}개의 기록이 준비되었습니다.`
            : '아직 기록이 없습니다.'}
        </p>
        <button
          onClick={handleExport}
          disabled={totalAnswered === 0}
          className="px-4 py-2.5 rounded-lg bg-brand text-white font-medium text-sm hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('settings.exportButton')}
        </button>
      </div>

      {/* Import section */}
      <div className="space-y-3">
        <h3 className="text-body-lg font-medium text-text">
          {t('settings.importTitle')}
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelected}
          className="hidden"
        />
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="px-4 py-2.5 rounded-lg border border-brand text-brand font-medium text-sm hover:bg-brand hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {importing ? '가져오는 중...' : t('settings.importButton')}
        </button>

        {importDiff && (
          <div className="p-4 rounded-lg bg-accent-grape-soft space-y-3">
            <p className="text-body text-text">
              {t('settings.importDiffSummary', {
                newCount: importDiff.newCount,
                conflictCount: importDiff.conflictCount,
              })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setImportStrategy('merge');
                  handleFileSelected({
                    target: { files: [new File([], '')] },
                  } as any);
                }}
                className="px-3 py-1.5 rounded text-sm font-medium bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                {t('settings.importMerge')}
              </button>
              <button
                onClick={() => {
                  setImportStrategy('replace');
                  handleFileSelected({
                    target: { files: [new File([], '')] },
                  } as any);
                }}
                className="px-3 py-1.5 rounded text-sm font-medium bg-surface-muted text-text hover:bg-surface-muted-hover transition-colors"
              >
                {t('settings.importReplace')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reset section */}
      <div className="space-y-3">
        <h3 className="text-body-lg font-medium text-text">
          {t('settings.resetTitle')}
        </h3>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-4 py-2.5 rounded-lg bg-semantic-error/10 text-semantic-error font-medium text-sm hover:bg-semantic-error/20 transition-colors"
        >
          {t('settings.resetButton')}
        </button>

        {showResetConfirm && (
          <div className="p-4 rounded-lg border-2 border-semantic-error space-y-3 bg-surface">
            <div>
              <p className="font-medium text-text mb-1">
                {t('settings.resetConfirm')}
              </p>
              <p className="text-body-sm text-text-secondary">
                {t('settings.resetConfirmBody')}
              </p>
            </div>
            <input
              type="text"
              placeholder="'모두 삭제'를 입력하세요"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              className="w-full px-3 py-2 rounded border border-semantic-error text-body transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={resetConfirmText.toLowerCase() !== '모두 삭제'}
                className="flex-1 px-3 py-2 rounded bg-semantic-error text-white font-medium text-sm hover:bg-semantic-error-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                삭제
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetConfirmText('');
                }}
                className="flex-1 px-3 py-2 rounded bg-surface-muted text-text font-medium text-sm hover:bg-surface-muted-hover transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy section */}
      <div className="space-y-3 p-4 rounded-lg bg-surface-muted">
        <h3 className="text-body font-medium text-text">
          {t('settings.privacyTitle')}
        </h3>
        <p className="text-body-sm text-text-secondary">
          {t('settings.privacyBody')}
        </p>
      </div>
    </div>
  );
}
