import { render, screen, fireEvent } from '@/__test__/test-utils';
import { InputArea } from './InputArea';

describe('InputArea', () => {
  it('connects the label to the input (getByLabelText works)', () => {
    render(<InputArea value="" onChange={vi.fn()} format="EAN13" error={null} />);
    expect(screen.getByLabelText('Value to encode')).toBeInTheDocument();
  });

  it('shows the format-specific placeholder', () => {
    const { rerender } = render(<InputArea value="" onChange={vi.fn()} format="EAN13" error={null} />);
    expect(screen.getByPlaceholderText('Enter 12 digits (checksum auto-calculated)')).toBeInTheDocument();

    rerender(<InputArea value="" onChange={vi.fn()} format="CODE128" error={null} />);
    expect(screen.getByPlaceholderText('Enter any ASCII text')).toBeInTheDocument();
  });

  it('shows the char count', () => {
    render(<InputArea value="978014300723" onChange={vi.fn()} format="EAN13" error={null} maxLength={256} />);
    expect(screen.getByText('12/256 characters')).toBeInTheDocument();
  });

  it('shows a format-specific length error for EAN13', () => {
    render(<InputArea value="123" onChange={vi.fn()} format="EAN13" error="lengthError" />);
    expect(screen.getByRole('alert')).toHaveTextContent('EAN-13 requires 12 or 13 digits');
  });

  it('falls back to the flat error message for codes with no format-specific variant', () => {
    render(<InputArea value="abc!!!" onChange={vi.fn()} format="CODE39" error="invalidCharacter" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Contains characters not allowed for this format');
  });

  it('calls onChange with the truncated value on input', () => {
    const handleChange = vi.fn();
    render(<InputArea value="" onChange={handleChange} format="CODE128" error={null} maxLength={5} />);

    fireEvent.change(screen.getByLabelText('Value to encode'), { target: { value: '123456789' } });

    expect(handleChange).toHaveBeenCalledWith('12345');
  });
});
