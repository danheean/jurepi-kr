import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { ProvenanceBanner } from './ProvenanceBanner';

const messages: AbstractIntlMessages = {
  tools: {
    rankings: {
      detail: {
        provenance: {
          aria: '순위 출처 및 기준일',
          asOfLabel: '기준일',
          sourceLabel: '출처',
        },
      },
    },
  },
};

function renderWithIntl(component: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('ProvenanceBanner', () => {
  it('renders asOfDate and sourceNote', () => {
    renderWithIntl(
      <ProvenanceBanner
        asOfDate="2026-06"
        sourceNote="Test source"
      />
    );

    expect(screen.getByText('2026-06')).toBeInTheDocument();
    expect(screen.getByText('Test source')).toBeInTheDocument();
  });

  it('renders as link when sourceUrl provided', () => {
    renderWithIntl(
      <ProvenanceBanner
        asOfDate="2026-06"
        sourceNote="Test source"
        sourceUrl="https://example.com"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders with rose-soft background and rose border', () => {
    const { container } = renderWithIntl(
      <ProvenanceBanner
        asOfDate="2026-06"
        sourceNote="Test source"
      />
    );

    const banner = container.querySelector('[aria-label]');
    expect(banner).toHaveClass('bg-accent-rose-soft', 'border-accent-rose');
  });

  it('has aria-label grouping both fields', () => {
    renderWithIntl(
      <ProvenanceBanner
        asOfDate="2026-06"
        sourceNote="Test source"
      />
    );

    const banner = screen.getByLabelText('순위 출처 및 기준일');
    expect(banner).toBeInTheDocument();
  });
});
