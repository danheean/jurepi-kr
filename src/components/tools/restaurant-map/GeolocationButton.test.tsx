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

  it('displays i18n denied message when geoStatus=denied (ko)', () => {
    const mockRequestGeo = vi.fn();
    renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} geoStatus="denied" />,
      { locale: 'ko' }
    );

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent('위치 권한이 거부되었습니다.');
  });

  it('displays i18n error message when geoStatus=error (en)', () => {
    const mockRequestGeo = vi.fn();
    renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} geoStatus="error" />,
      { locale: 'en' }
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to get location');
  });

  it('displays i18n unsupported message when geoStatus=unsupported (ko)', () => {
    const mockRequestGeo = vi.fn();
    renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} geoStatus="unsupported" />,
      { locale: 'ko' }
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      '이 브라우저에서는 위치 기능을 사용할 수 없습니다.'
    );
  });

  it('clears the alert when geoStatus returns to idle/loading', () => {
    const mockRequestGeo = vi.fn();
    const { rerender } = renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} geoStatus="denied" />
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(
      <GeolocationButton requestGeolocation={mockRequestGeo} geoStatus="loading" />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not display error message on idle or active status', () => {
    const mockRequestGeo = vi.fn();
    const { rerender } = renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} geoStatus="idle" />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(
      <GeolocationButton requestGeolocation={mockRequestGeo} geoStatus="active" />
    );
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

  it('never renders a hardcoded English error (all alert copy is i18n)', () => {
    // Regression: the old component hardcoded "Location permission denied".
    const mockRequestGeo = vi.fn();
    renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} geoStatus="denied" />,
      { locale: 'ko' }
    );

    expect(screen.getByRole('alert')).not.toHaveTextContent('Location permission denied');
    // ko locale alert must not leak English words
    expect(screen.getByRole('alert').textContent).not.toMatch(/[A-Za-z]{4,}/);
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

  it('keeps the label on a single line (whitespace-nowrap + shrink-0)', () => {
    // Regression: in the search row the button shrank and "내 위치" wrapped
    // vertically as "내 위 / 치".
    const mockRequestGeo = vi.fn();
    renderWithIntl(<GeolocationButton requestGeolocation={mockRequestGeo} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('whitespace-nowrap', 'shrink-0');
  });

  it('geoStatus=loading disables the button and shows the loading label (ko)', () => {
    const mockRequestGeo = vi.fn();
    renderWithIntl(
      <GeolocationButton requestGeolocation={mockRequestGeo} geoStatus="loading" />,
      { locale: 'ko' }
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('위치 가져오는 중…');
  });

  it('geoStatus=active: aria-pressed, clear label, click calls clearGeolocation only', async () => {
    const mockRequestGeo = vi.fn();
    const mockClearGeo = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <GeolocationButton
        requestGeolocation={mockRequestGeo}
        clearGeolocation={mockClearGeo}
        geoStatus="active"
      />,
      { locale: 'ko' }
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent('위치 해제');

    await user.click(button);
    expect(mockClearGeo).toHaveBeenCalledOnce();
    expect(mockRequestGeo).not.toHaveBeenCalled();
  });

  it('geoStatus=idle: aria-pressed=false and click requests geolocation', async () => {
    const mockRequestGeo = vi.fn();
    const mockClearGeo = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <GeolocationButton
        requestGeolocation={mockRequestGeo}
        clearGeolocation={mockClearGeo}
        geoStatus="idle"
      />,
      { locale: 'ko' }
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveTextContent('내 위치');

    await user.click(button);
    expect(mockRequestGeo).toHaveBeenCalledOnce();
    expect(mockClearGeo).not.toHaveBeenCalled();
  });
});
