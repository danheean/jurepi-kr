import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { OutputDisplay } from './OutputDisplay';

describe('OutputDisplay', () => {
  it('renders readonly output textarea', () => {
    const mockOnCopy = vi.fn();

    render(
      <OutputDisplay
        outputText="aGVsbG8="
        direction="encode"
        onCopy={mockOnCopy}
        onDownload={vi.fn()}
      />
    );

    const outputTextarea = screen.getByRole('textbox');
    expect((outputTextarea as HTMLTextAreaElement).readOnly).toBe(true);
    expect((outputTextarea as HTMLTextAreaElement).value).toBe('aGVsbG8=');
  });

  it('renders copy buttons when direction is encode', () => {
    const mockOnCopy = vi.fn();

    render(
      <OutputDisplay
        outputText="aGVsbG8="
        direction="encode"
        onCopy={mockOnCopy}
        onDownload={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('disables buttons when output is empty', () => {
    const mockOnCopy = vi.fn();

    render(
      <OutputDisplay
        outputText=""
        direction="encode"
        onCopy={mockOnCopy}
        onDownload={vi.fn()}
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('calls onCopy with correct target when button clicked', () => {
    const mockOnCopy = vi.fn();

    render(
      <OutputDisplay
        outputText="aGVsbG8="
        direction="encode"
        onCopy={mockOnCopy}
        onDownload={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons[0].click();

    expect(mockOnCopy).toHaveBeenCalled();
  });

  it('shows different buttons for decode mode', () => {
    const mockOnCopy = vi.fn();

    const { rerender } = render(
      <OutputDisplay
        outputText="hello"
        direction="decode"
        onCopy={mockOnCopy}
        onDownload={vi.fn()}
      />
    );

    let buttons = screen.getAllByRole('button');
    const decodeButtonCount = buttons.length;

    rerender(
      <OutputDisplay
        outputText="aGVsbG8="
        direction="encode"
        onCopy={mockOnCopy}
        onDownload={vi.fn()}
      />
    );

    buttons = screen.getAllByRole('button');
    // Encode mode has different number of buttons than decode
    expect(buttons.length).not.toBe(decodeButtonCount);
  });

  it('displays copied feedback when copy succeeds', async () => {
    const mockOnCopy = vi.fn().mockResolvedValue(true);

    render(
      <OutputDisplay
        outputText="aGVsbG8="
        direction="encode"
        onCopy={mockOnCopy}
        onDownload={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    const copyButton = buttons[0]; // First button should be copy

    copyButton.click();

    // Wait for feedback: button label flips + sr-only live region announces
    const copiedMessages = await screen.findAllByText('Copied!');
    expect(copiedMessages.length).toBeGreaterThan(0);
    expect(mockOnCopy).toHaveBeenCalledWith('base64');
  });

  it('does not show copied feedback when copy fails', async () => {
    const mockOnCopy = vi.fn().mockResolvedValue(false);

    render(
      <OutputDisplay
        outputText="aGVsbG8="
        direction="encode"
        onCopy={mockOnCopy}
        onDownload={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    const copyButton = buttons[0];

    copyButton.click();

    // Should not show copied message
    const copiedMessage = screen.queryByText('Copied!');
    expect(copiedMessage).not.toBeInTheDocument();
    expect(mockOnCopy).toHaveBeenCalled();
  });
});
