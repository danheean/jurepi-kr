import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { ResultOutput } from './ResultOutput';

describe('ResultOutput', () => {
  const onCopy = vi.fn();
  const onDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when output is empty', () => {
    render(
      <ResultOutput
        output=""
        spans={[]}
        totalCount={0}
        ruleCount={1}
        onCopy={onCopy}
        onDownload={onDownload}
      />
    );

    expect(screen.getByText('(empty result)')).toBeInTheDocument();
  });

  it('renders output text without highlights when spans are empty', () => {
    render(
      <ResultOutput
        output="Hello world"
        spans={[]}
        totalCount={0}
        ruleCount={1}
        onCopy={onCopy}
        onDownload={onDownload}
      />
    );

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('highlights spans with <mark> elements', () => {
    render(
      <ResultOutput
        output="Hello world"
        spans={[{ index: 0, length: 5 }]}
        totalCount={1}
        ruleCount={1}
        onCopy={onCopy}
        onDownload={onDownload}
      />
    );

    const marks = screen.getAllByText('Hello');
    expect(marks[0]).toBeInTheDocument();
    expect(marks[0].tagName).toBe('MARK');
  });

  it('displays total count and rule count', () => {
    render(
      <ResultOutput
        output="result"
        spans={[]}
        totalCount={5}
        ruleCount={2}
        onCopy={onCopy}
        onDownload={onDownload}
      />
    );

    expect(screen.getByText(/5 replacements across 2 rules/)).toBeInTheDocument();
  });

  it('disables copy and download buttons when output is empty', () => {
    render(
      <ResultOutput
        output=""
        spans={[]}
        totalCount={0}
        ruleCount={1}
        onCopy={onCopy}
        onDownload={onDownload}
      />
    );

    expect(screen.getByTestId('copy-result-button')).toBeDisabled();
    expect(screen.getByTestId('download-result-button')).toBeDisabled();
  });

  it('enables copy and download buttons when output has content', () => {
    render(
      <ResultOutput
        output="result"
        spans={[]}
        totalCount={1}
        ruleCount={1}
        onCopy={onCopy}
        onDownload={onDownload}
      />
    );

    expect(screen.getByTestId('copy-result-button')).not.toBeDisabled();
    expect(screen.getByTestId('download-result-button')).not.toBeDisabled();
  });

  it('shows timeout warning when timedOut is true', () => {
    render(
      <ResultOutput
        output="result"
        spans={[]}
        totalCount={1}
        ruleCount={1}
        timedOut={true}
        onCopy={onCopy}
        onDownload={onDownload}
      />
    );

    expect(screen.getByText(/too slow/)).toBeInTheDocument();
  });

  it('highlights multiple disjoint spans correctly', () => {
    const output = 'apple banana cherry';
    const { container } = render(
      <ResultOutput
        output={output}
        spans={[
          { index: 0, length: 5 }, // "apple"
          { index: 6, length: 6 }, // "banana" ("apple banana…" → 'b' is at index 6)
        ]}
        totalCount={2}
        ruleCount={1}
        onCopy={onCopy}
        onDownload={onDownload}
      />
    );

    // Both spans should be marked
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    expect(marks[0].textContent).toBe('apple');
    expect(marks[1].textContent).toBe('banana');
  });

  it('calls onCopy when copy button is clicked', async () => {
    render(
      <ResultOutput
        output="result text"
        spans={[]}
        totalCount={1}
        ruleCount={1}
        onCopy={onCopy}
        onDownload={onDownload}
      />
    );

    screen.getByTestId('copy-result-button').click();
    expect(onCopy).toHaveBeenCalled();
  });

  it('calls onDownload when download button is clicked', () => {
    render(
      <ResultOutput
        output="result text"
        spans={[]}
        totalCount={1}
        ruleCount={1}
        onCopy={onCopy}
        onDownload={onDownload}
      />
    );

    screen.getByTestId('download-result-button').click();
    expect(onDownload).toHaveBeenCalledWith('result.txt');
  });
});
