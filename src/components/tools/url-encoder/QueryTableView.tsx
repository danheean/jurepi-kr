'use client';

import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { QueryTableRow } from '@/lib/url-encoder/query-parser';
import { serializeQueryTable, editRow, deleteRow, addRow } from '@/lib/url-encoder/query-parser';

interface Props {
  rows: QueryTableRow[];
  rawInput: string;
  onRowsChange: (rows: QueryTableRow[]) => void;
  onInputChange: (input: string) => void;
  onRebuild: (query: string) => Promise<void>;
  isLoading?: boolean;
}

export function QueryTableView({
  rows,
  rawInput,
  onRowsChange,
  onInputChange,
  onRebuild,
  isLoading,
}: Props) {
  const t = useTranslations('tools.url-encoder');
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'component' | 'uri'>('component');
  const [charset, setCharset] = useState<'utf-8' | 'euc-kr'>('utf-8');
  const [rebuilding, setRebuilding] = useState(false);

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const query = await serializeQueryTable(rows, mode, charset);
      await onRebuild(query);
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
          isOpen
            ? 'bg-accent-grape text-white'
            : 'bg-surface-muted text-text hover:bg-hairline-strong'
        }`}
        aria-expanded={isOpen}
        aria-label={t('queryTable.label')}
      >
        {t('queryTable.label')}
      </button>

      {isOpen && (
        <div className="space-y-4 p-4 bg-surface-muted rounded-lg border border-hairline">
          {rows.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-8">{t('queryTable.emptyState')}</p>
          ) : (
            <div className="space-y-2">
              {rows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => onRowsChange(editRow(rows, idx, e.target.value, row.value))}
                    placeholder={t('queryTable.keyPlaceholder')}
                    className="flex-1 px-3 py-2 bg-surface border border-hairline rounded text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  />
                  <span className="text-text-secondary">=</span>
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => onRowsChange(editRow(rows, idx, row.key, e.target.value))}
                    placeholder={t('queryTable.valuePlaceholder')}
                    className="flex-1 px-3 py-2 bg-surface border border-hairline rounded text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  />
                  <button
                    onClick={() => onRowsChange(deleteRow(rows, idx))}
                    className="p-2 text-danger-ink hover:bg-danger/10 rounded transition"
                    aria-label={t('queryTable.deleteRow')}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onRowsChange(addRow(rows))}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-accent-grape hover:bg-accent-grape/10 rounded transition"
            aria-label={t('queryTable.addRow')}
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            {t('queryTable.addRow')}
          </button>

          <button
            onClick={handleRebuild}
            disabled={rebuilding || isLoading}
            className="w-full px-4 py-2 bg-accent-grape text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            aria-label={t('queryTable.rebuild')}
          >
            {rebuilding ? 'Building...' : t('queryTable.rebuild')}
          </button>
        </div>
      )}
    </div>
  );
}
