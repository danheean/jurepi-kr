'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ParseResult, JsonStats } from '@/lib/json-formatter';
import { SyntaxHighlight } from './SyntaxHighlight';
import { JsonTreeView } from './JsonTreeView';
import { ErrorMessage } from './ErrorMessage';

interface OutputPaneProps {
  parseResult: ParseResult;
  stats: JsonStats | null;
  onCopy: () => Promise<boolean>;
  onDownload: (filename: string) => void;
  className?: string;
}

type TabType = 'formatted' | 'tree';

const TABS: { id: TabType; labelKey: string }[] = [
  { id: 'formatted', labelKey: 'output.formatTab' },
  { id: 'tree', labelKey: 'output.treeTab' },
];

export function OutputPane({
  parseResult,
  stats,
  onCopy,
  onDownload,
  className = '',
}: OutputPaneProps) {
  const t = useTranslations('tools.json-formatter');
  const [activeTab, setActiveTab] = useState<TabType>('formatted');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await onCopy();
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1600);
    }
  }, [onCopy]);

  const handleDownload = useCallback(() => {
    onDownload(t('output.downloadFilename'));
  }, [onDownload, t]);

  const hasOutput = parseResult.success && parseResult.output;

  // Roving-tabindex arrow navigation between the two tabs (WAI-ARIA tabs pattern).
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next: TabType = activeTab === 'formatted' ? 'tree' : 'formatted';
    setActiveTab(next);
    e.currentTarget
      .querySelector<HTMLButtonElement>(`#json-tab-${next}`)
      ?.focus();
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tab Selection */}
      <div
        role="tablist"
        className="flex border-b border-hairline"
        onKeyDown={handleTabKeyDown}
      >
        {TABS.map(({ id, labelKey }) => {
          const selected = activeTab === id;
          return (
            <button
              key={id}
              id={`json-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="json-output-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(id)}
              className={`
                min-h-[44px] px-4 py-2.5 -mb-px text-sm font-medium border-b-2
                transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset
                ${
                  selected
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-secondary hover:text-text'
                }
              `}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      {/* Output Area */}
      <div
        id="json-output-panel"
        role="tabpanel"
        aria-labelledby={`json-tab-${activeTab}`}
        tabIndex={0}
        className="flex-1 overflow-auto min-h-64"
      >
        {!parseResult.success ? (
          <div className="p-4">
            {parseResult.error ? (
              <ErrorMessage
                line={parseResult.error.line}
                column={parseResult.error.column}
                token={parseResult.error.token}
                context={parseResult.error.context}
              />
            ) : (
              <p className="text-text-secondary text-sm">
                {t('input.placeholder')}
              </p>
            )}
          </div>
        ) : activeTab === 'formatted' ? (
          <SyntaxHighlight json={parseResult.output || ''} />
        ) : (
          <JsonTreeView json={parseResult.json} />
        )}
      </div>

      {/* Action Buttons */}
      {hasOutput && (
        <div className="flex gap-2 p-4 border-t border-surface-muted">
          <Button
            onClick={handleCopy}
            variant="secondary"
            className={`flex-1 sm:flex-none ${
              copyFeedback ? 'bg-success text-on-success' : ''
            }`}
          >
            <Copy className="w-4 h-4 mr-2" />
            {copyFeedback ? t('output.copySuccess') : t('output.copy')}
          </Button>
          <Button
            onClick={handleDownload}
            variant="secondary"
            className="flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('output.download')}
          </Button>
        </div>
      )}
    </div>
  );
}
