import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MermaidDiagram } from './MermaidDiagram';

// Mock the mermaid module to avoid actual render attempts in jsdom
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(() => Promise.reject(new Error('mermaid render in test'))),
  },
}));

describe('MermaidDiagram', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should render source code as fallback', () => {
    const source = 'graph TD;\n    A-->B';
    render(<MermaidDiagram>{source}</MermaidDiagram>);

    // Source should be visible in the pre tag
    expect(screen.getByText(/A-->B/)).toBeInTheDocument();
  });

  it('should render source label as figcaption when fallback is visible', () => {
    const source = 'flowchart LR;\n    A-->B';
    render(<MermaidDiagram sourceLabel="Diagram source">{source}</MermaidDiagram>);

    expect(screen.getByText('Diagram source')).toBeInTheDocument();
  });

  it('should have proper container structure', () => {
    const { container } = render(
      <MermaidDiagram>{`graph TD; A-->B`}</MermaidDiagram>
    );

    const figure = container.querySelector('figure');
    expect(figure).toHaveClass('bg-surface-muted', 'border', 'border-hairline');
  });

  it('should render with proper border and rounded styling', () => {
    const { container } = render(
      <MermaidDiagram>{`graph TD; A-->B`}</MermaidDiagram>
    );

    const figure = container.querySelector('figure');
    expect(figure).toHaveClass('rounded-md');
  });

  it('renders the diagram source inside a figure as the fallback', () => {
    const { container } = render(
      <MermaidDiagram>{`graph TD; A-->B`}</MermaidDiagram>
    );

    // On mount (and when mermaid cannot render, e.g. jsdom) the raw source
    // stays visible in a <figure> — this is the crawlable/JS-off fallback.
    const figure = container.querySelector('figure');
    expect(figure).toBeInTheDocument();
    expect(figure?.querySelector('pre')?.textContent).toContain('graph TD');
  });

  it('should render source inside pre tag', () => {
    const source = 'sequenceDiagram\n    A->>B: Hello';
    const { container } = render(<MermaidDiagram>{source}</MermaidDiagram>);

    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toContain(source);
  });

  it('should handle multiline source correctly', () => {
    const source = `graph TD
    A[Node A]
    B[Node B]
    A -->|Edge| B`;

    render(<MermaidDiagram>{source}</MermaidDiagram>);

    expect(screen.getByText(/Node A/)).toBeInTheDocument();
  });
});
