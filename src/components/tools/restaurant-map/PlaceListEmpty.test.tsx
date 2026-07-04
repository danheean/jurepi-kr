import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaceListEmpty } from './PlaceListEmpty';
import { renderWithIntl } from './test-utils';

describe('PlaceListEmpty', () => {
  it('noMatches variant explains the filter situation and offers a reset', async () => {
    // Regression: filter/search with zero results used to show the favorites
    // onboarding message ("별을 눌러 즐겨찾기를 저장하세요") + a geolocation
    // button — users read it as an error.
    const onResetFilters = vi.fn();
    renderWithIntl(<PlaceListEmpty variant="noMatches" onResetFilters={onResetFilters} />, {
      locale: 'ko',
    });

    expect(
      screen.getByText('조건에 맞는 맛집이 없어요. 검색어나 필터를 초기화해 보세요.')
    ).toBeInTheDocument();
    expect(screen.queryByText('별을 눌러 즐겨찾기를 저장하세요.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '필터 초기화' }));
    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  it('noFavorites variant shows the favorites onboarding message without reset button', () => {
    renderWithIntl(<PlaceListEmpty variant="noFavorites" onResetFilters={vi.fn()} />, {
      locale: 'ko',
    });

    expect(screen.getByText('별을 눌러 즐겨찾기를 저장하세요.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('noRecents variant shows the recents message without reset button', () => {
    renderWithIntl(<PlaceListEmpty variant="noRecents" onResetFilters={vi.fn()} />, {
      locale: 'ko',
    });

    expect(
      screen.getByText('최근 본 맛집이 없어요. 카드를 눌러 상세를 보면 여기에 쌓입니다.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders English copy under the en locale', () => {
    renderWithIntl(<PlaceListEmpty variant="noMatches" onResetFilters={vi.fn()} />, {
      locale: 'en',
    });

    expect(screen.getByRole('button', { name: 'Reset filters' })).toBeInTheDocument();
    expect(screen.getByText(/No places match your filters/)).toBeInTheDocument();
  });
});
