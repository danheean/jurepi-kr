import { render, screen, userEvent } from '@/__test__/test-utils';
import { TextToggle } from './TextToggle';

describe('TextToggle', () => {
  it('renders the label and reflects the checked state', () => {
    render(<TextToggle checked={true} onChange={vi.fn()} />);
    const checkbox = screen.getByLabelText('Show human-readable text');
    expect(checkbox).toBeChecked();
  });

  it('calls onChange with the new boolean when toggled', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TextToggle checked={true} onChange={handleChange} />);

    await user.click(screen.getByLabelText('Show human-readable text'));

    expect(handleChange).toHaveBeenCalledWith(false);
  });
});
