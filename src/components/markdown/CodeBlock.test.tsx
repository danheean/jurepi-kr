import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';

describe('CodeBlock', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render code text', () => {
    const code = 'const x = 1;';
    render(<CodeBlock>{code}</CodeBlock>);

    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('should render language label in uppercase', () => {
    const code = 'console.log("hello")';
    const { container } = render(<CodeBlock className="lang-javascript">{code}</CodeBlock>);

    const span = container.querySelector('span.uppercase');
    expect(span?.textContent).toContain('javascript');
    expect(span).toHaveClass('uppercase');
  });

  it('should render language as plaintext when unknown', () => {
    const code = 'some code';
    const { container } = render(<CodeBlock className="lang-unknown">{code}</CodeBlock>);

    const span = container.querySelector('span.uppercase');
    expect(span?.textContent).toContain('plaintext');
    expect(span).toHaveClass('uppercase');
  });

  it('should render copy button with aria-label', () => {
    const code = 'test code';
    render(<CodeBlock copyLabel="Copy code">{code}</CodeBlock>);

    const button = screen.getByLabelText('Copy code');
    expect(button).toBeInTheDocument();
  });

  it('should show copied label after successful copy', async () => {
    const code = 'test';
    const { rerender } = render(
      <CodeBlock copyLabel="Copy code" copiedLabel="Copied">
        {code}
      </CodeBlock>
    );

    const button = screen.getByLabelText('Copy code');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('should normalize language aliases (ts → typescript)', () => {
    const code = 'const x: string = "test"';
    const { container } = render(<CodeBlock className="lang-ts">{code}</CodeBlock>);

    const span = container.querySelector('span.uppercase');
    expect(span?.textContent).toContain('typescript');
  });

  it('should normalize language aliases (js → javascript)', () => {
    const code = 'var x = 1';
    const { container } = render(<CodeBlock className="lang-js">{code}</CodeBlock>);

    const span = container.querySelector('span.uppercase');
    expect(span?.textContent).toContain('javascript');
  });

  it('should render with custom copy label', () => {
    render(<CodeBlock copyLabel="복사">{`code`}</CodeBlock>);

    expect(screen.getByLabelText('복사')).toBeInTheDocument();
  });

  it('should have border and rounded styling', () => {
    const { container } = render(<CodeBlock>code</CodeBlock>);
    const figure = container.querySelector('figure');

    expect(figure).toHaveClass('border', 'border-hairline', 'rounded-md');
  });

  it('should handle empty code gracefully', () => {
    const { container } = render(<CodeBlock>{''}</CodeBlock>);

    expect(container).toBeInTheDocument();
  });
});
