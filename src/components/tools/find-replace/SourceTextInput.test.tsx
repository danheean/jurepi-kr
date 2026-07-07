import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { SourceTextInput } from './SourceTextInput';

describe('SourceTextInput', () => {
  it('renders textarea with label and placeholder', () => {
    render(<SourceTextInput text="" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Text to transform')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste the text to transform…')).toBeInTheDocument();
  });

  it('displays current text value', () => {
    const text = 'Hello, world!';
    render(<SourceTextInput text={text} onChange={vi.fn()} />);

    expect(screen.getByDisplayValue(text)).toBeInTheDocument();
  });

  it('displays character count', () => {
    const text = 'Hello';
    render(<SourceTextInput text={text} onChange={vi.fn()} />);

    expect(screen.getByText('5 characters')).toBeInTheDocument();
  });

  it('calls onChange for each edit, reflecting the new value', async () => {
    // Controlled component: a stateful wrapper accumulates keystrokes like the real app.
    function Harness() {
      const [text, setText] = useState('');
      return (
        <SourceTextInput
          text={text}
          onChange={(v) => {
            onChangeSpy(v);
            setText(v);
          }}
        />
      );
    }
    const onChangeSpy = vi.fn();
    render(<Harness />);

    const textarea = screen.getByLabelText('Text to transform') as HTMLTextAreaElement;
    await userEvent.type(textarea, 'test');

    expect(onChangeSpy).toHaveBeenCalled();
    expect(onChangeSpy).toHaveBeenLastCalledWith('test');
    expect(textarea.value).toBe('test');
  });

  it('shows correct character count for different text lengths', () => {
    const { rerender } = render(<SourceTextInput text="" onChange={vi.fn()} />);
    expect(screen.getByText('0 characters')).toBeInTheDocument();

    rerender(<SourceTextInput text="Hello, world!" onChange={vi.fn()} />);
    expect(screen.getByText('13 characters')).toBeInTheDocument();
  });
});
