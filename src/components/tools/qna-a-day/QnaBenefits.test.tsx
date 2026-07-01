import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QnaBenefits } from './QnaBenefits';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => {
      if (key === 'benefits.heading') return 'Benefits';
      return key;
    };

    // Add the raw method
    t.raw = (key: string) => {
      if (key === 'benefits.items') {
        return [
          { title: 'Benefit 1', body: 'Body for benefit 1' },
          { title: 'Benefit 2', body: 'Body for benefit 2' },
          { title: 'Benefit 3', body: 'Body for benefit 3' },
        ];
      }
      return key;
    };

    return t;
  },
}));

describe('QnaBenefits', () => {
  it('renders benefits heading', () => {
    render(<QnaBenefits />);

    expect(screen.getByText('Benefits')).toBeInTheDocument();
  });

  it('renders 3 benefit items', () => {
    render(<QnaBenefits />);

    for (let i = 1; i <= 3; i++) {
      expect(screen.getByText(`Benefit ${i}`)).toBeInTheDocument();
    }
  });

  it('renders benefit bodies', () => {
    render(<QnaBenefits />);

    for (let i = 1; i <= 3; i++) {
      expect(screen.getByText(`Body for benefit ${i}`)).toBeInTheDocument();
    }
  });

  it('renders benefits in card grid layout', () => {
    const { container } = render(<QnaBenefits />);

    // Check for grid container
    const gridContainer = container.querySelector(
      '.grid.grid-cols-1.sm\\:grid-cols-3'
    );
    expect(gridContainer).toBeInTheDocument();

    // Should have 3 cards (divs with border-hairline)
    const cards = container.querySelectorAll('.border.border-hairline');
    // Filter for benefit cards (should exclude other elements)
    const benefitCards = Array.from(cards).filter(
      (card) => card.querySelector('[class*="font-semibold"]') !== null
    );
    expect(benefitCards.length).toBeGreaterThanOrEqual(3);
  });

  it('renders section with proper semantic structure', () => {
    const { container } = render(<QnaBenefits />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('space-y-6', 'py-12', 'border-t', 'border-hairline');
  });
});
