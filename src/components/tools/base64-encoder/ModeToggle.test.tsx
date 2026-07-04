import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { ModeToggle } from './ModeToggle';

describe('ModeToggle', () => {
  it('renders mode toggle with radio buttons', () => {
    const mockOnChange = vi.fn();

    render(<ModeToggle value="text" onChange={mockOnChange} />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });

  it('marks correct radio as checked', () => {
    const mockOnChange = vi.fn();

    const { rerender } = render(<ModeToggle value="text" onChange={mockOnChange} />);

    const textRadio = screen.getAllByRole('radio')[0] as HTMLInputElement;
    expect(textRadio).toBeChecked();

    rerender(<ModeToggle value="file" onChange={mockOnChange} />);
    const fileRadio = screen.getAllByRole('radio')[1] as HTMLInputElement;
    expect(fileRadio).toBeChecked();
  });

  it('calls onChange when clicking radio button', () => {
    const mockOnChange = vi.fn();

    render(<ModeToggle value="text" onChange={mockOnChange} />);

    const fileRadio = screen.getAllByRole('radio')[1];
    fileRadio.click();
    expect(mockOnChange).toHaveBeenCalledWith('file');
  });
});
