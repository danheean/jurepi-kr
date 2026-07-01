import { render, screen } from '@/__test__/test-utils';
import { LadderUseCases } from './LadderUseCases';
import { describe, it, expect } from 'vitest';

describe('LadderUseCases Component', () => {
  it('renders heading', () => {
    render(<LadderUseCases />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('When the Ladder Game comes in handy');
  });

  it('renders lead text', () => {
    render(<LadderUseCases />);
    expect(
      screen.getByText(
        /From a simple bet to an awkward turn order/i
      )
    ).toBeInTheDocument();
  });

  it('renders first use case title "Coffee & lunch runs"', () => {
    render(<LadderUseCases />);
    expect(screen.getByText('Coffee & lunch runs')).toBeInTheDocument();
  });

  it('renders second use case title "Chores & duties"', () => {
    render(<LadderUseCases />);
    expect(screen.getByText('Chores & duties')).toBeInTheDocument();
  });

  it('renders third use case title "Presentation & game order"', () => {
    render(<LadderUseCases />);
    expect(screen.getByText('Presentation & game order')).toBeInTheDocument();
  });

  it('renders fourth use case title "Making teams or groups"', () => {
    render(<LadderUseCases />);
    expect(screen.getByText('Making teams or groups')).toBeInTheDocument();
  });

  it('renders fifth use case title "Gift & prize exchanges"', () => {
    render(<LadderUseCases />);
    expect(screen.getByText('Gift & prize exchanges')).toBeInTheDocument();
  });

  it('renders all 5 use case items as articles', () => {
    const { container } = render(<LadderUseCases />);
    const articles = container.querySelectorAll('article');
    expect(articles).toHaveLength(5);
  });

  it('renders use case cards with border styling', () => {
    const { container } = render(<LadderUseCases />);
    const articles = container.querySelectorAll('article');
    articles.forEach((article) => {
      expect(article).toHaveClass('border', 'rounded-lg', 'p-5');
    });
  });

  it('renders use case cards with hover shadow transition', () => {
    const { container } = render(<LadderUseCases />);
    const articles = container.querySelectorAll('article');
    articles.forEach((article) => {
      expect(article).toHaveClass('hover:shadow-card', 'transition-shadow');
    });
  });

  it('renders use case titles with card-title class', () => {
    render(<LadderUseCases />);
    const titles = screen.getAllByRole('heading', { level: 3 });
    expect(titles.length).toBeGreaterThanOrEqual(5);
    titles.slice(0, 5).forEach((title) => {
      expect(title).toHaveClass('text-card-title');
    });
  });

  it('renders use case body text with body class', () => {
    const { container } = render(<LadderUseCases />);
    const paragraphs = container.querySelectorAll('article > p:last-child');
    paragraphs.forEach((p) => {
      expect(p).toHaveClass('text-body');
    });
  });

  it('renders use case body with text-secondary class', () => {
    const { container } = render(<LadderUseCases />);
    const paragraphs = container.querySelectorAll('article > p:last-child');
    paragraphs.forEach((p) => {
      expect(p).toHaveClass('text-text-secondary');
    });
  });

  it('renders use case body with leading-relaxed class', () => {
    const { container } = render(<LadderUseCases />);
    const paragraphs = container.querySelectorAll('article > p:last-child');
    paragraphs.forEach((p) => {
      expect(p).toHaveClass('leading-relaxed');
    });
  });

  it('renders section with my-12 margin', () => {
    const { container } = render(<LadderUseCases />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('my-12');
  });

  it('renders grid with responsive columns', () => {
    const { container } = render(<LadderUseCases />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'gap-4');
  });

  it('renders first use case body content', () => {
    render(<LadderUseCases />);
    expect(
      screen.getByText(
        /Deciding who buys the coffee or covers lunch today/i
      )
    ).toBeInTheDocument();
  });

  it('renders second use case body content', () => {
    render(<LadderUseCases />);
    expect(
      screen.getByText(
        /Splitting up the dishes, recycling, or note-taking/i
      )
    ).toBeInTheDocument();
  });
});
