'use client';

import React, { useEffect, useState } from 'react';

interface CodeBlockProps {
  /** Raw code text */
  children: string;
  /** Language class from markdown-to-jsx: 'lang-typescript', 'lang-bash', etc. */
  className?: string;
  /** aria-label for copy button (e.g., "Copy code") */
  copyLabel?: string;
  /** Label shown after successful copy (e.g., "Copied") */
  copiedLabel?: string;
}

/**
 * CodeBlock: syntax-highlighted fenced code block with copy button.
 * highlight.js is dynamically imported (code-split) so it doesn't burden other routes.
 */
export function CodeBlock({
  children,
  className = '',
  copyLabel = 'Copy code',
  copiedLabel = 'Copied',
}: CodeBlockProps) {
  const [highlighted, setHighlighted] = useState(children);
  const [copied, setCopied] = useState(false);

  // Extract language from className: 'lang-typescript' → 'typescript'
  const languageMatch = className.match(/lang-(\w+)/);
  const rawLanguage = languageMatch?.[1] || 'plaintext';

  // Normalize language names for highlight.js
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    shell: 'bash',
    py: 'python',
    yml: 'yaml',
    md: 'markdown',
  };

  const language = languageMap[rawLanguage] || rawLanguage;

  // Curated languages supported by highlight.js (to keep bundle bounded)
  const SUPPORTED_LANGS = [
    'bash',
    'shell',
    'typescript',
    'tsx',
    'javascript',
    'json',
    'python',
    'yaml',
    'diff',
    'http',
    'sql',
    'plaintext',
  ];

  const displayLanguage = SUPPORTED_LANGS.includes(language) ? language : 'plaintext';

  // Dynamically import and apply highlight.js
  useEffect(() => {
    (async () => {
      try {
        // Dynamic import so highlight.js is code-split off other routes
        const hljsModule = await import('highlight.js/lib/core');
        const hljs = hljsModule.default;

        // Register only curated languages
        const bash = await import('highlight.js/lib/languages/bash');
        const typescript = await import('highlight.js/lib/languages/typescript');
        const javascript = await import('highlight.js/lib/languages/javascript');
        const json = await import('highlight.js/lib/languages/json');
        const python = await import('highlight.js/lib/languages/python');
        const yaml = await import('highlight.js/lib/languages/yaml');
        const diff = await import('highlight.js/lib/languages/diff');
        const http = await import('highlight.js/lib/languages/http');
        const sql = await import('highlight.js/lib/languages/sql');

        hljs.registerLanguage('bash', bash.default);
        hljs.registerLanguage('shell', bash.default);
        hljs.registerLanguage('typescript', typescript.default);
        hljs.registerLanguage('tsx', typescript.default);
        hljs.registerLanguage('javascript', javascript.default);
        hljs.registerLanguage('json', json.default);
        hljs.registerLanguage('python', python.default);
        hljs.registerLanguage('yaml', yaml.default);
        hljs.registerLanguage('diff', diff.default);
        hljs.registerLanguage('http', http.default);
        hljs.registerLanguage('sql', sql.default);
        hljs.registerLanguage('plaintext', () => ({
          contains: [],
        }));

        const result = hljs.highlight(children, {
          language: displayLanguage,
          ignoreIllegals: true,
        });

        setHighlighted(result.value);
      } catch (error) {
        // If highlight.js fails or language not supported, fall back to plain code
        setHighlighted(children);
      }
    })();
  }, [children, displayLanguage]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: use execCommand
      try {
        const textarea = document.createElement('textarea');
        textarea.value = children;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch {
        // Silent fail: no toast/error feedback, button just doesn't show success
      }
    }
  };

  return (
    <figure className="bg-surface-sunken rounded-md border border-hairline overflow-hidden mb-3">
      {/* Header: language label + copy button */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-muted border-b border-hairline">
        <span className="text-xs font-mono font-semibold text-text-secondary uppercase">
          {displayLanguage}
        </span>
        <button
          onClick={handleCopy}
          aria-label={copyLabel}
          title={copyLabel}
          className="text-xs px-2 py-1 rounded bg-accent-sky text-text hover:bg-accent-sky/80 transition-colors"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>

      {/* Code block */}
      <pre className="overflow-x-auto p-3 font-mono text-sm text-text leading-relaxed">
        <code
          dangerouslySetInnerHTML={{ __html: highlighted }}
          className="hljs"
        />
      </pre>
    </figure>
  );
}
