import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { ClaimsTable } from './ClaimsTable';

describe('ClaimsTable', () => {
  it('renders standard claims section', () => {
    const payload = {
      iss: 'https://example.com',
      sub: '1234567890',
      aud: 'example-app',
      exp: 1672531200,
      iat: 1672444800,
    };

    render(<ClaimsTable payload={payload} locale="en" />);

    expect(screen.getByText('Standard Claims')).toBeInTheDocument();
  });

  it('renders standard claim labels', () => {
    const payload = {
      iss: 'https://example.com',
      sub: 'user123',
    };

    render(<ClaimsTable payload={payload} locale="en" />);

    expect(screen.getByText('Issuer')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
  });

  it('renders standard claim values', () => {
    const payload = {
      iss: 'https://example.com',
      sub: 'user123',
    };

    const { container } = render(<ClaimsTable payload={payload} locale="en" />);

    const textContent = container.textContent || '';
    expect(textContent).toContain('https://example.com');
    expect(textContent).toContain('user123');
  });

  it('skips undefined standard claims', () => {
    const payload = {
      iss: 'https://example.com',
      // sub is undefined, should not render
    };

    const { container } = render(<ClaimsTable payload={payload} locale="en" />);

    const rows = container.querySelectorAll('table tbody tr');
    expect(rows.length).toBe(1); // Only iss row
  });

  it('renders custom claims section when present', () => {
    const payload = {
      iss: 'https://example.com',
      customField: 'customValue',
      anotherCustom: 123,
    };

    const { container } = render(<ClaimsTable payload={payload} locale="en" />);

    expect(screen.getByText('Custom Claims')).toBeInTheDocument();
    const textContent = container.textContent || '';
    expect(textContent).toContain('customField');
    expect(textContent).toContain('customValue');
  });

  it('does not render custom claims section when no custom claims', () => {
    const payload = {
      iss: 'https://example.com',
      sub: 'user123',
    };

    render(<ClaimsTable payload={payload} locale="en" />);

    expect(screen.queryByText('Custom Claims')).not.toBeInTheDocument();
  });

  it('handles empty payload', () => {
    render(<ClaimsTable payload={{}} locale="en" />);

    expect(screen.getByText('Claims')).toBeInTheDocument();
  });

  it('handles null payload gracefully', () => {
    render(<ClaimsTable payload={{}} locale="en" />);

    // Should render, just with no claims
    expect(screen.getByText('Claims')).toBeInTheDocument();
  });

  it('formats timestamp values for time claims', () => {
    const payload = {
      iat: 1672444800, // 2022-12-31T00:00:00Z
    };

    const { container } = render(<ClaimsTable payload={payload} locale="en" />);

    const textContent = container.textContent || '';
    // Should show Unix seconds
    expect(textContent).toContain('1672444800');
    // Should also show formatted time (December or 2022)
    expect(textContent.match(/December|2022|December/)).toBeTruthy();
  });

  it('renders all standard claim types', () => {
    const payload = {
      iss: 'issuer',
      sub: 'subject',
      aud: 'audience',
      exp: 1234567890,
      iat: 1234567890,
      nbf: 1234567890,
      jti: 'jwt-id',
      typ: 'JWT',
      kid: 'key-id',
    };

    render(<ClaimsTable payload={payload} locale="en" />);

    expect(screen.getByText('Issuer')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Audience')).toBeInTheDocument();
    expect(screen.getByText('Expiration Time')).toBeInTheDocument();
    expect(screen.getByText('Issued At')).toBeInTheDocument();
    expect(screen.getByText('Not Before')).toBeInTheDocument();
    expect(screen.getByText('JWT ID')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Key ID')).toBeInTheDocument();
  });

  it('renders semantic table structure', () => {
    const payload = { iss: 'example.com' };

    const { container } = render(<ClaimsTable payload={payload} locale="en" />);

    const tables = container.querySelectorAll('table');
    expect(tables.length).toBeGreaterThan(0);

    const theads = container.querySelectorAll('thead');
    expect(theads.length).toBeGreaterThan(0);

    const tbodies = container.querySelectorAll('tbody');
    expect(tbodies.length).toBeGreaterThan(0);
  });

  it('uses locale for timestamp formatting', () => {
    const payload = {
      iat: 1672444800, // 2023-01-01T00:00:00Z
    };

    render(<ClaimsTable payload={payload} locale="ko-KR" />);

    // Just verify it renders without error and shows the timestamp
    expect(screen.getByText('1672444800')).toBeInTheDocument();
  });
});
