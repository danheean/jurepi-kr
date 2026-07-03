import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { TopicCard } from './TopicCard';
import type { MergedTopic } from '@/lib/bookmarks/schema';

const mockTopic: MergedTopic = {
  slug: 'test-topic',
  ko: {
    title: '테스트 토픽',
    description: '테스트 설명',
    sections: [
      {
        heading: '섹션1',
        links: [
          { label: '링크1', url: 'https://example.com/1', description: '설명1' },
          { label: '링크2', url: 'https://example.com/2' },
        ],
      },
      {
        heading: '섹션2',
        links: [
          { label: '링크3', url: 'https://example.com/3', description: '설명3' },
        ],
      },
    ],
  },
  en: {
    title: 'Test Topic',
    description: 'Test description',
    sections: [
      {
        heading: 'Section 1',
        links: [
          { label: 'Link 1', url: 'https://example.com/1', description: 'Description 1' },
          { label: 'Link 2', url: 'https://example.com/2' },
        ],
      },
      {
        heading: 'Section 2',
        links: [
          { label: 'Link 3', url: 'https://example.com/3', description: 'Description 3' },
        ],
      },
    ],
  },
};

const messages: AbstractIntlMessages = {
  tools: {
    bookmarks: {
      list: {
        itemCount: '{sections}개 섹션 · {links}개 링크',
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

describe('TopicCard', () => {
  it('renders as a link with correct href', () => {
    renderWithIntl(
      <TopicCard
        topic={mockTopic}
        isFavorited={false}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        locale="ko"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/ko/tools/bookmarks/test-topic');
  });

  it('renders visible content (not hidden)', () => {
    renderWithIntl(
      <TopicCard
        topic={mockTopic}
        isFavorited={false}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        locale="ko"
      />
    );

    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('hidden');
    expect(screen.getByText('테스트 토픽')).toBeVisible();
  });

  it('displays topic title, description, and link count', () => {
    renderWithIntl(
      <TopicCard
        topic={mockTopic}
        isFavorited={false}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        locale="ko"
      />
    );

    expect(screen.getByText('테스트 토픽')).toBeInTheDocument();
    expect(screen.getByText('테스트 설명')).toBeInTheDocument();
    // 2 sections, 3 links
    expect(screen.getByText('2개 섹션 · 3개 링크')).toBeInTheDocument();
  });

  it('calls onSelect on plain left-click', async () => {
    const onSelect = vi.fn();

    renderWithIntl(
      <TopicCard
        topic={mockTopic}
        isFavorited={false}
        isSelected={false}
        onSelect={onSelect}
        onToggleFavorite={vi.fn()}
        locale="ko"
      />
    );

    const link = screen.getByRole('link') as HTMLAnchorElement;
    link.click();

    // Plain clicks should preventDefault and call onSelect
    expect(onSelect).toHaveBeenCalled();
  });

  it('favorite button is sibling of link, not nested', () => {
    const { container } = renderWithIntl(
      <TopicCard
        topic={mockTopic}
        isFavorited={false}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        locale="ko"
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
      <TopicCard
        topic={mockTopic}
        isFavorited={false}
        isSelected={false}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        locale="ko"
      />
    );

    const starButton = screen.getByRole('button', { name: '즐겨찾기 토글' });
    await user.click(starButton);

    expect(onToggleFavorite).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows sky highlight when isSelected is true', () => {
    const { container } = renderWithIntl(
      <TopicCard
        topic={mockTopic}
        isFavorited={false}
        isSelected={true}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        locale="ko"
      />
    );

    const link = container.querySelector('a');
    expect(link).toHaveClass('border-accent-sky-ink', 'bg-accent-sky-soft');
  });

  it('shows filled star when isFavorited is true', () => {
    const { container } = renderWithIntl(
      <TopicCard
        topic={mockTopic}
        isFavorited={true}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        locale="ko"
      />
    );

    const starIcon = container.querySelector('[class*="fill-accent-sky-ink"]');
    expect(starIcon).toBeInTheDocument();
  });

  it('has data-testid on link and button', () => {
    renderWithIntl(
      <TopicCard
        topic={mockTopic}
        isFavorited={false}
        isSelected={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        locale="ko"
      />
    );

    expect(screen.getByTestId('topic-card-test-topic')).toBeInTheDocument();
    expect(screen.getByTestId('topic-star-test-topic')).toBeInTheDocument();
  });
});
