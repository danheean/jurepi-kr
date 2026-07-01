import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QnaExamples } from './QnaExamples';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => {
      if (key === 'examples.heading') return 'Examples';
      if (key === 'examples.lead') return 'This is the lead text';
      if (key === 'examples.note') return 'This is a note';
      return key;
    };

    // Add the raw method
    t.raw = (key: string) => {
      if (key === 'examples.items') {
        return [
          'Question 1',
          'Question 2',
          'Question 3',
          'Question 4',
          'Question 5',
        ];
      }
      return key;
    };

    return t;
  },
}));

describe('QnaExamples', () => {
  it('renders examples heading', () => {
    render(<QnaExamples />);

    expect(screen.getByText('Examples')).toBeInTheDocument();
  });

  it('renders lead text', () => {
    render(<QnaExamples />);

    expect(screen.getByText('This is the lead text')).toBeInTheDocument();
  });

  it('renders 5 example questions', () => {
    render(<QnaExamples />);

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Question ${i}`)).toBeInTheDocument();
    }
  });

  it('renders note text', () => {
    render(<QnaExamples />);

    expect(screen.getByText('This is a note')).toBeInTheDocument();
  });

  it('renders questions in card containers', () => {
    const { container } = render(<QnaExamples />);

    // Check for cards with border-hairline
    const cards = container.querySelectorAll('.border.border-hairline');
    // Should have at least 5 cards (one for each question)
    expect(cards.length).toBeGreaterThanOrEqual(5);
  });

  it('renders quotation marks around questions', () => {
    const { container } = render(<QnaExamples />);

    // Check for left and right quotation marks
    const leftQuotes = container.querySelectorAll('.text-accent-grape');
    // Should have at least 10 quote marks (2 per question × 5 questions)
    expect(leftQuotes.length).toBeGreaterThanOrEqual(10);
  });

  it('renders section with proper semantic structure', () => {
    const { container } = render(<QnaExamples />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('space-y-6', 'py-12', 'border-t', 'border-hairline');
  });

  it('renders note with proper styling', () => {
    const { container } = render(<QnaExamples />);

    const noteElement = screen.getByText('This is a note');
    expect(noteElement).toHaveClass('text-caption', 'text-text-muted');
  });
});
