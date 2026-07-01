import { render, screen } from '@/__test__/test-utils';
import { LadderFaq } from './LadderFaq';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('LadderFaq Component', () => {
  it('renders main heading', () => {
    render(<LadderFaq />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
  });

  it('renders "Frequently Asked Questions" heading', () => {
    render(<LadderFaq />);
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('renders all FAQ items as details elements', () => {
    const { container } = render(<LadderFaq />);
    const detailsElements = container.querySelectorAll('details');
    expect(detailsElements.length).toBeGreaterThan(0);
  });

  it('renders all 9 FAQ items', () => {
    const { container } = render(<LadderFaq />);
    const detailsElements = container.querySelectorAll('details');
    expect(detailsElements).toHaveLength(9);
  });

  it('renders first FAQ question', () => {
    render(<LadderFaq />);
    expect(screen.getByText('Is the ladder game really fair?')).toBeInTheDocument();
  });

  it('renders first FAQ answer', () => {
    render(<LadderFaq />);
    expect(screen.getByText('Yes, absolutely.')).toBeInTheDocument();
  });

  it('renders second FAQ question', () => {
    render(<LadderFaq />);
    expect(screen.getByText('How many players can play?')).toBeInTheDocument();
  });

  it('renders second FAQ answer', () => {
    render(<LadderFaq />);
    expect(screen.getByText('You can play with 2 to 10 players.')).toBeInTheDocument();
  });

  it('initially collapses all FAQ items', () => {
    const { container } = render(<LadderFaq />);
    const allDetails = container.querySelectorAll('details');
    // All details should NOT have open attribute initially
    allDetails.forEach((detail) => {
      expect(detail.hasAttribute('open')).toBe(false);
    });
  });

  it('expands details when clicked', async () => {
    const user = userEvent.setup();
    render(<LadderFaq />);

    const firstQuestion = screen.getByText('Is the ladder game really fair?');
    const firstDetails = firstQuestion.closest('details');

    // Initially not open
    expect(firstDetails?.hasAttribute('open')).toBe(false);

    // Click to expand
    await user.click(firstQuestion);

    // After clicking, it should be expanded
    expect(firstDetails?.hasAttribute('open')).toBe(true);
  });

  it('collapses expanded details when clicked again', async () => {
    const user = userEvent.setup();
    render(<LadderFaq />);

    const firstQuestion = screen.getByText('Is the ladder game really fair?');
    const firstDetails = firstQuestion.closest('details');

    // Initially not open
    expect(firstDetails?.hasAttribute('open')).toBe(false);

    // Click to expand
    await user.click(firstQuestion);
    expect(firstDetails?.hasAttribute('open')).toBe(true);

    // Click again to collapse
    await user.click(firstQuestion);
    expect(firstDetails?.hasAttribute('open')).toBe(false);
  });

  it('renders details with border styling', () => {
    render(<LadderFaq />);
    const detailsElements = document.querySelectorAll('details');
    detailsElements.forEach((details) => {
      expect(details).toHaveClass('border', 'rounded-lg', 'p-4');
    });
  });

  it('renders details with transition-shadow on hover', () => {
    render(<LadderFaq />);
    const detailsElements = document.querySelectorAll('details');
    detailsElements.forEach((details) => {
      expect(details).toHaveClass('transition-shadow');
    });
  });

  it('renders summary with card-title font class', () => {
    render(<LadderFaq />);
    const summaries = document.querySelectorAll('summary');
    summaries.forEach((summary) => {
      expect(summary).toHaveClass('text-card-title');
    });
  });

  it('renders summary with list-none to hide default marker', () => {
    render(<LadderFaq />);
    const summaries = document.querySelectorAll('summary');
    summaries.forEach((summary) => {
      expect(summary).toHaveClass('list-none');
    });
  });

  it('renders answer paragraphs with body font class', () => {
    render(<LadderFaq />);
    const paragraphs = document.querySelectorAll('details > p');
    expect(paragraphs.length).toBeGreaterThan(0);
    paragraphs.forEach((p) => {
      expect(p).toHaveClass('font-body');
    });
  });

  it('renders answer paragraphs with text-secondary class', () => {
    render(<LadderFaq />);
    const paragraphs = document.querySelectorAll('details > p');
    paragraphs.forEach((p) => {
      expect(p).toHaveClass('text-text-secondary');
    });
  });

  it('renders JSON-LD script for FAQ schema', () => {
    render(<LadderFaq />);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThan(0);

    const faqScript = Array.from(scripts).find((s) => {
      const content = s.textContent || '';
      return content.includes('FAQPage');
    });

    expect(faqScript).toBeDefined();
  });

  it('includes correct JSON-LD structure in FAQ schema', () => {
    render(<LadderFaq />);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    const faqScript = Array.from(scripts).find((s) => {
      const content = s.textContent || '';
      return content.includes('FAQPage');
    });

    expect(faqScript).toBeDefined();
    const jsonContent = faqScript?.textContent || '';
    const parsed = JSON.parse(jsonContent);

    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed.mainEntity).toBeDefined();
    expect(Array.isArray(parsed.mainEntity)).toBe(true);
    expect(parsed.mainEntity.length).toBe(9);
  });

  it('has correct FAQ schema for first question', () => {
    render(<LadderFaq />);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    const faqScript = Array.from(scripts).find((s) => {
      const content = s.textContent || '';
      return content.includes('FAQPage');
    });

    const jsonContent = faqScript?.textContent || '';
    const parsed = JSON.parse(jsonContent);

    expect(parsed.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'Is the ladder game really fair?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, absolutely.',
      },
    });
  });

  it('applies my-12 margin to section', () => {
    const { container } = render(<LadderFaq />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('my-12');
  });

  it('applies space-y-6 to spacing', () => {
    const { container } = render(<LadderFaq />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('space-y-6');
  });
});
