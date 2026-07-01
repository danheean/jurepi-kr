import { render, screen } from '@/__test__/test-utils';
import { LadderHowTo } from './LadderHowTo';
import { describe, it, expect } from 'vitest';

describe('LadderHowTo Component', () => {
  it('renders summary heading', () => {
    const { container } = render(<LadderHowTo />);
    const summary = container.querySelector('summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('How to play');
  });

  it('renders summary with "How to play" text', () => {
    const { container } = render(<LadderHowTo />);
    const summary = container.querySelector('summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('How to play');
  });

  it('renders "What is the Ladder Game?" subheading', () => {
    render(<LadderHowTo />);
    const subheadings = screen.getAllByRole('heading', { level: 3 });
    expect(subheadings[0]).toHaveTextContent('What is the Ladder Game?');
  });

  it('renders "How to play" subheading', () => {
    render(<LadderHowTo />);
    const subheadings = screen.getAllByRole('heading', { level: 3 });
    expect(subheadings[1]).toHaveTextContent('How to play');
  });

  it('renders whatIsBody content', () => {
    render(<LadderHowTo />);
    expect(screen.getByText('The Ladder Game is a classic method for fairly deciding outcomes.')).toBeInTheDocument();
  });

  it('renders howToBody content', () => {
    render(<LadderHowTo />);
    expect(screen.getByText('Start by selecting the number of players.')).toBeInTheDocument();
  });

  it('renders in a section element', () => {
    const { container } = render(<LadderHowTo />);
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('has article elements for each section', () => {
    const { container } = render(<LadderHowTo />);
    const articles = container.querySelectorAll('article');
    expect(articles).toHaveLength(3);
  });

  it('applies space-y-8 to section inside details', () => {
    const { container } = render(<LadderHowTo />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('space-y-8');
  });

  it('applies my-12 to details element', () => {
    const { container } = render(<LadderHowTo />);
    const details = container.querySelector('details');
    expect(details).toHaveClass('my-12');
  });

  it('applies headline font class to summary', () => {
    const { container } = render(<LadderHowTo />);
    const summary = container.querySelector('summary');
    expect(summary).toHaveClass('text-headline');
  });

  it('applies card-title font class to subheadings', () => {
    render(<LadderHowTo />);
    const subheadings = screen.getAllByRole('heading', { level: 3 });
    subheadings.forEach((subheading) => {
      expect(subheading).toHaveClass('text-card-title');
    });
  });

  it('applies body font class to paragraphs', () => {
    render(<LadderHowTo />);
    const paragraphs = screen.getAllByText((content, element) => {
      return element?.tagName === 'P';
    });
    paragraphs.forEach((paragraph) => {
      expect(paragraph).toHaveClass('font-body');
    });
  });

  it('applies text-secondary class to paragraphs', () => {
    render(<LadderHowTo />);
    const paragraphs = screen.getAllByText((content, element) => {
      return element?.tagName === 'P';
    });
    paragraphs.forEach((paragraph) => {
      expect(paragraph).toHaveClass('text-text-secondary');
    });
  });

  it('applies leading-relaxed class to paragraphs', () => {
    render(<LadderHowTo />);
    const paragraphs = screen.getAllByText((content, element) => {
      return element?.tagName === 'P';
    });
    paragraphs.forEach((paragraph) => {
      expect(paragraph).toHaveClass('leading-relaxed');
    });
  });

  // Help collapse feature tests
  it('renders a details element with data-testid', () => {
    render(<LadderHowTo />);
    const details = screen.getByTestId('howto-details');
    expect(details).toBeInTheDocument();
    expect(details.tagName).toBe('DETAILS');
  });

  it('has no open attribute by default (collapsed)', () => {
    render(<LadderHowTo />);
    const details = screen.getByTestId('howto-details');
    expect(details).not.toHaveAttribute('open');
  });

  it('renders summary with heading text', () => {
    render(<LadderHowTo />);
    // The summary should be the first child and contain the heading text
    const details = screen.getByTestId('howto-details');
    const summary = details.querySelector('summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('How to play');
  });

  it('keeps all content in DOM for SEO when collapsed', () => {
    render(<LadderHowTo />);
    // Content should be in DOM (not just visible when expanded)
    const details = screen.getByTestId('howto-details');
    expect(details).toHaveTextContent('What is the Ladder Game?');
    expect(details).toHaveTextContent('The Ladder Game is a classic method for fairly deciding outcomes.');
    expect(details).toHaveTextContent('Start by selecting the number of players.');
  });

  it('renders "Handy features" subheading', () => {
    render(<LadderHowTo />);
    const subheadings = screen.getAllByRole('heading', { level: 3 });
    expect(subheadings[2]).toHaveTextContent('Handy features');
  });

  it('renders features content with whitespace-pre-wrap', () => {
    render(<LadderHowTo />);
    const details = screen.getByTestId('howto-details');
    expect(details).toHaveTextContent('Handy features');
    expect(details).toHaveTextContent('Turn on');
  });
});
