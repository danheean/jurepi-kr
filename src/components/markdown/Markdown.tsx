'use client';

import React, { lazy, Suspense } from 'react';
import MarkdownToJsx from 'markdown-to-jsx';
import { CodeBlock } from './CodeBlock';
import { MermaidDiagram } from './MermaidDiagram';
import { MarkdownImage } from './MarkdownImage';

interface MarkdownProps {
  /** Markdown source string */
  children: string;
  /** Render inline elements only (no block wrappers: p, h2, ul, blockquote) */
  inline?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Enable syntax highlighting for code blocks (default: false) */
  enableCodeHighlight?: boolean;
  /** Enable mermaid diagram rendering (default: false) */
  enableMermaid?: boolean;
  /** Enable rich image rendering with lazy loading and captions (default: false) */
  enableRichImages?: boolean;
  /** Localized label for the code-block copy button (default: English) */
  codeCopyLabel?: string;
  /** Localized label shown after a successful copy (default: English) */
  codeCopiedLabel?: string;
  /** Localized label for the mermaid source fallback (default: English) */
  mermaidSourceLabel?: string;
}

/** Localized labels forwarded to CodeBlock / MermaidDiagram. */
interface MarkdownLabels {
  codeCopyLabel?: string;
  codeCopiedLabel?: string;
  mermaidSourceLabel?: string;
}

/**
 * Helper: extract code text from markdown-to-jsx pre's code child.
 * The children is typically a React element (the <code> tag).
 */
function extractCodeFromPre(children: React.ReactNode): {
  code: string;
  className?: string;
} {
  // If children is a React element with children prop
  if (React.isValidElement(children)) {
    const codeEl = children as React.ReactElement<any>;
    const className = (codeEl.props?.className as string) || '';

    // Extract text from code element's children
    let code = '';
    if (typeof codeEl.props?.children === 'string') {
      code = codeEl.props.children;
    } else if (Array.isArray(codeEl.props?.children)) {
      code = (codeEl.props.children as Array<any>)
        .map((child: any) => (typeof child === 'string' ? child : ''))
        .join('');
    }

    return { code, className };
  }

  return { code: '' };
}

/**
 * Override map for block mode elements.
 * Maps markdown elements to DESIGN token-styled components.
 * Conditionally includes enhanced code/image overrides based on props.
 */
