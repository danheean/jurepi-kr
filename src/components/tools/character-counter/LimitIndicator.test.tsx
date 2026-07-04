import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { LimitIndicator } from './LimitIndicator';
import { getPresetLimit } from '@/lib/character-counter';

describe('LimitIndicator', () => {
  let mockOnLimitChange: ReturnType<typeof vi.fn>;
  let mockOnCustomInputChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnLimitChange = vi.fn();
    mockOnCustomInputChange = vi.fn();
  });

  it('renders preset buttons', () => {
    render(
      <LimitIndicator
        limit={null}
        currentCount={0}
        customInput=""
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    expect(screen.getByText('Twitter (280)')).toBeInTheDocument();
    expect(screen.getByText('Meta Description (160)')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('calls onLimitChange when preset is selected', () => {
    render(
      <LimitIndicator
        limit={null}
        currentCount={0}
        customInput=""
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    const twitterButton = screen.getByText('Twitter (280)');
    twitterButton.click();

    expect(mockOnLimitChange).toHaveBeenCalled();
  });

  it('shows progress bar when limit is set', () => {
    const limit = getPresetLimit('twitter');
    const { container } = render(
      <LimitIndicator
        limit={limit}
        currentCount={200}
        customInput=""
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    // Check for progress bar (role="progressbar")
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays correct progress bar fill percentage', () => {
    const limit = getPresetLimit('twitter'); // 280 limit
    const { container } = render(
      <LimitIndicator
        limit={limit}
        currentCount={140} // 50%
        customInput=""
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('shows green status for under 80%', () => {
    const limit = getPresetLimit('twitter'); // 280 limit
    render(
      <LimitIndicator
        limit={limit}
        currentCount={200} // ~71%
        customInput=""
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    // Status should show "OK" which is in "under" status
    expect(screen.getByText(/OK/)).toBeInTheDocument();
  });

  it('shows warning status for 80-100%', () => {
    const limit = getPresetLimit('twitter'); // 280 limit
    render(
      <LimitIndicator
        limit={limit}
        currentCount={250} // ~89%
        customInput=""
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    // Status should show "80%" which is in "near" status
    expect(screen.getByText(/80%/)).toBeInTheDocument();
  });

  it('shows danger status for over 100%', () => {
    const limit = getPresetLimit('twitter'); // 280 limit
    render(
      <LimitIndicator
        limit={limit}
        currentCount={300} // >100%
        customInput=""
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    // Status should show "OVER"
    expect(screen.getByText(/OVER/)).toBeInTheDocument();
  });

  it('shows custom input field when custom preset is selected', () => {
    const customLimit = { id: 'custom' as const, label: 'Custom (500)', limit: 500 };
    render(
      <LimitIndicator
        limit={customLimit}
        currentCount={0}
        customInput="500"
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    const input = screen.getByPlaceholderText('e.g., 500');
    expect(input).toBeInTheDocument();
  });

  it('calls onCustomInputChange when custom input changes', async () => {
    const customLimit = { id: 'custom' as const, label: 'Custom', limit: null };
    const user = userEvent.setup();

    render(
      <LimitIndicator
        limit={customLimit}
        currentCount={0}
        customInput=""
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    const input = screen.getByPlaceholderText('e.g., 500');
    await user.type(input, '400');

    expect(mockOnCustomInputChange).toHaveBeenCalled();
  });

  it('does not show progress bar when limit is none', () => {
    const noneLimit = getPresetLimit('none');
    const { container } = render(
      <LimitIndicator
        limit={noneLimit}
        currentCount={100}
        customInput=""
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    // No progress bar should be shown
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('displays limit status with current and limit values', () => {
    const limit = getPresetLimit('twitter'); // 280 limit
    render(
      <LimitIndicator
        limit={limit}
        currentCount={150}
        customInput=""
        onLimitChange={mockOnLimitChange}
        onCustomInputChange={mockOnCustomInputChange}
      />
    );

    expect(screen.getByText(/150 \/ 280/)).toBeInTheDocument();
  });
});
