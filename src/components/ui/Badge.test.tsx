import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
import { describe, it, expect } from 'vitest';

describe('Badge Component', () => {
  it('renders children text', () => {
    render(<Badge>New Feature</Badge>);
    expect(screen.getByText('New Feature')).toBeInTheDocument();
  });

  it('applies default "new" variant styles', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-accent-mint-soft');
    expect(badge).toHaveClass('text-accent-mint-ink');
  });

  it('applies "new" variant styles explicitly', () => {
    render(<Badge variant="new">New</Badge>);
    const badge = screen.getByText('New');
    expect(badge).toHaveClass('bg-accent-mint-soft');
    expect(badge).toHaveClass('text-accent-mint-ink');
  });

  it('applies "popular" variant styles', () => {
    render(<Badge variant="popular">Popular</Badge>);
    const badge = screen.getByText('Popular');
    expect(badge).toHaveClass('bg-accent-sun-soft');
    expect(badge).toHaveClass('text-accent-sun-ink');
  });

  it('applies "soon" variant styles', () => {
    render(<Badge variant="soon">Coming Soon</Badge>);
    const badge = screen.getByText('Coming Soon');
    expect(badge).toHaveClass('bg-surface-muted');
    expect(badge).toHaveClass('text-text-secondary');
  });

  it('renders as inline-block span', () => {
    render(<Badge>Badge</Badge>);
    const badge = screen.getByText('Badge');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveClass('inline-block');
  });

  it('has rounded-full styling', () => {
    render(<Badge>Round</Badge>);
    const badge = screen.getByText('Round');
    expect(badge).toHaveClass('rounded-full');
  });

  it('has padding applied', () => {
    render(<Badge>Padded</Badge>);
    const badge = screen.getByText('Padded');
    expect(badge).toHaveClass('px-2', 'py-1');
  });

  it('uses font-eyebrow typography', () => {
    render(<Badge>Typo</Badge>);
    const badge = screen.getByText('Typo');
    expect(badge).toHaveClass('font-eyebrow');
  });

  it('renders multiple badges with different variants', () => {
    render(
      <div>
        <Badge variant="new">New</Badge>
        <Badge variant="popular">Popular</Badge>
        <Badge variant="soon">Soon</Badge>
      </div>
    );

    const newBadge = screen.getByText('New');
    const popularBadge = screen.getByText('Popular');
    const soonBadge = screen.getByText('Soon');

    expect(newBadge).toHaveClass('bg-accent-mint-soft');
    expect(popularBadge).toHaveClass('bg-accent-sun-soft');
    expect(soonBadge).toHaveClass('bg-surface-muted');
  });
});