function getBlockOverrides(
  enableCodeHighlight: boolean,
  enableMermaid: boolean,
  enableRichImages: boolean,
  labels: MarkdownLabels = {}
): Record<string, any> {
  const overrides: Record<string, any> = {
    h2: {
      component: ({ children }: { children: React.ReactNode }) => (
        <h2 className="text-headline text-text font-bold mt-4 mb-2">{children}</h2>
      ),
    },
    h3: {
      component: ({ children }: { children: React.ReactNode }) => (
        <h3 className="text-body-lg text-text font-semibold mt-3 mb-2">{children}</h3>
      ),
    },
    h4: {
      component: ({ children }: { children: React.ReactNode }) => (
        <h4 className="text-body font-semibold text-text mt-2 mb-1">{children}</h4>
      ),
    },
    p: {
      component: ({ children }: { children: React.ReactNode }) => (
        <p className="text-body text-text-secondary leading-relaxed mb-3">{children}</p>
      ),
    },
    strong: {
      component: ({ children }: { children: React.ReactNode }) => (
        <strong className="font-semibold text-text">{children}</strong>
      ),
    },
    em: {
      component: ({ children }: { children: React.ReactNode }) => (
        <em className="italic text-text-secondary">{children}</em>
      ),
    },
    code: {
      component: ({ children }: { children: React.ReactNode }) => (
        <code className="bg-surface-muted text-accent-mint px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      ),
    },
    pre: {
      component: ({ children }: { children: React.ReactNode }) => {
        if (enableCodeHighlight || enableMermaid) {
          const { code, className } = extractCodeFromPre(children);

          // Check if it's a mermaid block
          if (enableMermaid && className?.includes('lang-mermaid')) {
            return (
              <MermaidDiagram sourceLabel={labels.mermaidSourceLabel}>
                {code}
              </MermaidDiagram>
            );
          }

          // If enableCodeHighlight, use CodeBlock for any language
          if (enableCodeHighlight) {
            return (
              <CodeBlock
                className={className}
                copyLabel={labels.codeCopyLabel}
                copiedLabel={labels.codeCopiedLabel}
              >
                {code}
              </CodeBlock>
            );
          }
        }

        // Fallback: default pre styling
        return (
          <pre className="bg-surface-sunken rounded-md overflow-x-auto p-3 mb-3 border border-hairline">
            {children}
          </pre>
        );
      },
    },
    ul: {
      component: ({ children }: { children: React.ReactNode }) => (
        <ul className="list-disc list-inside text-body text-text-secondary mb-3 space-y-1">
          {children}
        </ul>
      ),
    },
    ol: {
      component: ({ children }: { children: React.ReactNode }) => (
        <ol className="list-decimal list-inside text-body text-text-secondary mb-3 space-y-1">
          {children}
        </ol>
      ),
    },
    li: {
      component: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
    },
    a: {
      component: (props: { children: React.ReactNode; href?: string }) => {
        const { children, href = '' } = props;
        const isExternal = href.startsWith('http');

        return (
          <a
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="text-brand-ink underline hover:text-brand-ink-strong transition-colors"
          >
            {children}
          </a>
        );
      },
    },
    blockquote: {
      component: ({ children }: { children: React.ReactNode }) => (
        <blockquote className="border-l-4 border-accent-mint italic text-text-muted pl-4 mb-3">
          {children}
        </blockquote>
      ),
    },
  };

  // Add img override only if enableRichImages is true
  if (enableRichImages) {
    overrides.img = {
      component: (props: { src?: string; alt?: string }) => (
        <MarkdownImage src={props.src} alt={props.alt} />
      ),
    };
  }

  return overrides;
}

/**
 * Get inline overrides (excludes block-level elements).
 * Reuses relevant components from block overrides.
 */
function getInlineOverrides(
  enableCodeHighlight: boolean,
  enableMermaid: boolean,
  enableRichImages: boolean
) {
  const blockOverrides = getBlockOverrides(enableCodeHighlight, enableMermaid, enableRichImages);

  return {
    strong: blockOverrides.strong,
    em: blockOverrides.em,
    code: blockOverrides.code,
    a: blockOverrides.a,
  };
}

/**
 * Markdown → JSX React component using markdown-to-jsx.
 * Overrides elements to DESIGN.md prose tokens.
 * Disables raw HTML injection.
 * External links: target="_blank" + rel="noopener noreferrer".
 *
 * New optional features (all default false for backward compatibility):
 * - enableCodeHighlight: use CodeBlock with syntax highlighting
 * - enableMermaid: render ```mermaid blocks as diagrams
 * - enableRichImages: use MarkdownImage with lazy loading and captions
 */
export function Markdown({
  children,
  inline = false,
  className = '',
  enableCodeHighlight = false,
  enableMermaid = false,
  enableRichImages = false,
  codeCopyLabel,
  codeCopiedLabel,
  mermaidSourceLabel,
}: MarkdownProps) {
  const labels: MarkdownLabels = { codeCopyLabel, codeCopiedLabel, mermaidSourceLabel };
  const blockOverrides = getBlockOverrides(
    enableCodeHighlight,
    enableMermaid,
    enableRichImages,
    labels
  );
  const inlineOverrides = getInlineOverrides(enableCodeHighlight, enableMermaid, enableRichImages);
  const overrides = inline ? inlineOverrides : blockOverrides;

  const content = (
    <MarkdownToJsx
      options={{
        overrides,
        disableParsingRawHTML: true,
        forceBlock: !inline,
        forceInline: inline,
      }}
    >
      {children}
    </MarkdownToJsx>
  );

  if (inline) {
    return (
      <span className={`markdown inline ${className}`.trim()}>
        {content}
      </span>
    );
  }

  return (
    <div className={`markdown block ${className}`.trim()}>
      {content}
    </div>
  );
}

/**
 * Inline variant: renders only inline emphasis, code, links.
 * Use for definition snippets, example highlights.
 */
export function MarkdownInline({
  children,
  className = '',
}: Omit<MarkdownProps, 'inline'>) {
  return <Markdown inline={true} children={children} className={className} />;
}
