'use client';

import React, { useEffect, useState } from 'react';

interface MermaidDiagramProps {
  /** Raw mermaid source code */
  children: string;
  /** Label for the source fallback (e.g., "Diagram source") */
  sourceLabel?: string;
}

/**
 * MermaidDiagram: renders mermaid diagrams from markdown ```mermaid blocks.
 * SSR/initial render: the raw source is visible in the prerendered HTML — this
 * is both the crawlable text (GEO) and the honest fallback when JS is off or a
 * diagram fails to parse.
 * On mount: dynamically imports mermaid (code-split), renders to an SVG string,
 * and injects it through React (dangerouslySetInnerHTML) so React owns the node
 * and never wipes it. Re-renders on theme change.
 */
export function MermaidDiagram({
  children,
  sourceLabel = 'Diagram source',
}: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        const theme =
          document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme });

        // Unique id per render call (NOT the container's id — mermaid uses it
        // for a temporary measurement node and a duplicate id breaks rendering).
        const renderId = `mmd-${Math.random().toString(36).slice(2)}`;
        const { svg: out } = await mermaid.render(renderId, children);
        if (!cancelled) {
          setSvg(out);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setSvg(null);
          setFailed(true);
        }
      }
    };

    renderDiagram();

    // Re-render on app theme toggle so the diagram matches light/dark.
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.attributeName === 'data-theme')) {
        renderDiagram();
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [children]);

  if (svg && !failed) {
    return (
      <figure className="bg-surface-muted rounded-md border border-hairline overflow-x-auto mb-3 p-3">
        <div
          className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
          // SVG comes from mermaid with securityLevel:'strict' (no scripts / raw HTML).
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </figure>
    );
  }

  // Fallback: the source stays visible (prerender + JS-off + parse failure).
  return (
    <figure className="bg-surface-muted rounded-md border border-hairline overflow-x-auto mb-3 p-3">
      <pre className="font-mono text-sm text-text-secondary whitespace-pre-wrap break-words">
        {children}
      </pre>
      <figcaption className="text-xs text-text-muted mt-2 italic">{sourceLabel}</figcaption>
    </figure>
  );
}
