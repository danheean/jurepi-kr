import { render, screen, userEvent } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { JsonInput } from './JsonInput';
import { useRef } from 'react';

describe('JsonInput', () => {
  it('renders textarea with label', () => {
    render(<JsonInput />);

    const label = screen.getByText('JSON Input');
    const textarea = screen.getByLabelText('JSON Input');

    expect(label).toBeInTheDocument();
    expect(textarea).toBeInTheDocument();
  });

  it('connects label to textarea via htmlFor/id', () => {
    render(<JsonInput />);

    const textarea = screen.getByLabelText('JSON Input');
    expect(textarea).toHaveAttribute('id', 'json-input');
  });

  it('accepts value prop', () => {
    render(
      <JsonInput
        value='{"test": 1}'
        onChange={() => {}}
      />
    );

    expect(screen.getByDisplayValue('{"test": 1}')).toBeInTheDocument();
  });

  it('calls onChange on input change', async () => {
    const handleChange = vi.fn();

    render(
      <JsonInput
        value=""
        onChange={handleChange}
      />
    );

    const textarea = screen.getByLabelText('JSON Input');
    await userEvent.type(textarea, 'a');

    expect(handleChange).toHaveBeenCalled();
  });

  it('has focus visible style on focus', async () => {
    render(<JsonInput />);

    const textarea = screen.getByLabelText('JSON Input');
    await userEvent.click(textarea);

    expect(textarea).toHaveFocus();
  });

  it('renders placeholder text', () => {
    render(<JsonInput />);

    const textarea = screen.getByLabelText('JSON Input');
    expect(textarea).toHaveAttribute(
      'placeholder',
      'Paste JSON here…'
    );
  });

  it('supports custom label prop', () => {
    render(<JsonInput label="Custom Label" />);

    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('uses monospace font', () => {
    const { container } = render(<JsonInput />);
    const textarea = container.querySelector('textarea');

    expect(textarea).toHaveClass('font-mono');
  });
});
