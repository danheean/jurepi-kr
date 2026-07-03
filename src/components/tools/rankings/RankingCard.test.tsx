import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { RankingCard } from './RankingCard';
import type { MergedRanking } from '@/lib/rankings/schema';

const mockRanking: MergedRanking = {
  slug: 'test-ranking',
  field: 'ai',
  asOfDate: '2026-06',
  sourceUrl: 'https://example.com',
  ko: {
    title: '테스트 랭킹',
    sourceNote: '테스트 출처',
    items: [
      { rank: 1, name: '항목1', description: '설명1' },
      { rank: 2, name: '항목2', description: '설명2' },
    ],
  },
  en: {
    title: 'Test Ranking',
    sourceNote: 'Test source',
    items: [
      { rank: 1, name: 'Item 1', description: 'Description 1' },
      { rank: 2, name: 'Item 2', description: 'Description 2' },
    ],
  },
};

const messages: AbstractIntlMessages = {
  tools: {
    rankings: {
      fields: {
        ai: 'AI·LLM',
      },
      list: {
        itemCount: '{count}개 항목',
        toggleFavorite: '즐겨찾기 토글',
      },
    },
  },
};

function renderWithIntl(component: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messages as any}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('RankingCard', () => {
  it('renders as a link with correct href', () => {
    renderWithIntl(
      <RankingCard
        ranking={mockRanking}
        isFavorited={false}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/ko/tools/rankings/test-ranking');
  });

  it('renders visible content (not hidden)', () => {
    renderWithIntl(
      <RankingCard
        ranking={mockRanking}
        isFavorited={false}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('hidden');
    expect(screen.getByText('테스트 랭킹')).toBeVisible();
  });

  it('displays ranking title, field, item count, and date', () => {
    renderWithIntl(
      <RankingCard
        ranking={mockRanking}
        isFavorited={false}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    expect(screen.getByText('테스트 랭킹')).toBeInTheDocument();
    expect(screen.getByText('AI·LLM')).toBeInTheDocument();
    expect(screen.getByText('2개 항목')).toBeInTheDocument();
    expect(screen.getByText('2026-06')).toBeInTheDocument();
  });

  it('calls onSelect on plain left-click', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <RankingCard
        ranking={mockRanking}
        isFavorited={false}
        isSelected={false}
        onSelect={onSelect}
        onToggleFavorite={vi.fn()}
      />
    );

    const link = screen.getByRole('link') as HTMLAnchorElement;

    // Simulate plain click by directly calling onClick handler with synthetic event
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      buttons: 1,
    }) as unknown as React.MouseEvent;

    link.click();

    // Plain clicks should preventDefault and call onSelect
    expect(onSelect).toHaveBeenCalled();
  });

  it('favorite button is sibling of link, not nested', () => {
    const { container } = renderWithIntl(
      <RankingCard
        ranking={mockRanking}
        isFavorited={false}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    const wrapper = container.querySelector('[class*="relative"]');
    const link = wrapper?.querySelector('a');
    const button = wrapper?.querySelector('button');

    expect(link?.parentElement).toBe(wrapper);
    expect(button?.parentElement).toBe(wrapper);
  });

  it('calls onToggleFavorite on star button click and stops propagation', async () => {
    const onToggleFavorite = vi.fn();
    const onSelect = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <RankingCard
        ranking={mockRanking}
        isFavorited={false}
        isSelected={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const starButton = screen.getByRole('button', { name: '즐겨찾기 토글' });
    await user.click(starButton);

    expect(onToggleFavorite).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows rose highlight when isSelected is true', () => {
    const { container } = renderWithIntl(
      <RankingCard
        ranking={mockRanking}
        isFavorited={false}
        isSelected={true}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    const link = container.querySelector('a');
    expect(link).toHaveClass('border-accent-rose', 'bg-accent-rose-soft');
  });

  it('shows filled star when isFavorited is true', () => {
    const { container } = renderWithIntl(
      <RankingCard
        ranking={mockRanking}
        isFavorited={true}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    const starIcon = container.querySelector('[class*="fill-accent-sun"]');
    expect(starIcon).toBeInTheDocument();
  });

  it('has data-testid on link and button', () => {
    renderWithIntl(
      <RankingCard
        ranking={mockRanking}
        isFavorited={false}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    expect(screen.getByTestId('ranking-card-test-ranking')).toBeInTheDocument();
    expect(screen.getByTestId('ranking-star-test-ranking')).toBeInTheDocument();
  });
});
