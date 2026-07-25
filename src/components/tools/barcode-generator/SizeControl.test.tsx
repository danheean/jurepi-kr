import { render, screen, fireEvent } from '@/__test__/test-utils';
import { SizeControl } from './SizeControl';

describe('SizeControl', () => {
  it('shows the current width in the label', () => {
    render(<SizeControl value={200} onChange={vi.fn()} />);
    expect(screen.getByText('Width: 200px')).toBeInTheDocument();
  });

  it('shows the min/max bounds', () => {
    render(<SizeControl value={200} onChange={vi.fn()} min={100} max={300} />);
    expect(screen.getByText('100px')).toBeInTheDocument();
    expect(screen.getByText('300px')).toBeInTheDocument();
  });

  it('calls onChange with the new numeric width when the slider moves', () => {
    const handleChange = vi.fn();
    render(<SizeControl value={200} onChange={handleChange} />);

    const slider = screen.getByTestId('size-slider');
    fireEvent.change(slider, { target: { value: '250' } });

    expect(handleChange).toHaveBeenCalledWith(250);
  });
});
