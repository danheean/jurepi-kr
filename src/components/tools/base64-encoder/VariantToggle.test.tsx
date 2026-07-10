import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { VariantToggle } from './VariantToggle';

describe('VariantToggle', () => {
  it('renders standard and URL-safe radios with charset hints', () => {
    render(<VariantToggle value="standard" onChange={vi.fn()} />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    // Accessible names are the primary terms; charsets are decorative hints.
    expect(screen.getByRole('radio', { name: 'Standard' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'URL-Safe' })).toBeInTheDocument();
    expect(screen.getByText('A-Za-z0-9+/')).toBeInTheDocument();
    expect(screen.getByText('A-Za-z0-9-_')).toBeInTheDocument();
  });

  it('marks the selected variant as checked', () => {
    const { rerender } = render(<VariantToggle value="standard" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Standard' })).toBeChecked();

    rerender(<VariantToggle value="urlSafe" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'URL-Safe' })).toBeChecked();
  });

  it('calls onChange when a variant is selected', () => {
    const onChange = vi.fn();
    render(<VariantToggle value="standard" onChange={onChange} />);

    screen.getByRole('radio', { name: 'URL-Safe' }).click();
    expect(onChange).toHaveBeenCalledWith('urlSafe');
  });
});
