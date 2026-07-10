import { render, screen, userEvent } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { TokenInput } from './TokenInput';

describe('TokenInput', () => {
  it('renders textarea with placeholder', () => {
    render(<TokenInput />);

    const textarea = screen.getByPlaceholderText('Paste your JWT here…');
    expect(textarea).toBeInTheDocument();
  });

  it('connects label to textarea', () => {
    render(<TokenInput />);

    const textarea = screen.getByLabelText('Token');
    expect(textarea).toHaveAttribute('id', 'token-input');
  });

  it('accepts custom label prop', () => {
    render(<TokenInput label="JWT Token" />);

    const label = screen.getByText('JWT Token');
    expect(label).toBeInTheDocument();
  });

  it('accepts value prop', () => {
    render(
      <TokenInput
        value="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature"
        onChange={() => {}}
      />
    );

    expect(
      screen.getByDisplayValue('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature')
    ).toBeInTheDocument();
  });

  it('calls onChange on input change', async () => {
    const handleChange = vi.fn();

    render(
      <TokenInput
        value=""
        onChange={handleChange}
      />
    );

    const textarea = screen.getByLabelText('Token');
    await userEvent.type(textarea, 'test');

    expect(handleChange).toHaveBeenCalled();
  });

  it('has focus-visible ring on focus', async () => {
    render(<TokenInput />);

    const textarea = screen.getByLabelText('Token');
    await userEvent.click(textarea);

    expect(textarea).toHaveFocus();
  });

  it('renders with error state', () => {
    const { container } = render(<TokenInput error />);

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('border-danger/50');
  });

  it('renders without error state by default', () => {
    const { container } = render(<TokenInput />);

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('border-hairline');
  });

  it('disables spell check', () => {
    render(<TokenInput />);

    const textarea = screen.getByLabelText('Token');
    expect(textarea).toHaveAttribute('spellcheck', 'false');
  });

  it('disables auto-complete', () => {
    render(<TokenInput />);

    const textarea = screen.getByLabelText('Token');
    expect(textarea).toHaveAttribute('autocomplete', 'off');
  });

  it('uses monospace font', () => {
    const { container } = render(<TokenInput />);
    const textarea = container.querySelector('textarea');

    expect(textarea).toHaveClass('font-mono');
  });
});
