import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect } from 'vitest';
import { ToolCard } from './ToolCard';
import type { SearchableTool } from '@/lib/tool-search';

describe('ToolCard', () => {
  const mockLiveTool: SearchableTool = {
    id: 'ladder',
    slug: 'ladder',
    name: 'Ladder Game',
    description: 'Play the ladder game',
    category: 'random',
    accent: 'coral',
    icon: 'ListTree',
    status: 'live',
    isNew: true,
    isPopular: true,
    order: 1,
    keywords: ['ladder'],
  };

  const mockComingSoonTool: SearchableTool = {
    id: 'picker',
    slug: 'picker',
    name: 'Random Picker',
    description: 'Pick randomly from a list',
    category: 'random',
    accent: 'rose',
    icon: 'Dices',
    status: 'coming_soon',
    order: 2,
    keywords: ['picker'],
  };

  it('renders live tool as a link', () => {
    render(<ToolCard tool={mockLiveTool} testId="card-ladder" />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    // next-intl Link prefixes the active locale (localePrefix: 'always').
    expect(link.getAttribute('href')).toMatch(/\/tools\/ladder$/);
  });

  it('renders coming_soon tool as non-interactive div', () => {
    render(<ToolCard tool={mockComingSoonTool} testId="card-picker" />);
    const link = screen.queryByRole('link');
    expect(link).not.toBeInTheDocument();
    const card = screen.getByTestId('card-picker');
    expect(card).toHaveAttribute('aria-disabled', 'true');
  });

  it('displays tool title and description', () => {
    render(<ToolCard tool={mockLiveTool} />);
    expect(screen.getByText('Ladder Game')).toBeInTheDocument();
    expect(screen.getByText('Play the ladder game')).toBeInTheDocument();
  });

  it('shows NEW badge when isNew is true', () => {
    render(<ToolCard tool={mockLiveTool} testId="card" />);
    const newBadge = screen.getByTestId('card-badge-new');
    expect(newBadge).toBeInTheDocument();
    expect(newBadge).toHaveTextContent('New');
  });

  it('shows Popular badge when isPopular is true', () => {
    render(<ToolCard tool={mockLiveTool} testId="card" />);
    const popularBadge = screen.getByTestId('card-badge-popular');
    expect(popularBadge).toBeInTheDocument();
    expect(popularBadge).toHaveTextContent('Popular');
  });

  it('shows Coming Soon badge for coming_soon status', () => {
    render(<ToolCard tool={mockComingSoonTool} testId="card" />);
    const soonBadge = screen.getByTestId('card-badge-soon');
    expect(soonBadge).toBeInTheDocument();
    expect(soonBadge).toHaveTextContent('Coming soon');
  });

  it('applies opacity-70 to coming_soon card', () => {
    render(<ToolCard tool={mockComingSoonTool} testId="card-picker" />);
    const card = screen.getByTestId('card-picker');
    expect(card).toHaveClass('opacity-70');
  });

  it('does not apply opacity to live card', () => {
    render(<ToolCard tool={mockLiveTool} testId="card-ladder" />);
    const card = screen.getByTestId('card-ladder');
    expect(card).not.toHaveClass('opacity-70');
  });

  it('does not show coming_soon badge for live tool', () => {
    render(<ToolCard tool={mockLiveTool} testId="card" />);
    const soonBadges = screen.queryAllByText('Coming soon');
    expect(soonBadges.length).toBe(0);
  });

  it('renders tool icon', () => {
    const { container } = render(<ToolCard tool={mockLiveTool} />);
    // ToolIcon renders as an SVG element (lucide-react)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
