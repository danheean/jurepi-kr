'use client';

import React from 'react';
import MarkdownToJsx from 'markdown-to-jsx';

interface MarkdownProps {
  /** Markdown source string */
  children: string;
  /** Render inline elements only (no block wrappers: p, h2, ul, blockquote) */
  inline?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Override map for block mode elements.
 * Maps markdown elements to DESIGN token-styled components.
 */
const BLOCK_OVERRIDES = {
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
    component: ({ children }: { children: React.ReactNode }) => (
      <pre className="bg-surface-sunken rounded-md overflow-x-auto p-3 mb-3 border border-hairline">
        {children}
      </pre>
    ),
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

/**
 * Override map for inline mode elements.
 * Excludes block-level elements like p, h2, ul, blockquote.
 */
const INLINE_OVERRIDES = {
  strong: BLOCK_OVERRIDES.strong,
  em: BLOCK_OVERRIDES.em,
  code: BLOCK_OVERRIDES.code,
  a: BLOCK_OVERRIDES.a,
};

/**
 * Markdown → JSX React component using markdown-to-jsx.
 * Overrides elements to DESIGN.md prose tokens.
 * Disables raw HTML injection.
 * External links: target="_blank" + rel="noopener noreferrer".
 */
export function Markdown({ children, inline = false, className = '' }: MarkdownProps) {
  const overrides = inline ? INLINE_OVERRIDES : BLOCK_OVERRIDES;

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
