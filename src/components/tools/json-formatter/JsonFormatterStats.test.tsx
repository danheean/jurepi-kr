import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { JsonFormatterStats } from './JsonFormatterStats';
import { NextIntlClientProvider } from 'next-intl';

const mockMessages = {
  tools: {
    'json-formatter': {
      stats: {
        size: 'Size',
        elements: 'Elements',
        depth: 'Depth',
        display: '{size} · {elements} items · depth {depth}',
      },
    },
  },
};

const renderWithI18n = (component: React.ReactNode) => {
  return render(
    <NextIntlClientProvider locale="ko" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('JsonFormatterStats', () => {
  it('renders nothing when stats is null', () => {
    const { container } = renderWithI18n(
      <JsonFormatterStats stats={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders with valid stats', () => {
    const { container } = renderWithI18n(
      <JsonFormatterStats
        stats={{
          byteSize: 1024,
          elementCount: 5,
          depth: 2,
        }}
      />
    );

    expect(container.textContent).toContain('1 KB');
    expect(container.textContent).toContain('5');
    expect(container.textContent).toContain('2');
  });

  it('formats 0 bytes correctly', () => {
    const { container } = renderWithI18n(
      <JsonFormatterStats
        stats={{
          byteSize: 0,
          elementCount: 0,
          depth: 0,
        }}
      />
    );

    expect(container.textContent).toContain('0 B');
  });

  it('displays element count', () => {
    const { container } = renderWithI18n(
      <JsonFormatterStats
        stats={{
          byteSize: 1024,
          elementCount: 42,
          depth: 2,
        }}
      />
    );

    expect(container.textContent).toContain('42');
  });

  it('displays depth level', () => {
    const { container } = renderWithI18n(
      <JsonFormatterStats
        stats={{
          byteSize: 1024,
          elementCount: 5,
          depth: 5,
        }}
      />
    );

    expect(container.textContent).toContain('5');
  });

  it('formats large byte sizes as MB', () => {
    const { container } = renderWithI18n(
      <JsonFormatterStats
        stats={{
          byteSize: 1024 * 1024,
          elementCount: 100,
          depth: 10,
        }}
      />
    );

    expect(container.textContent).toContain('1 MB');
  });
});
