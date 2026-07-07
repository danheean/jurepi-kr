import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownImage } from './MarkdownImage';

describe('MarkdownImage', () => {
  it('should render figure with img', () => {
    const { container } = render(
      <MarkdownImage src="/images/howto/example.png" alt="Example image" />
    );

    const figure = container.querySelector('figure');
    expect(figure).toBeInTheDocument();

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.src).toContain('/images/howto/example.png');
  });

  it('should render figcaption from alt text', () => {
    render(
      <MarkdownImage src="/images/howto/example.png" alt="This is an example" />
    );

    expect(screen.getByText('This is an example')).toBeInTheDocument();
  });

  it('should NOT render figcaption when alt is empty', () => {
    const { container } = render(
      <MarkdownImage src="/images/howto/example.png" alt="" />
    );

    expect(container.querySelector('figcaption')).not.toBeInTheDocument();
  });

  it('should set lazy loading and async decoding', () => {
    const { container } = render(
      <MarkdownImage src="/images/howto/example.png" alt="Test" />
    );

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('should allow https:// URLs', () => {
    const { container } = render(
      <MarkdownImage
        src="https://example.com/image.png"
        alt="External image"
      />
    );

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });

  it('should allow /images/* URLs', () => {
    const { container } = render(
      <MarkdownImage src="/images/test/photo.jpg" alt="Test" />
    );

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });

  it('should reject javascript: URLs', () => {
    const { container } = render(
      <MarkdownImage src="javascript:alert('xss')" alt="Malicious" />
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('should reject data: URLs', () => {
    const { container } = render(
      <MarkdownImage src="data:text/html,<script>alert(1)</script>" alt="Bad" />
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('should reject relative URLs that are not /images/*', () => {
    const { container } = render(
      <MarkdownImage src="../../../etc/passwd" alt="Path traversal" />
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('should apply proper styling classes', () => {
    const { container } = render(
      <MarkdownImage src="/images/test.png" alt="Styled image" />
    );

    const img = container.querySelector('img');
    expect(img).toHaveClass('max-w-full', 'h-auto', 'rounded-md', 'border', 'border-hairline');
  });

  it('should hide figure on error', () => {
    const { container } = render(
      <MarkdownImage src="/images/test.png" alt="Test" />
    );

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();

    // Simulate error event
    fireEvent.error(img);

    expect(container.querySelector('figure')).not.toBeInTheDocument();
  });

  it('should render nothing if no src provided', () => {
    const { container } = render(
      <MarkdownImage alt="No source" />
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('should handle missing alt gracefully', () => {
    const { container } = render(
      <MarkdownImage src="/images/test.png" />
    );

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', '');
  });
});
