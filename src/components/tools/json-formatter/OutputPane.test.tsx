import { render, screen, waitFor, userEvent } from '@/__test__/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutputPane } from './OutputPane';
import { JsonStats } from '@/lib/json-formatter';

describe('OutputPane', () => {
  const mockOnCopy = vi.fn(async () => true);
  const mockOnDownload = vi.fn();

  const validParseResult = {
    success: true as const,
    output: '{\n  "test": 1\n}',
    json: { test: 1 },
  };

  const invalidParseResult = {
    success: false as const,
    error: {
      line: 1,
      column: 10,
      token: '}',
      context: '{"test": }',
    },
  };

  const mockStats: JsonStats = {
    byteSize: 1024,
    elementCount: 5,
    depth: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tab buttons for Formatted and Tree', () => {
    render(
      <OutputPane
        parseResult={validParseResult}
        stats={mockStats}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('Formatted')).toBeInTheDocument();
    expect(screen.getByText('Tree')).toBeInTheDocument();
  });

  it('renders formatted output by default', () => {
    const { container } = render(
      <OutputPane
        parseResult={validParseResult}
        stats={mockStats}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    expect(container.textContent).toContain('"test"');
  });

  it('switches to tree view when Tree tab is clicked', async () => {

    render(
      <OutputPane
        parseResult={validParseResult}
        stats={mockStats}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    const treeTab = Array.from(screen.getAllByText('Tree'));
    await userEvent.click(treeTab[0]);

    await waitFor(() => {
      expect(screen.getByText('Tree')).toHaveClass('border-brand');
    });
  });

  it('displays error message when parse fails', () => {
    render(
      <OutputPane
        parseResult={invalidParseResult}
        stats={null}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/Line 1, column 10/)).toBeInTheDocument();
  });

  it('shows copy and download buttons when output is valid', () => {
    render(
      <OutputPane
        parseResult={validParseResult}
        stats={mockStats}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('hides buttons when output is invalid', () => {
    render(
      <OutputPane
        parseResult={invalidParseResult}
        stats={null}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    const copyButtons = screen.queryAllByText('Copy');
    const downloadButtons = screen.queryAllByText('Download');

    expect(copyButtons.length).toBe(0);
    expect(downloadButtons.length).toBe(0);
  });

  it('calls onCopy when copy button is clicked', async () => {

    render(
      <OutputPane
        parseResult={validParseResult}
        stats={mockStats}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    const copyButton = screen.getByText('Copy');
    await userEvent.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalled();
  });

  it('displays copy success message after copy', async () => {

    render(
      <OutputPane
        parseResult={validParseResult}
        stats={mockStats}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    const copyButton = screen.getByText('Copy');
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('calls onDownload when download button is clicked', async () => {

    render(
      <OutputPane
        parseResult={validParseResult}
        stats={mockStats}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    const downloadButton = screen.getByText('Download');
    await userEvent.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalledWith('data.json');
  });

  it('highlights active tab', async () => {

    render(
      <OutputPane
        parseResult={validParseResult}
        stats={mockStats}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    const formatTab = Array.from(screen.getAllByText('Formatted'));
    await userEvent.click(formatTab[0]);

    await waitFor(() => {
      expect(formatTab[0]).toHaveClass('border-brand');
    });
  });

  it('renders placeholder when no input is present', () => {
    render(
      <OutputPane
        parseResult={{ success: false }}
        stats={null}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/Paste JSON here/)).toBeInTheDocument();
  });
});
