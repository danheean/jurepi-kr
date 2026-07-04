'use client';

import { useEffect, useRef } from 'react';
import { useJsonFormatter } from './useJsonFormatter';
import { JsonInput } from './JsonInput';
import { FormatOptions } from './FormatOptions';
import { UrlLoader } from './UrlLoader';
import { OutputPane } from './OutputPane';
import { JsonFormatterStats } from './JsonFormatterStats';

interface JsonFormatterProps {
  children?: React.ReactNode; // For SEO sections rendered outside
}

export function JsonFormatter({ children }: JsonFormatterProps) {
  const [state, actions] = useJsonFormatter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;

      // Ctrl+Enter: format
      if (isMeta && e.key === 'Enter') {
        e.preventDefault();
        actions.format();
      }

      // Ctrl+Shift+M: minify
      if (isMeta && e.shiftKey && e.key === 'm') {
        e.preventDefault();
        actions.minify();
      }

      // Ctrl+C: copy (when output is valid)
      if (isMeta && e.key === 'c' && state.parseResult.success) {
        // Let default copy happen, but ensure our copy works
        // Note: this is secondary to the button
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, state.parseResult.success]);

  return (
    <>
      {/* SEO Sections (outside mounted gate) */}
      {children}

      {/* Main Interactive Area */}
      <div className="space-y-6 mt-8">
        {/* URL Loader */}
        <UrlLoader
          isLoading={state.isLoading}
          error={state.error}
          onLoad={actions.loadFromUrl}
          onClearError={() => {
            // Clear error by re-rendering (state management)
          }}
        />

        {/* Two-Column Layout: Desktop | Stacked: Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input */}
          <div className="space-y-4">
            <JsonInput
              ref={textareaRef}
              value={state.input}
              onChange={(e) => actions.setInput(e.target.value)}
            />
            <FormatOptions
              indent={state.indent}
              sortKeys={state.sortKeys}
              isValid={state.parseResult.success}
              onIndentChange={actions.setIndent}
              onSortKeysToggle={actions.toggleSortKeys}
              onFormat={actions.format}
              onMinify={actions.minify}
              onClear={actions.clear}
            />
          </div>

          {/* Right Column: Output */}
          <div className="flex flex-col">
            <OutputPane
              parseResult={state.parseResult}
              stats={state.stats}
              onCopy={actions.copyFormatted}
              onDownload={actions.downloadJson}
              className="flex-1"
            />
          </div>
        </div>

        {/* Stats */}
        <JsonFormatterStats stats={state.stats} />
      </div>
    </>
  );
}
