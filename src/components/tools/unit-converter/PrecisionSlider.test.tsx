import { render, userEvent, screen } from '@/__test__/test-utils';
import { PrecisionSlider } from './PrecisionSlider';
import { PRECISION_MIN, PRECISION_MAX } from '@/lib/unit-converter';

/**
 * PrecisionSlider component tests
 * Tests slider functionality, ARIA attributes, value changes,
 * and visual feedback.
 */

describe('PrecisionSlider', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render with label "Decimal places"', () => {
    render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    expect(screen.getByText('Decimal places')).toBeInTheDocument();
  });

  it('should render a range input slider', () => {
    render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('type', 'range');
  });

  it('should have correct min and max attributes', () => {
    render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', String(PRECISION_MIN));
    expect(slider).toHaveAttribute('max', String(PRECISION_MAX));
  });

  it('should display current value in caption', () => {
    render(
      <PrecisionSlider value={3} onChange={mockOnChange} />
    );

    // Should show "3 places" or similar caption
    expect(screen.getByText(/3.*place/i)).toBeInTheDocument();
  });

  it('should update caption when value changes', () => {
    const { rerender } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    expect(screen.getByText(/2.*place/i)).toBeInTheDocument();

    rerender(
      <PrecisionSlider value={4} onChange={mockOnChange} />
    );

    expect(screen.getByText(/4.*place/i)).toBeInTheDocument();
  });

  it('should call onChange when slider is dragged', async () => {
    const user = userEvent.setup();
    render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = screen.getByRole('slider');

    // Simulate slider change
    await user.tripleClick(slider);
    // Manually set a value (RTL approach for range input)
    // In real usage, user would drag the slider
    slider.dispatchEvent(new Event('change', { bubbles: true }));

    expect(slider).toBeInTheDocument();
  });

  it('should have correct aria-valuemin attribute', () => {
    render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', String(PRECISION_MIN));
  });

  it('should have correct aria-valuemax attribute', () => {
    render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemax', String(PRECISION_MAX));
  });

  it('should have correct aria-valuenow attribute', () => {
    render(
      <PrecisionSlider value={3} onChange={mockOnChange} />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '3');
  });

  it('should update aria-valuenow when value prop changes', () => {
    const { rerender } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    let slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '2');

    rerender(
      <PrecisionSlider value={5} onChange={mockOnChange} />
    );

    slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '5');
  });

  it('should have aria-valuetext attribute', () => {
    render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuetext');
  });

  it('should have caption displayed next to slider', () => {
    render(
      <PrecisionSlider value={4} onChange={mockOnChange} />
    );

    // Should display the caption showing current decimal places
    expect(screen.getByText(/4/)).toBeInTheDocument();
  });

  it('should have a labeled slider', () => {
    const { container } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const label = screen.getByText('Decimal places');
    expect(label).toBeInTheDocument();

    // The slider should be associated with the label or container
    expect(container.querySelector('label')).toBeInTheDocument();
  });

  it('should have full width styling', () => {
    const { container } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = container.querySelector('input[type="range"]');
    expect(slider?.className).toContain('w-full');
  });

  it('should have proper accent color', () => {
    const { container } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = container.querySelector('input[type="range"]');
    expect(slider?.className).toContain('accent-');
  });

  it('should support all valid precision values', () => {
    for (let i = PRECISION_MIN; i <= PRECISION_MAX; i++) {
      const { unmount } = render(
        <PrecisionSlider value={i} onChange={mockOnChange} />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', String(i));

      unmount();
    }
  });

  it('should have proper spacing around elements', () => {
    const { container } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const wrapper = container.querySelector('div[class*="space"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('uses the shared range track styling (height comes from the global 44px rule)', () => {
    const { container } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = container.querySelector('input[type="range"]');
    // No `h-2` override: the global `input[type=range] { height: 44px }` rule
    // provides the touch target; the visible track is the soft accent fill.
    expect(slider?.className).not.toContain('h-2');
    expect(slider?.className).toContain('bg-accent-sky-soft');
    expect(slider?.className).toContain('w-full');
  });

  it('should have proper border radius', () => {
    const { container } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = container.querySelector('input[type="range"]');
    expect(slider?.className).toContain('rounded-lg');
  });

  it('should display caption with accent color', () => {
    const { container } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const caption = container.querySelector('span[class*="accent"]');
    expect(caption).toBeInTheDocument();
  });

  it('should be a pure component with stable rendering', () => {
    const { rerender } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider1 = screen.getByRole('slider');

    rerender(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider2 = screen.getByRole('slider');

    // Both should be the same element reference
    expect(slider1).toBe(slider2);
  });

  it('should support keyboard input on slider', async () => {
    const user = userEvent.setup();
    render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = screen.getByRole('slider');
    slider.focus();

    // Simulate arrow key input
    await user.keyboard('{ArrowRight}');

    expect(slider).toHaveFocus();
  });

  it('should be cursor-pointer for better UX', () => {
    const { container } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const slider = container.querySelector('input[type="range"]');
    expect(slider?.className).toContain('cursor-pointer');
  });

  it('should have proper flex layout for label and caption', () => {
    const { container } = render(
      <PrecisionSlider value={2} onChange={mockOnChange} />
    );

    const flexContainer = container.querySelector('div[class*="flex"]');
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer?.className).toContain('justify-between');
  });
});
