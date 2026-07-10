import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegionTabs } from './RegionTabs';
import { IntlProvider } from './test-utils';

describe('RegionTabs', () => {
  // Region filters are a toggle-button group (role=group + aria-pressed), not
  // an ARIA tab widget: there is no tabpanel or arrow-key roving, so role=tab
  // would mislead screen readers. Kept consistent with CuratorFilter.
  it('renders the region filter group', () => {
    const onRegionChange = vi.fn();
    render(
      <IntlProvider>
        <RegionTabs activeRegion="all" onRegionChange={onRegionChange} hasFavorites={false} hasRecents={false} />
      </IntlProvider>
    );
    expect(screen.getByRole('group', { name: /지역|region/i })).toBeInTheDocument();
  });

  it('calls onRegionChange when a region is clicked', async () => {
    const onRegionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <IntlProvider>
        <RegionTabs activeRegion="all" onRegionChange={onRegionChange} hasFavorites={false} hasRecents={false} />
      </IntlProvider>
    );
    const seoulTab = screen.getByRole('button', { name: /서울|Seoul/i });
    await user.click(seoulTab);
    expect(onRegionChange).toHaveBeenCalledWith('seoul');
  });

  it('shows aria-pressed on the active region', () => {
    const onRegionChange = vi.fn();
    const { rerender } = render(
      <IntlProvider>
        <RegionTabs activeRegion="all" onRegionChange={onRegionChange} hasFavorites={false} hasRecents={false} />
      </IntlProvider>
    );
    const allTab = screen.getByRole('button', { name: /전체|All/ });
    expect(allTab).toHaveAttribute('aria-pressed', 'true');

    rerender(
      <IntlProvider>
        <RegionTabs activeRegion="seoul" onRegionChange={onRegionChange} hasFavorites={false} hasRecents={false} />
      </IntlProvider>
    );
    expect(allTab).toHaveAttribute('aria-pressed', 'false');
  });

  it('hides favorites region when no favorites', () => {
    const onRegionChange = vi.fn();
    render(
      <IntlProvider>
        <RegionTabs activeRegion="all" onRegionChange={onRegionChange} hasFavorites={false} hasRecents={false} />
      </IntlProvider>
    );
    // Favorites region button should not be visible
    const favTab = screen.queryByRole('button', { name: /즐겨찾기|Favorites/i });
    expect(favTab).not.toBeInTheDocument();
  });

  it('shows favorites region when hasFavorites=true', () => {
    const onRegionChange = vi.fn();
    render(
      <IntlProvider>
        <RegionTabs activeRegion="all" onRegionChange={onRegionChange} hasFavorites={true} hasRecents={false} />
      </IntlProvider>
    );
    const favTab = screen.getByRole('button', { name: /즐겨찾기|Favorites/i });
    expect(favTab).toBeInTheDocument();
  });
});
