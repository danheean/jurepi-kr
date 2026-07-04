import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaceDetailCard } from './PlaceDetailCard';
import { renderWithIntl } from './test-utils';
import type { Place } from '@/lib/restaurant-map/schema';

const testPlace: Place = {
  id: 'place-1',
  name: 'Amazing Restaurant',
  lat: 37.5,
  lng: 126.97,
  category: 'korean',
  address: '123 Seoul St, Seoul',
  description: 'Best korean restaurant in town',
  personalNote: 'The staff is incredibly friendly',
  priceRange: '$$',
  curator: 'honey',
};

describe('PlaceDetailCard', () => {
  beforeEach(() => {
    // Mock clipboard API
    const clipboardMock = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboardMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when place is null', () => {
    const onClose = vi.fn();
    const { container } = renderWithIntl(
      <PlaceDetailCard place={null} onClose={onClose} />
    );

    // Should be empty
    expect(container.querySelector('[class*="fixed"]')).not.toBeInTheDocument();
  });

  it('renders place details when place is provided', () => {
    const onClose = vi.fn();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    expect(screen.getByText('Amazing Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Best korean restaurant in town')).toBeInTheDocument();
    expect(screen.getByText('123 Seoul St, Seoul')).toBeInTheDocument();
  });

  it('renders personalNote in a distinct callout block', () => {
    const onClose = vi.fn();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    const personalNoteText = screen.getByText('The staff is incredibly friendly');
    expect(personalNoteText).toBeInTheDocument();

    // Should be in a block with brand accent styling
    const parent = personalNoteText.closest('div');
    expect(parent).toHaveClass('border-l-4', 'border-brand', 'bg-brand/5');
  });

  it('renders category and priceRange badges', () => {
    const onClose = vi.fn();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    expect(screen.getByText('Korean')).toBeInTheDocument();
    expect(screen.getByText('$$')).toBeInTheDocument();
  });

  it('does not render priceRange badge when priceRange is undefined', () => {
    const placeNoPrice = { ...testPlace, priceRange: undefined };
    const onClose = vi.fn();
    renderWithIntl(
      <PlaceDetailCard place={placeNoPrice} onClose={onClose} />
    );

    expect(screen.queryByText('$$')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    // Simulate Escape key
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose on Escape when place is null', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<PlaceDetailCard place={null} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('has copy address button', async () => {
    const onClose = vi.fn();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    const copyButton = screen.getByLabelText('Copy address');
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).toHaveAttribute('title', 'Copy address');
  });

  it('uses a real authored link for the external map href', () => {
    const placeWithLink: Place = {
      ...testPlace,
      link: 'https://map.naver.com/p/entry/place/777',
    };
    const onClose = vi.fn();
    renderWithIntl(
      <PlaceDetailCard place={placeWithLink} onClose={onClose} />
    );

    const externalLink = screen.getByRole('link');
    expect(externalLink).toHaveAttribute('href', 'https://map.naver.com/p/entry/place/777');
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('always renders the maps link, falling back to a NAVER search URL', () => {
    // The "Open in Maps" link is always present (placeMapUrl), even with no
    // authored link — this is what the layout redesign guarantees.
    const onClose = vi.fn();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    const externalLink = screen.getByRole('link');
    expect(externalLink).toHaveAttribute('href', expect.stringContaining('map.naver.com/p/search'));
  });

  it('renders image when place.imageUrl is provided', () => {
    const placeWithImage: Place = {
      ...testPlace,
      imageUrl: 'https://example.com/image.jpg',
      imageWidth: 400,
      imageHeight: 300,
    };
    const onClose = vi.fn();
    renderWithIntl(
      <PlaceDetailCard place={placeWithImage} onClose={onClose} />
    );

    const img = screen.getByAltText('Amazing Restaurant');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(img).toHaveAttribute('width', '400');
    expect(img).toHaveAttribute('height', '300');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('does not render image when imageUrl is missing', () => {
    const onClose = vi.fn();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    const img = screen.queryByAltText('Amazing Restaurant');
    expect(img).not.toBeInTheDocument();
  });

  it('does not render image when imageWidth or imageHeight is missing', () => {
    const placePartialImage: Place = {
      ...testPlace,
      imageUrl: 'https://example.com/image.jpg',
      imageWidth: 400,
      // imageHeight missing
    };
    const onClose = vi.fn();
    renderWithIntl(
      <PlaceDetailCard place={placePartialImage} onClose={onClose} />
    );

    const img = screen.queryByAltText('Amazing Restaurant');
    expect(img).not.toBeInTheDocument();
  });

  it('personalNote label comes from i18n', () => {
    const onClose = vi.fn();
    renderWithIntl(
      <PlaceDetailCard place={testPlace} onClose={onClose} />,
      { locale: 'en' }
    );

    // The label should be rendered (will be "PERSONAL NOTE" or similar depending on i18n)
    const personalNoteText = screen.getByText('The staff is incredibly friendly');
    expect(personalNoteText).toBeInTheDocument();
  });

  it('opens in maps link text comes from i18n', () => {
    const placeWithLink: Place = {
      ...testPlace,
      link: 'https://maps.example.com',
    };
    const onClose = vi.fn();
    renderWithIntl(
      <PlaceDetailCard place={placeWithLink} onClose={onClose} />,
      { locale: 'en' }
    );

    // Link should be rendered with i18n text
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });

  it('renders address in a muted background block', () => {
    const onClose = vi.fn();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    const address = screen.getByText('123 Seoul St, Seoul');
    const addressBlock = address.closest('[class*="bg-surface-muted"]');
    expect(addressBlock).toBeInTheDocument();
  });

  it('renders name as h2 heading', () => {
    const onClose = vi.fn();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Amazing Restaurant');
  });

  it('renders as a static inline card (no fixed overlay covering the map)', () => {
    const onClose = vi.fn();
    const { container } = renderWithIntl(
      <PlaceDetailCard place={testPlace} onClose={onClose} />
    );

    // The detail now renders inline below the map, not as a fixed bottom sheet.
    expect(container.querySelector('[class*="fixed"]')).not.toBeInTheDocument();
    const card = container.firstElementChild;
    expect(card).toHaveClass('rounded-lg', 'border', 'border-hairline', 'bg-surface');
  });

  it('handles missing personalNote gracefully', () => {
    const placeNoNote = { ...testPlace };
    delete (placeNoNote as any).personalNote;
    const onClose = vi.fn();

    // Should render without error, though personalNote will be undefined
    const { container } = renderWithIntl(
      <PlaceDetailCard place={placeNoNote} onClose={onClose} />
    );

    expect(container).toBeDefined();
  });

  it('does not render a dimming overlay (inline card, not a bottom sheet)', () => {
    const onClose = vi.fn();
    const { container } = renderWithIntl(
      <PlaceDetailCard place={testPlace} onClose={onClose} />
    );

    expect(container.querySelector('[class*="bg-black/20"]')).not.toBeInTheDocument();
  });

  it('closes when the close (×) button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<PlaceDetailCard place={testPlace} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders curator avatar and name near personal note', () => {
    const onClose = vi.fn();
    renderWithIntl(
      <PlaceDetailCard place={testPlace} onClose={onClose} />,
      { locale: 'ko' }
    );

    const curatorImg = screen.getByAltText('');
    expect(curatorImg).toBeInTheDocument();
    expect(curatorImg).toHaveAttribute('width', '32');
    expect(curatorImg).toHaveAttribute('height', '32');

    const curatorName = screen.getByText(/복현동 꿀주먹/);
    expect(curatorName).toBeInTheDocument();
  });
});
