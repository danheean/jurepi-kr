import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegionTabs } from './RegionTabs';
import { IntlProvider } from './test-utils';

describe('RegionTabs', () => {
  it('renders all region tabs', () => {
    const onRegionChange = vi.fn();
    render(
      <IntlProvider>
        <RegionTabs activeRegion="all" onRegionChange={onRegionChange} hasFavorites={false} hasRecents={false} />
      </IntlProvider>
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('calls onRegionChange when a tab is clicked', async () => {
    const onRegionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <IntlProvider>
        <RegionTabs activeRegion="all" onRegionChange={onRegionChange} hasFavorites={false} hasRecents={false} />
      </IntlProvider>
    );
    const seoulTab = screen.getByRole('tab', { name: /서울|Seoul/i });
    await user.click(seoulTab);
    expect(onRegionChange).toHaveBeenCalledWith('seoul');
  });

  it('shows aria-selected on active tab', () => {
    const onRegionChange = vi.fn();
    const { rerender } = render(
      <IntlProvider>
        <RegionTabs activeRegion="all" onRegionChange={onRegionChange} hasFavorites={false} hasRecents={false} />
      </IntlProvider>
    );
    const allTab = screen.getByRole('tab', { name: /전체|All/ });
    expect(allTab).toHaveAttribute('aria-selected', 'true');

    rerender(
      <IntlProvider>
        <RegionTabs activeRegion="seoul" onRegionChange={onRegionChange} hasFavorites={false} hasRecents={false} />
      </IntlProvider>
    );
    expect(allTab).toHaveAttribute('aria-selected', 'false');
  });

  it('hides favorites tab when no favorites', () => {
    const onRegionChange = vi.fn();
    render(
      <IntlProvider>
        <RegionTabs activeRegion="all" onRegionChange={onRegionChange} hasFavorites={false} hasRecents={false} />
      </IntlProvider>
    );
    // Favorites tab should not be visible
    const favTab = screen.queryByRole('tab', { name: /즐겨찾기|Favorites/i });
    expect(favTab).not.toBeInTheDocument();
  });

  it('shows favorites tab when hasFavorites=true', () => {
    const onRegionChange = vi.fn();
    render(
      <IntlProvider>
        <RegionTabs activeRegion="all" onRegionChange={onRegionChange} hasFavorites={true} hasRecents={false} />
      </IntlProvider>
    );
    const favTab = screen.getByRole('tab', { name: /즐겨찾기|Favorites/i });
    expect(favTab).toBeInTheDocument();
  });
});
