import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__test__/test-utils';
import { IconButton } from './IconButton';
import { Heart } from 'lucide-react';

describe('IconButton', () => {
  it('renders with aria-label and accessible role', () => {
    render(
      <IconButton
        icon={<Heart className="w-5 h-5" />}
        ariaLabel="Favorite"
        testId="favorite-btn"
      />
    );

    const button = screen.getByRole('button', { name: 'Favorite' });
    expect(button).toBeInTheDocument();
  });

  it('fires onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(
      <IconButton
        icon={<Heart className="w-5 h-5" />}
        ariaLabel="Favorite"
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('button', { name: 'Favorite' });
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with correct size class', () => {
    const { rerender } = render(
      <IconButton
        icon={<Heart className="w-5 h-5" />}
        ariaLabel="Favorite"
        size="sm"
      />
    );

    let button = screen.getByRole('button', { name: 'Favorite' });
    expect(button).toHaveClass('w-9', 'h-9');

    rerender(
      <IconButton
        icon={<Heart className="w-5 h-5" />}
        ariaLabel="Favorite"
        size="md"
      />
    );

    button = screen.getByRole('button', { name: 'Favorite' });
    expect(button).toHaveClass('w-11', 'h-11');

    rerender(
      <IconButton
        icon={<Heart className="w-5 h-5" />}
        ariaLabel="Favorite"
        size="lg"
      />
    );

    button = screen.getByRole('button', { name: 'Favorite' });
    expect(button).toHaveClass('w-12', 'h-12');
  });

  it('renders with correct variant class', () => {
    const { rerender } = render(
      <IconButton
        icon={<Heart className="w-5 h-5" />}
        ariaLabel="Favorite"
        variant="ghost"
      />
    );

    let button = screen.getByRole('button', { name: 'Favorite' });
    expect(button).toHaveClass('bg-transparent');

    rerender(
      <IconButton
        icon={<Heart className="w-5 h-5" />}
        ariaLabel="Favorite"
        variant="secondary"
      />
    );

    button = screen.getByRole('button', { name: 'Favorite' });
    expect(button).toHaveClass('bg-surface-muted');
  });

  it('applies custom className', () => {
    render(
      <IconButton
        icon={<Heart className="w-5 h-5" />}
        ariaLabel="Favorite"
        className="custom-class"
      />
    );

    const button = screen.getByRole('button', { name: 'Favorite' });
    expect(button).toHaveClass('custom-class');
  });

  it('renders icon children correctly', () => {
    render(
      <IconButton
        icon={<Heart className="w-5 h-5" data-testid="heart-icon" />}
        ariaLabel="Favorite"
      />
    );

    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
  });

  it('has focus-visible ring for keyboard accessibility', () => {
    render(
      <IconButton
        icon={<Heart className="w-5 h-5" />}
        ariaLabel="Favorite"
      />
    );

    const button = screen.getByRole('button', { name: 'Favorite' });
    expect(button).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-focus-ring');
  });
});
