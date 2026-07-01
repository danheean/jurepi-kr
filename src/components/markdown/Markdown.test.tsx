import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown, MarkdownInline } from './Markdown';

describe('Markdown (block mode)', () => {
  it('should render bold text as <strong>', () => {
    render(<Markdown>**bold text**</Markdown>);
    const strong = screen.getByText('bold text');
    expect(strong.tagName).toBe('STRONG');
  });

  it('should render italic text as <em>', () => {
    render(<Markdown>*italic text*</Markdown>);
    const em = screen.getByText('italic text');
    expect(em.tagName).toBe('EM');
  });

  it('should render inline code with proper styling', () => {
    render(<Markdown>`const x = 1`</Markdown>);
    const code = screen.getByText('const x = 1');
    expect(code.tagName).toBe('CODE');
    expect(code).toHaveClass('bg-surface-muted');
    expect(code).toHaveClass('text-accent-mint');
  });

  it('should render paragraphs', () => {
    render(<Markdown>This is a paragraph.</Markdown>);
    const p = screen.getByText('This is a paragraph.');
    expect(p.tagName).toBe('P');
  });

  it('should render h2 headings', () => {
    render(<Markdown>## My Heading</Markdown>);
    const h2 = screen.getByText('My Heading');
    expect(h2.tagName).toBe('H2');
  });

  it('should render h3 headings', () => {
    render(<Markdown>### Sub Heading</Markdown>);
    const h3 = screen.getByText('Sub Heading');
    expect(h3.tagName).toBe('H3');
  });

  it('should render unordered lists', () => {
    const { container } = render(<Markdown>{'- item 1\n- item 2'}</Markdown>);
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    const items = container.querySelectorAll('li');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should render ordered lists', () => {
    render(<Markdown>1. first\n2. second</Markdown>);
    const ol = screen.getByRole('list');
    expect(ol.tagName).toBe('OL');
  });

  it('should render external links with target="_blank"', () => {
    render(<Markdown>[Google](https://google.com)</Markdown>);
    const link = screen.getByText('Google') as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.href).toContain('google.com');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
    expect(link.rel).toContain('noreferrer');
  });

  it('should render internal links without target="_blank"', () => {
    render(<Markdown>[About](/about)</Markdown>);
    const link = screen.getByText('About') as HTMLAnchorElement;
    expect(link.href).toContain('/about');
    expect(link.target).not.toBe('_blank');
  });

  it('should render hash links without target="_blank"', () => {
    render(<Markdown>[Section](#section)</Markdown>);
    const link = screen.getByText('Section') as HTMLAnchorElement;
    expect(link.href).toContain('#section');
    expect(link.target).not.toBe('_blank');
  });

  it('should block raw HTML injection', () => {
    const { container } = render(
      <Markdown>Text with &lt;script&gt;alert(1)&lt;/script&gt;</Markdown>
    );
    // Check that script tag is not present or is escaped
    expect(container.querySelector('script')).toBeNull();
  });

  it('should NOT inject script tags from markdown', () => {
    const { container } = render(<Markdown>{"<script>alert('xss')</script>"}</Markdown>);
    expect(container.querySelector('script')).toBeNull();
  });

  it('should render blockquote with proper styling', () => {
    render(<Markdown>{'> This is a quote'}</Markdown>);
    const blockquote = screen.getByText('This is a quote').closest('blockquote');
    expect(blockquote).toHaveClass('border-l-4');
    expect(blockquote).toHaveClass('border-accent-mint');
  });

  it('should accept className prop and apply it', () => {
    const { container } = render(
      <Markdown className="custom-class">text</Markdown>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should wrap content in a div with markdown class', () => {
    const { container } = render(<Markdown>content</Markdown>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('markdown');
  });
});

describe('MarkdownInline', () => {
  it('should render inline content without block wrappers', () => {
    const { container } = render(<MarkdownInline>**bold** text</MarkdownInline>);
    // Check that it renders in a span, not as a div
    const span = container.querySelector('span.markdown');
    expect(span).not.toBeNull();
  });

  it('should render strong in inline mode', () => {
    render(<MarkdownInline>**bold**</MarkdownInline>);
    const strong = screen.getByText('bold');
    expect(strong.tagName).toBe('STRONG');
  });

  it('should NOT render paragraph tags in inline mode', () => {
    const { container } = render(<MarkdownInline>plain text</MarkdownInline>);
    expect(container.querySelector('p')).toBeNull();
  });

  it('should accept className prop', () => {
    const { container } = render(
      <MarkdownInline className="inline-class">text</MarkdownInline>
    );
    const span = container.querySelector('span.markdown');
    expect(span).not.toBeNull();
    expect(span).toHaveClass('inline-class');
  });
});

describe('Markdown security', () => {
  it('should escape HTML entities in markdown', () => {
    const { container } = render(
      <Markdown>This text has &amp; ampersand</Markdown>
    );
    expect(container.textContent).toContain('&');
  });

  it('should not allow iframe injection', () => {
    const { container } = render(
      <Markdown>{"<iframe src='evil.com'></iframe>"}</Markdown>
    );
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('should not allow onclick handlers', () => {
    const { container } = render(
      <Markdown>{"<div onclick='alert(1)'>click</div>"}</Markdown>
    );
    const div = container.querySelector('[onclick]');
    expect(div).toBeNull();
  });
});

describe('Markdown styling tokens', () => {
  it('should apply text-text class to paragraphs', () => {
    render(<Markdown>Text content</Markdown>);
    const p = screen.getByText('Text content');
    expect(p).toHaveClass('text-text-secondary');
  });

  it('should apply text-brand-ink class to links', () => {
    render(<Markdown>[link](/path)</Markdown>);
    const link = screen.getByText('link');
    expect(link).toHaveClass('text-brand-ink');
  });

  it('should render code with accent-mint color', () => {
    render(<Markdown>`code`</Markdown>);
    const code = screen.getByText('code');
    expect(code).toHaveClass('text-accent-mint');
  });
});
