import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { TimestampDisplay } from './TimestampDisplay';

describe('TimestampDisplay', () => {
  it('renders nothing when no timestamps provided', () => {
    const { container } = render(<TimestampDisplay locale="en" />);
    const div = container.querySelector('div');
    if (div) {
      expect(div.children.length).toBe(0);
    }
  });

  it('renders exp timestamp', () => {
    render(<TimestampDisplay exp={1672531200} locale="en" />);

    expect(screen.getByText('Expiration Time')).toBeInTheDocument();
    expect(screen.getByText('1672531200')).toBeInTheDocument();
  });

  it('renders iat timestamp', () => {
    render(<TimestampDisplay iat={1672444800} locale="en" />);

    expect(screen.getByText('Issued At')).toBeInTheDocument();
    expect(screen.getByText('1672444800')).toBeInTheDocument();
  });

  it('renders nbf timestamp', () => {
    render(<TimestampDisplay nbf={1672444800} locale="en" />);

    expect(screen.getByText('Not Before')).toBeInTheDocument();
    expect(screen.getByText('1672444800')).toBeInTheDocument();
  });

  it('renders all three timestamps in order', () => {
    const { container } = render(
      <TimestampDisplay iat={1000000} nbf={1000100} exp={2000000} locale="en" />
    );

    const items = container.querySelectorAll('.bg-surface.rounded-lg');
    expect(items.length).toBe(3);
  });

  it('renders timestamps in iat, nbf, exp order', () => {
    const { container } = render(
      <TimestampDisplay exp={3000000} iat={1000000} nbf={2000000} locale="en" />
    );

    const labels = container.querySelectorAll('.text-text-muted');
    const texts = Array.from(labels).map((el) => el.textContent);

    const iatIndex = texts.findIndex((t) => t?.includes('Issued At'));
    const nbfIndex = texts.findIndex((t) => t?.includes('Not Before'));
    const expIndex = texts.findIndex((t) => t?.includes('Expiration'));

    expect(iatIndex).toBeLessThan(nbfIndex);
    expect(nbfIndex).toBeLessThan(expIndex);
  });

  it('displays Unix seconds as monospace text', () => {
    const { container } = render(<TimestampDisplay exp={1672531200} locale="en" />);

    const monoElements = container.querySelectorAll('.font-mono');
    const unixFound = Array.from(monoElements).some((el) =>
      el.textContent?.includes('1672531200')
    );
    expect(unixFound).toBe(true);
  });

  it('formats timestamp with locale', () => {
    const { container } = render(<TimestampDisplay exp={1672531200} locale="en" />);

    // Should render formatted date (contains year 2023)
    const textContent = container.textContent || '';
    expect(textContent).toContain('2023');
  });

  it('handles zero timestamp', () => {
    render(<TimestampDisplay exp={0} locale="en" />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles negative timestamp gracefully', () => {
    render(<TimestampDisplay exp={-1000} locale="en" />);

    expect(screen.getByText('-1000')).toBeInTheDocument();
  });

  it('renders each timestamp in its own container', () => {
    const { container } = render(
      <TimestampDisplay iat={1000} nbf={2000} exp={3000} locale="en" />
    );

    const containers = container.querySelectorAll('.bg-surface.rounded-lg');
    expect(containers.length).toBe(3);
  });

  it('displays ISO format timestamp', () => {
    const { container } = render(<TimestampDisplay exp={1672531200} locale="en" />);

    // Should contain ISO format (with Z for UTC)
    const textContent = container.textContent || '';
    expect(textContent).toMatch(/T.*Z|UTC/i);
  });

  it('renders with correct text styling', () => {
    const { container } = render(
      <TimestampDisplay exp={1672531200} locale="en" />
    );

    const smallText = container.querySelectorAll('.text-xs');
    expect(smallText.length).toBeGreaterThan(0);
  });

  it('shows local time representation', () => {
    const { container } = render(<TimestampDisplay iat={1672444800} locale="en" />);

    // The component should show formatted time
    const textContent = container.textContent || '';
    const hasMonthOrDay = /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|월|화|수|목|금|토|일|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday/i.test(textContent);
    expect(hasMonthOrDay).toBe(true);
  });

  it('only renders timestamps that are provided', () => {
    const { container } = render(
      <TimestampDisplay iat={1000} locale="en" />
    );

    const items = container.querySelectorAll('.bg-surface.rounded-lg');
    expect(items.length).toBe(1);
  });

  it('handles multiple timestamps without rendering duplicates', () => {
    const { container } = render(
      <TimestampDisplay iat={1000} nbf={2000} exp={3000} locale="en" />
    );

    const items = container.querySelectorAll('.bg-surface.rounded-lg');
    expect(items.length).toBe(3);
    expect(items.length).not.toBeGreaterThan(3);
  });
});
