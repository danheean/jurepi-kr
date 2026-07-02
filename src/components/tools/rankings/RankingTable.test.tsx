import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { RankingTable } from './RankingTable';
import type { MergedRanking } from '@/lib/rankings/schema';

const messages: AbstractIntlMessages = {
  tools: {
    rankings: {
      detail: {
        table: {
          caption: '{title} — {count}개 항목 순위표',
          regionLabel: '{title} 순위표',
          rank: '순위',
          name: '이름',
          description: '설명',
          link: '링크',
          image: '이미지',
          rankAria: '{rank}위',
          linkAria: '{name} 링크',
        },
      },
    },
  },
};

const mockRanking: MergedRanking = {
  slug: 'test-ranking',
  field: 'ai',
  asOfDate: '2026-06',
  ko: {
    title: 'Test Ranking',
    sourceNote: 'Source',
    items: [
      {
        rank: 1,
        name: 'First Place',
        description: 'The best',
        link: 'https://example.com/1',
      },
      {
        rank: 2,
        name: 'Second Place',
        description: 'The second best',
      },
      {
        rank: 3,
        name: 'Third Place',
        description: 'The third best',
      },
      {
        rank: 4,
        name: 'Fourth Place',
        description: 'Still good',
      },
    ],
  },
  en: {
    title: 'Test Ranking',
    sourceNote: 'Source',
    items: [
      { rank: 1, name: 'First Place', description: 'The best', link: 'https://example.com/1' },
      { rank: 2, name: 'Second Place', description: 'The second best' },
      { rank: 3, name: 'Third Place', description: 'The third best' },
      { rank: 4, name: 'Fourth Place', description: 'Still good' },
    ],
  },
};

function renderWithIntl(component: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
}

describe('RankingTable', () => {
  it('renders semantic table structure', () => {
    const { container } = renderWithIntl(<RankingTable ranking={mockRanking} />);

    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('thead')).toBeInTheDocument();
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('has caption for accessibility', () => {
    const { container } = renderWithIntl(<RankingTable ranking={mockRanking} />);

    const caption = container.querySelector('caption');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveClass('sr-only');
  });

  it('has correct column headers with scope', () => {
    const { container } = renderWithIntl(<RankingTable ranking={mockRanking} />);

    const headers = container.querySelectorAll('th[scope="col"]');
    expect(headers.length).toBeGreaterThan(0);
  });

  it('renders medal emoji for top 3 ranks', () => {
    renderWithIntl(<RankingTable ranking={mockRanking} />);

    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('renders all items as table rows', () => {
    const { container } = renderWithIntl(<RankingTable ranking={mockRanking} />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(4);
  });

  it('renders item names and descriptions', () => {
    renderWithIntl(<RankingTable ranking={mockRanking} />);

    expect(screen.getByText('First Place')).toBeInTheDocument();
    expect(screen.getByText('The best')).toBeInTheDocument();
    expect(screen.getByText('Second Place')).toBeInTheDocument();
  });

  it('renders external links when present', () => {
    renderWithIntl(<RankingTable ranking={mockRanking} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/1');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
