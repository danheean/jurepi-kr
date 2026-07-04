import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeolocationButton } from './GeolocationButton';
import { renderWithIntl } from './test-utils';

describe('GeolocationButton', () => {
  it('renders button with correct label', () => {
    const mockRequestGeo = vi.fn();
    renderWithIntl(<GeolocationButton requestGeolocation={mockRequestGeo} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Label comes from i18n: 'buttons.myLocation' — could be in any locale
    const ariaLabel = button.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  it('calls requestGeolocation when button is clicked', async () => {
    const mockRequestGeo = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<GeolocationButton requestGeolocation={mockRequestGeo} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockRequestGeo).toHaveBeenCalledOnce();
  });

  it('disables button when disabled prop is true', () => {
    const mockRequestGeo = vi.fn();
    renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} disabled={true} />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when isLoading prop is true', () => {
    const mockRequestGeo = vi.fn();
    renderWithIntl(
      <GeolocationButton
        requestGeolocation={mockRequestGeo}
        isLoading={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when either disabled or isLoading is true', () => {
    const mockRequestGeo = vi.fn();
    const { rerender } = renderWithIntl(
      <GeolocationButton
        requestGeolocation={mockRequestGeo}
        disabled={true}
      />
    );

    let button = screen.getByRole('button');
    expect(button).toBeDisabled();

    rerender(
      <GeolocationButton
        requestGeolocation={mockRequestGeo}
        isLoading={true}
        disabled={false}
      />
    );

    button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('displays error message when requestGeolocation throws', async () => {
    const mockRequestGeo = vi.fn().mockRejectedValueOnce(
      new Error('Permission denied')
    );
    const user = userEvent.setup();
    renderWithIntl(<GeolocationButton requestGeolocation={mockRequestGeo} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent('Location permission denied');
  });

  it('clears error message when clicking button again successfully', async () => {
    const mockRequestGeo = vi.fn()
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithIntl(<GeolocationButton requestGeolocation={mockRequestGeo} />);

    const button = screen.getByRole('button');

    // First click — error
    await user.click(button);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Second click — success, error should clear
    await user.click(button);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not display error message on successful geolocation', async () => {
    const mockRequestGeo = vi.fn().mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithIntl(<GeolocationButton requestGeolocation={mockRequestGeo} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders icon alongside button text', () => {
    const mockRequestGeo = vi.fn();
    const { container } = renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} />
    );

    // Should have an SVG icon (from lucide-react)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with flex gap and proper structure', () => {
    const mockRequestGeo = vi.fn();
    const { container } = renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} />
    );

    const wrapper = container.querySelector('[class*="flex"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders all text from i18n (en)', () => {
    const mockRequestGeo = vi.fn();
    renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} />,
      { locale: 'en' }
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Button should have text content (will vary by locale, but should exist)
    expect(button.textContent).toBeTruthy();
  });

  it('renders all text from i18n (ko)', () => {
    const mockRequestGeo = vi.fn();
    renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} />,
      { locale: 'ko' }
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Button should have text content
    expect(button.textContent).toBeTruthy();
  });

  it('propagates requestGeolocation error to error message', async () => {
    const testError = new Error('Network error');
    const mockRequestGeo = vi.fn().mockRejectedValueOnce(testError);
    const user = userEvent.setup();
    renderWithIntl(<GeolocationButton requestGeolocation={mockRequestGeo} />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Error message should be the standard "Location permission denied"
    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toHaveTextContent('Location permission denied');
  });

  it('button has opacity transition on hover when enabled', () => {
    const mockRequestGeo = vi.fn();
    const { container } = renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:opacity-90', 'transition');
  });

  it('button has reduced opacity when disabled', () => {
    const mockRequestGeo = vi.fn();
    renderWithIntl(
      <GeolocationButton
        requestGeolocation={mockRequestGeo}
        disabled={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('disabled:opacity-50');
  });
});
