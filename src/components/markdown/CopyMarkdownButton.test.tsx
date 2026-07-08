import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/__test__/test-utils';
import { CopyMarkdownButton } from './CopyMarkdownButton';

describe('CopyMarkdownButton', () => {
  const writeText = vi.fn((_text: string) => Promise.resolve());

  beforeEach(() => {
    writeText.mockClear();
    // Mirror CodeBlock.test: assign a mock clipboard (fireEvent, not userEvent,
    // so user-event's own clipboard stub never takes over the getter).
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the copy label from the catalog', () => {
    render(
      <CopyMarkdownButton title="Vibe Coding" markdown="Body." sourceUrl="https://x/y" />
    );
    expect(screen.getByRole('button', { name: 'Copy as Markdown' })).toBeInTheDocument();
  });

  it('copies the assembled markdown document (title + source + body) on click', async () => {
    render(
      <CopyMarkdownButton
        title="Vibe Coding"
        markdown={'## What\nA modern way to build.'}
        sourceUrl="https://apps.jurepi.kr/en/tools/new-word/vibe-coding"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy as Markdown' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0][0];
    expect(copied).toBe(
      '# Vibe Coding\n\n' +
        '> Source: https://apps.jurepi.kr/en/tools/new-word/vibe-coding\n\n' +
        '## What\nA modern way to build.'
    );
  });

  it('shows the copied confirmation label after a successful copy', async () => {
    render(<CopyMarkdownButton title="T" markdown="b" sourceUrl="https://x/y" />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Markdown copied!' })).toBeInTheDocument()
    );
  });

  it('exposes a title tooltip mirroring the label', () => {
    render(<CopyMarkdownButton title="T" markdown="b" sourceUrl="https://x/y" />);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Copy as Markdown');
  });
});
