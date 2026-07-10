import { render, screen, userEvent } from '@/__test__/test-utils';
import { vi } from 'vitest';
import { FavoritesFilterToggle } from './FavoritesFilterToggle';

describe('FavoritesFilterToggle', () => {
  it('renders button with heart icon and label', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('has aria-pressed attribute reflecting active state', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <FavoritesFilterToggle active={true} onToggle={handleToggle} />
    );

    button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('displays correct aria-label', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Filter by favorites');
  });

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('uses provided testId', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle
        active={false}
        onToggle={handleToggle}
        testId="custom-toggle"
      />
    );

    const button = screen.getByTestId('custom-toggle');
    expect(button).toBeInTheDocument();
  });

  it('uses default testId if not provided', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByTestId('favorites-filter-toggle');
    expect(button).toBeInTheDocument();
  });

  it('uses the rose favorite semantic (filled chip) when active', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={true} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    // Filled rose chip — deliberately NOT the brand-gold category-active pill.
    expect(button).toHaveClass('bg-accent-rose-soft');
    expect(button).toHaveClass('text-accent-rose-ink');
    expect(button).toHaveClass('shadow-card');
    expect(button).toHaveClass('font-semibold');
    // It must not borrow the category pill's brand-fill vocabulary.
    expect(button).not.toHaveClass('bg-brand');
    expect(button).not.toHaveClass('text-on-brand');
  });

  it('renders as an outlined rose chip when inactive', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-accent-rose/40');
    expect(button).toHaveClass('bg-surface');
    expect(button).toHaveClass('text-accent-rose-ink');
    expect(button).toHaveClass('font-medium');
    // Distinct from an inactive category pill (cream muted fill).
    expect(button).not.toHaveClass('bg-surface-muted');
  });

  it('has hover styling when inactive', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-accent-rose-soft');
  });

  it('has min-h-11 and focus-visible ring styling', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-11');
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button).toHaveClass('focus-visible:ring-offset-2');
    expect(button).toHaveClass('focus-visible:ring-focus-ring');
  });

  it('fills heart icon when active', () => {
    const handleToggle = vi.fn();
    const { rerender: rerenderComp } = render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    let heartIcon = screen.getByRole('button').querySelector('svg');
    expect(heartIcon).toHaveAttribute('fill', 'none');

    rerenderComp(
      <FavoritesFilterToggle active={true} onToggle={handleToggle} />
    );

    heartIcon = screen.getByRole('button').querySelector('svg');
    expect(heartIcon).toHaveAttribute('fill', 'currentColor');
  });

  it('shows the saved-count badge only when count > 0', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} count={0} />
    );

    // No lonely "0" badge when nothing is saved.
    expect(screen.queryByText('0')).not.toBeInTheDocument();

    rerender(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} count={3} />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('beats the heart once when switching from inactive to active', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <FavoritesFilterToggle active={false} onToggle={handleToggle} />
    );

    let heart = screen.getByRole('button').querySelector('svg');
    expect(heart).not.toHaveClass('motion-safe:animate-heart-beat');

    rerender(
      <FavoritesFilterToggle active={true} onToggle={handleToggle} />
    );

    heart = screen.getByRole('button').querySelector('svg');
    expect(heart).toHaveClass('motion-safe:animate-heart-beat');
  });

  it('does not beat the heart on the initial active render', () => {
    const handleToggle = vi.fn();
    render(
      <FavoritesFilterToggle active={true} onToggle={handleToggle} />
    );

    const heart = screen.getByRole('button').querySelector('svg');
    expect(heart).not.toHaveClass('motion-safe:animate-heart-beat');
  });
});
