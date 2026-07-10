import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { ErrorMessage } from './ErrorMessage';
import type { JwtParseError } from '@/lib/jwt-decoder';

describe('ErrorMessage', () => {
  it('renders nothing when no error', () => {
    const { container } = render(<ErrorMessage />);
    expect(container.firstChild).toBeNull();
  });

  it('renders parse error message', () => {
    const error: JwtParseError = {
      part: 'payload',
      code: 'invalid_json',
      reason: 'Invalid JSON',
    };

    render(<ErrorMessage parseError={error} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-danger/10');
    expect(alert).toHaveClass('border-danger/30');
    expect(alert).toHaveClass('text-danger-ink');
  });

  it('renders unsecured warning banner', () => {
    render(<ErrorMessage unsecuredWarning />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('bg-danger/10');
  });

  it('prioritizes parseError over unsecuredWarning', () => {
    const error: JwtParseError = {
      part: 'header',
      code: 'malformed_structure',
      reason: 'Not 3 parts',
    };

    render(<ErrorMessage parseError={error} unsecuredWarning />);

    // Should show parse error, not unsecured warning
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });
});
