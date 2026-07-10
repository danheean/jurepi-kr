import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { OptionGroup } from './OptionGroup';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo', hint: 'X-Y-Z' },
] as const;

describe('OptionGroup', () => {
  it('renders one radio per option with the legend', () => {
    render(
      <OptionGroup legend="Pick one" name="test" value="a" onChange={vi.fn()} options={OPTIONS} />
    );

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    // Accessible name is the primary label, not the hint.
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Bravo' })).toBeInTheDocument();
  });

  it('marks the option matching `value` as checked', () => {
    const { rerender } = render(
      <OptionGroup legend="Pick one" name="test" value="a" onChange={vi.fn()} options={OPTIONS} />
    );
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Bravo' })).not.toBeChecked();

    rerender(
      <OptionGroup legend="Pick one" name="test" value="b" onChange={vi.fn()} options={OPTIONS} />
    );
    expect(screen.getByRole('radio', { name: 'Bravo' })).toBeChecked();
  });

  it('calls onChange with the option value when selected', () => {
    const onChange = vi.fn();
    render(
      <OptionGroup legend="Pick one" name="test" value="a" onChange={onChange} options={OPTIONS} />
    );

    screen.getByRole('radio', { name: 'Bravo' }).click();
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders the optional hint text', () => {
    render(
      <OptionGroup legend="Pick one" name="test" value="a" onChange={vi.fn()} options={OPTIONS} />
    );
    expect(screen.getByText('X-Y-Z')).toBeInTheDocument();
  });
});
