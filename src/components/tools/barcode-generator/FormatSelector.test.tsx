import { render, screen, userEvent } from '@/__test__/test-utils';
import { FormatSelector } from './FormatSelector';

describe('FormatSelector', () => {
  it('renders all format buttons', () => {
    const handleChange = vi.fn();
    render(
      <FormatSelector selectedFormat="EAN13" onChange={handleChange} />
    );

    expect(screen.getByText('EAN-13')).toBeInTheDocument();
    expect(screen.getByText('UPC-A')).toBeInTheDocument();
    expect(screen.getByText('Code 39')).toBeInTheDocument();
    expect(screen.getByText('Code 128')).toBeInTheDocument();
  });

  it('highlights selected format', () => {
    const handleChange = vi.fn();
    render(
      <FormatSelector selectedFormat="CODE39" onChange={handleChange} />
    );

    const code39Button = screen.getByTestId('format-tab-code39');
    expect(code39Button).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onChange when format is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FormatSelector selectedFormat="EAN13" onChange={handleChange} />
    );

    const upcButton = screen.getByText('UPC-A');
    await user.click(upcButton);

    expect(handleChange).toHaveBeenCalledWith('UPC');
  });

  it('navigates formats with arrow keys', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FormatSelector selectedFormat="EAN13" onChange={handleChange} />
    );

    // A plain `<div role="tablist">` isn't itself focusable — arrow-key nav
    // relies on keydown bubbling up from a focused tab *button*, so focus the
    // currently-selected tab (not the container) before sending the key.
    const selectedTab = screen.getByTestId('format-tab-ean13');
    await user.click(selectedTab);
    await user.keyboard('{ArrowRight}');

    expect(handleChange).toHaveBeenCalledWith('UPC');
  });

  it('wraps around when pressing ArrowLeft on first format', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FormatSelector selectedFormat="EAN13" onChange={handleChange} />
    );

    const selectedTab = screen.getByTestId('format-tab-ean13');
    await user.click(selectedTab);
    await user.keyboard('{ArrowLeft}');

    expect(handleChange).toHaveBeenCalledWith('CODE128');
  });

  it('only tabIndexes the selected tab (roving tabindex, WAI-ARIA APG Tabs)', () => {
    const handleChange = vi.fn();
    render(
      <FormatSelector selectedFormat="CODE39" onChange={handleChange} />
    );

    expect(screen.getByTestId('format-tab-ean13')).toHaveAttribute('tabIndex', '-1');
    expect(screen.getByTestId('format-tab-upc')).toHaveAttribute('tabIndex', '-1');
    expect(screen.getByTestId('format-tab-code39')).toHaveAttribute('tabIndex', '0');
    expect(screen.getByTestId('format-tab-code128')).toHaveAttribute('tabIndex', '-1');
  });

  it('moves DOM focus to the newly-selected tab on arrow-key navigation', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FormatSelector selectedFormat="EAN13" onChange={handleChange} />
    );

    const selectedTab = screen.getByTestId('format-tab-ean13');
    await user.click(selectedTab);
    await user.keyboard('{ArrowRight}');

    // Regression: previously the keydown handler updated selection state via
    // onChange but never moved focus, leaving the focus ring stranded on the
    // tab the user just navigated away from.
    expect(screen.getByTestId('format-tab-upc')).toHaveFocus();
  });
});
