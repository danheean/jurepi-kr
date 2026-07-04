import { render, screen, userEvent } from '@/__test__/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormatOptions } from './FormatOptions';

describe('FormatOptions', () => {
  const mockHandlers = {
    onIndentChange: vi.fn(),
    onSortKeysToggle: vi.fn(),
    onFormat: vi.fn(),
    onMinify: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders indent label and buttons', () => {
    render(
      <FormatOptions
        indent="2"
        sortKeys={false}
        isValid={true}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Indentation')).toBeInTheDocument();
    expect(screen.getByText('2 spaces')).toBeInTheDocument();
    expect(screen.getByText('4 spaces')).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
  });

  it('highlights active indent option', () => {
    const { container } = render(
      <FormatOptions
        indent="4"
        sortKeys={false}
        isValid={true}
        {...mockHandlers}
      />
    );

    const buttons = Array.from(container.querySelectorAll('button'));
    const fourSpaceButton = buttons.find((btn) => btn.textContent === '4 spaces');

    expect(fourSpaceButton).toHaveClass('bg-brand');
  });

  it('calls onIndentChange when indent button clicked', async () => {

    render(
      <FormatOptions
        indent="2"
        sortKeys={false}
        isValid={true}
        {...mockHandlers}
      />
    );

    const tabButton = screen.getByText('Tab');
    await userEvent.click(tabButton);

    expect(mockHandlers.onIndentChange).toHaveBeenCalledWith('tab');
  });

  it('renders sort keys toggle checkbox', () => {
    render(
      <FormatOptions
        indent="2"
        sortKeys={false}
        isValid={true}
        {...mockHandlers}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('calls onSortKeysToggle when checkbox clicked', async () => {

    render(
      <FormatOptions
        indent="2"
        sortKeys={false}
        isValid={true}
        {...mockHandlers}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    expect(mockHandlers.onSortKeysToggle).toHaveBeenCalled();
  });

  it('shows sorted checkbox as checked when sortKeys is true', () => {
    render(
      <FormatOptions
        indent="2"
        sortKeys={true}
        isValid={true}
        {...mockHandlers}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders action buttons', () => {
    render(
      <FormatOptions
        indent="2"
        sortKeys={false}
        isValid={true}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Format')).toBeInTheDocument();
    expect(screen.getByText('Minify')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('calls action handlers on button click', async () => {

    render(
      <FormatOptions
        indent="2"
        sortKeys={false}
        isValid={true}
        {...mockHandlers}
      />
    );

    const formatButton = Array.from(screen.getAllByRole('button')).find(
      (btn) => btn.textContent === 'Format'
    );
    const minifyButton = Array.from(screen.getAllByRole('button')).find(
      (btn) => btn.textContent === 'Minify'
    );
    const clearButton = Array.from(screen.getAllByRole('button')).find(
      (btn) => btn.textContent === 'Clear'
    );

    await userEvent.click(formatButton!);
    expect(mockHandlers.onFormat).toHaveBeenCalled();

    await userEvent.click(minifyButton!);
    expect(mockHandlers.onMinify).toHaveBeenCalled();

    await userEvent.click(clearButton!);
    expect(mockHandlers.onClear).toHaveBeenCalled();
  });

  it('displays valid status icon when isValid is true', () => {
    render(
      <FormatOptions
        indent="2"
        sortKeys={false}
        isValid={true}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Valid')).toBeInTheDocument();
  });

  it('displays invalid status icon when isValid is false', () => {
    render(
      <FormatOptions
        indent="2"
        sortKeys={false}
        isValid={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
