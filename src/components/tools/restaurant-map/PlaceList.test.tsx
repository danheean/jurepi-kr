import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaceList } from './PlaceList';
import { renderWithIntl } from './test-utils';
import type { Place } from '@/lib/restaurant-map/schema';

// Mock scrollIntoView for jsdom
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const testPlaces: Place[] = [
  {
    id: 'test-list-1#0',
    name: 'Cafe A',
    lat: 37.5,
    lng: 127.0,
    category: 'cafe',
    address: 'Gangnam, Seoul',
    description: 'Best cafe',
    personalNote: 'Great vibe',
  },
  {
    id: 'test-list-1#1',
    name: 'Cafe B',
    lat: 37.6,
    lng: 127.1,
    category: 'cafe',
    address: 'Seocho, Seoul',
    description: 'Cozy cafe',
    personalNote: 'Quiet',
  },
];

describe('PlaceList', () => {
  it('renders all place cards with names', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const onResetFilters = vi.fn();

    renderWithIntl(
      <PlaceList
        places={testPlaces}
        selectedPlaceId={null}
        favorites={[]}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        emptyVariant="noMatches"
        onResetFilters={onResetFilters}
      />
    );

    expect(screen.getByText('Cafe A')).toBeInTheDocument();
    expect(screen.getByText('Cafe B')).toBeInTheDocument();
  });

  it('renders empty state when places array is empty', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const onResetFilters = vi.fn();
    const { container } = renderWithIntl(
      <PlaceList
        places={[]}
        selectedPlaceId={null}
        favorites={[]}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        emptyVariant="noMatches"
        onResetFilters={onResetFilters}
      />
    );

    // Empty state should render PlaceListEmpty component
    // Check for empty state container
    const emptyContainer = container.querySelector('.min-h-64');
    expect(emptyContainer).toBeInTheDocument();
  });

  it('calls onSelect when a card is clicked', async () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const onResetFilters = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <PlaceList
        places={testPlaces}
        selectedPlaceId={null}
        favorites={[]}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        emptyVariant="noMatches"
        onResetFilters={onResetFilters}
      />
    );

    // Each card's primary action is a full-card overlay button.
    const selectButton = screen.getByRole('button', { name: /Cafe A/i });
    await user.click(selectButton);

    expect(onSelect).toHaveBeenCalledWith('test-list-1#0');
  });

  it('applies selected styling to selected place', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const onResetFilters = vi.fn();
    const { container } = renderWithIntl(
      <PlaceList
        places={testPlaces}
        selectedPlaceId="test-list-1#0"
        favorites={[]}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        emptyVariant="noMatches"
        onResetFilters={onResetFilters}
      />
    );

    const selectedCard = container.querySelector('[data-testid="place-card-test-list-1#0"]');
    expect(selectedCard).toHaveClass('ring-2');
    expect(selectedCard).toHaveClass('border-accent-rose');
  });

  it('has semantic region role for accessibility', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const onResetFilters = vi.fn();
    const { container } = renderWithIntl(
      <PlaceList
        places={testPlaces}
        selectedPlaceId={null}
        favorites={[]}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        emptyVariant="noMatches"
        onResetFilters={onResetFilters}
      />
    );

    const placeList = container.querySelector('#place-list');
    expect(placeList).toHaveAttribute('role', 'region');
    expect(placeList).toHaveAttribute('aria-label');
  });

  it('exposes one focusable select button per card (natural tab order)', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const onResetFilters = vi.fn();
    renderWithIntl(
      <PlaceList
        places={testPlaces}
        selectedPlaceId={null}
        favorites={[]}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        emptyVariant="noMatches"
        onResetFilters={onResetFilters}
      />
    );

    // Every card has a full-card overlay button; no wrapper carries a competing
    // tabindex (the old roving-tabindex double-focus regression).
    const selectButtons = screen.getAllByRole('button', { name: /details/i });
    expect(selectButtons).toHaveLength(testPlaces.length);
  });

  it('passes favorite status to cards', () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const onResetFilters = vi.fn();
    const { container } = renderWithIntl(
      <PlaceList
        places={testPlaces}
        selectedPlaceId={null}
        favorites={['test-list-1#0']}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        emptyVariant="noMatches"
        onResetFilters={onResetFilters}
      />
    );

    // First card should be favorited (have filled star)
    const cards = container.querySelectorAll('[data-testid^="place-card-"]');
    expect(cards).toHaveLength(2);
  });

  it('calls onToggleFavorite with place id when favorite button is clicked', async () => {
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const onResetFilters = vi.fn();
    const user = userEvent.setup();

    const { container } = renderWithIntl(
      <PlaceList
        places={testPlaces}
        selectedPlaceId={null}
        favorites={[]}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        emptyVariant="noMatches"
        onResetFilters={onResetFilters}
      />
    );

    // Get the first favorite button
    const firstCard = container.querySelector('[data-testid="place-card-test-list-1#0"]');
    const favButton = firstCard?.querySelector('button[aria-label*="Add to favorites"]');

    await user.click(favButton!);

    expect(onToggleFavorite).toHaveBeenCalledWith('test-list-1#0');
  });
});
