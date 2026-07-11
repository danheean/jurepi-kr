import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { ValidityIndicator } from './ValidityIndicator';

describe('ValidityIndicator', () => {
  it('renders valid status badge', () => {
    render(<ValidityIndicator status="valid" />);

    expect(screen.getByText('✓ Valid')).toBeInTheDocument();
  });

  it('renders expired status badge', () => {
    render(<ValidityIndicator status="expired" />);

    expect(screen.getByText('⛔ Expired')).toBeInTheDocument();
  });

  it('renders not_yet_valid status badge', () => {
    render(<ValidityIndicator status="not_yet_valid" />);

    expect(screen.getByText('⌛ Not Yet Valid')).toBeInTheDocument();
  });

  it('renders unknown status badge', () => {
    render(<ValidityIndicator status="unknown" />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders valid badge with success color', () => {
    const { container } = render(<ValidityIndicator status="valid" />);

    const badge = container.querySelector('.bg-success\\/ 10');
    expect(badge || container.querySelector('.text-success')).toBeInTheDocument();
  });

  it('renders expired badge with danger color', () => {
    const { container } = render(<ValidityIndicator status="expired" />);

    const badge = container.querySelector('.bg-danger\\/ 10');
    expect(badge || container.querySelector('.text-danger-ink')).toBeInTheDocument();
  });

  it('displays countdown text for valid status', () => {
    render(<ValidityIndicator status="valid" expiryCountdown="2h 30m" />);

    expect(screen.getByText(/Expires in/)).toBeInTheDocument();
  });

  it('displays countdown text for expired status', () => {
    render(<ValidityIndicator status="expired" expiryCountdown="1h 5m" />);

    expect(screen.getByText(/Expired .* ago/)).toBeInTheDocument();
  });

  it('displays countdown text for not_yet_valid status', () => {
    render(<ValidityIndicator status="not_yet_valid" expiryCountdown="30m" />);

    expect(screen.getByText(/Becomes valid in/)).toBeInTheDocument();
  });

  it('does not display countdown text without expiryCountdown', () => {
    const { container } = render(<ValidityIndicator status="valid" />);

    const countdownText = container.querySelector('.text-text-muted');
    if (countdownText) {
      // If there is muted text, it should not contain "Expires in" pattern
      expect(countdownText.textContent).toBeFalsy();
    }
  });
});
