import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { DirectionToggle } from './DirectionToggle';

describe('DirectionToggle', () => {
  it('renders encode and decode radios', () => {
    render(<DirectionToggle value="encode" onChange={vi.fn()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('marks the selected direction as checked', () => {
    const { rerender } = render(<DirectionToggle value="encode" onChange={vi.fn()} />);
    expect(screen.getAllByRole('radio')[0]).toBeChecked();

    rerender(<DirectionToggle value="decode" onChange={vi.fn()} />);
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
  });

  it('calls onChange when a direction is selected', () => {
    const onChange = vi.fn();
    render(<DirectionToggle value="encode" onChange={onChange} />);

    screen.getAllByRole('radio')[1].click();
    expect(onChange).toHaveBeenCalledWith('decode');
  });
});
