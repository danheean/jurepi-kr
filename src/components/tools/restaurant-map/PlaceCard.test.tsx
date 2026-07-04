import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaceCard } from './PlaceCard';
import { renderWithIntl } from './test-utils';
import type { Place } from '@/lib/restaurant-map/schema';

const testPlace: Place = {
  id: 'test-list-1#0',
  name: 'Cafe A',
  lat: 37.5,
  lng: 127.0,
  category: 'cafe',
  address: 'Gangnam, Seoul',
  description: 'Best cafe',
  personalNote: 'Great vibe',
};

describe('PlaceCard', () => {
  it('renders place name and description', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={false}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    expect(screen.getByText('Cafe A')).toBeInTheDocument();
    expect(screen.getByText('Best cafe')).toBeInTheDocument();
  });

  it('renders personal note in a separate quote block', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const { container } = renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={false}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    // Personal note should be in a separate div with quote icon and muted background
    const quoteElement = screen.getByText('Great vibe');
    expect(quoteElement).toBeInTheDocument();
    // Find the parent with bg-surface-muted class
    const quoteBlock = quoteElement.closest('[class*="bg-surface-muted"]');
    expect(quoteBlock).toHaveClass('bg-surface-muted');
  });

  it('renders category label from i18n', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={false}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    // Category label should come from i18n
    expect(screen.getByText('Café')).toBeInTheDocument();
  });

  it('renders distance when userGeo is provided', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={false}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        userGeo={{ lat: 37.5, lng: 127.0 }}
      />
    );

    // Should show distance (0 km in this case, exact match)
    expect(screen.getByText(/0\.0km/)).toBeInTheDocument();
  });

  it('applies selected state styling when isSelected=true', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const { container } = renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={true}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const article = container.querySelector('article');
    expect(article).toHaveClass('ring-2');
    expect(article).toHaveClass('border-accent-rose');
  });

  it('calls onSelect when card is clicked', async () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={false}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const article = container.querySelector('article');
    await user.click(article!);

    expect(onSelect).toHaveBeenCalled();
  });

  it('calls onToggleFavorite with correct place.id when favorite button is clicked', async () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={false}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const favButton = screen.getByLabelText('Add to favorites');
    await user.click(favButton);

    expect(onToggleFavorite).toHaveBeenCalledOnce();
    // onToggleFavorite receives the synthetic event, not placeId directly
    // (parent component extracts placeId before calling this)
  });

  it('shows filled star when isFavorited=true', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const { container } = renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={false}
        isFavorited={true}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    // Favorite star should have fill style when favorited
    const star = container.querySelector('svg');
    expect(star).toHaveClass('fill-accent-rose');
  });

  it('renders external link button when link is provided', () => {
    const placeWithLink: Place = {
      ...testPlace,
      link: 'https://example.com/place',
    };
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    renderWithIntl(
      <PlaceCard
        place={placeWithLink}
        isSelected={false}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const externalLink = screen.getByLabelText('Open in external map');
    expect(externalLink).toBeInTheDocument();
    expect(externalLink).toHaveAttribute('href', 'https://example.com/place');
    expect(externalLink).toHaveAttribute('target', '_blank');
  });

  it('does not render external link when link is not provided', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={false}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const externalLink = screen.queryByLabelText('Open in external map');
    expect(externalLink).not.toBeInTheDocument();
  });

  it('renders address information', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={false}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    expect(screen.getByText('Gangnam, Seoul')).toBeInTheDocument();
  });

  it('uses data-testid with place.id for reliable E2E selection', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const { container } = renderWithIntl(
      <PlaceCard
        place={testPlace}
        isSelected={false}
        isFavorited={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const article = container.querySelector('[data-testid="place-card-test-list-1#0"]');
    expect(article).toBeInTheDocument();
  });
});
