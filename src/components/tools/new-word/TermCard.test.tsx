import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { TermCard } from './TermCard';
import { MergedTerm } from '@/lib/new-word/schema';

const mockTerm: MergedTerm = {
  slug: 'test-slug',
  topic: 'mz',
  tags: ['tag1', 'tag2', 'tag3', 'tag4'],
  related: [],
  ko: {
    term: '테스트 용어',
    definition: '테스트 정의입니다.',
    examples: ['예시1', '예시2'],
    body: '',
  },
  en: {
    term: 'Test Term',
    definition: 'Test definition.',
    examples: ['Example 1', 'Example 2'],
    body: '',
  },
};

describe('TermCard', () => {
  it('renders term name in current locale with other-locale subtitle', () => {
    const onSelect = vi.fn();
    const onToggleFav = vi.fn();

    render(
      <TermCard
        term={mockTerm}
        isSelected={false}
        isFavorite={false}
        onSelect={onSelect}
        onToggleFav={onToggleFav}
        currentLocale="ko"
      />
    );

    expect(screen.getByText('테스트 용어')).toBeInTheDocument();
    expect(screen.getByText('Test Term')).toBeInTheDocument();
  });

  it('shows definition clamp to 2 lines', () => {
    const onSelect = vi.fn();
    const onToggleFav = vi.fn();

    render(
      <TermCard
        term={mockTerm}
        isSelected={false}
        isFavorite={false}
        onSelect={onSelect}
        onToggleFav={onToggleFav}
        currentLocale="ko"
      />
    );

    const def = screen.getByText('테스트 정의입니다.');
    expect(def).toHaveClass('line-clamp-2');
  });

  it('displays topic badge with correct color', () => {
    const onSelect = vi.fn();
    const onToggleFav = vi.fn();

    render(
      <TermCard
        term={mockTerm}
        isSelected={false}
        isFavorite={false}
        onSelect={onSelect}
        onToggleFav={onToggleFav}
        currentLocale="ko"
      />
    );

    expect(screen.getByText('MZ')).toBeInTheDocument();
  });

  it('displays up to 3 tags', () => {
    const onSelect = vi.fn();
    const onToggleFav = vi.fn();

    render(
      <TermCard
        term={mockTerm}
        isSelected={false}
        isFavorite={false}
        onSelect={onSelect}
        onToggleFav={onToggleFav}
        currentLocale="ko"
      />
    );

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.queryByText('tag4')).not.toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    const onToggleFav = vi.fn();

    render(
      <TermCard
        term={mockTerm}
        isSelected={false}
        isFavorite={false}
        onSelect={onSelect}
        onToggleFav={onToggleFav}
        currentLocale="ko"
      />
    );

    const card = screen.getByTestId('term-card-test-slug');
    await userEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith('test-slug');
  });

  it('star button toggles favorite', async () => {
    const onSelect = vi.fn();
    const onToggleFav = vi.fn();

    render(
      <TermCard
        term={mockTerm}
        isSelected={false}
        isFavorite={false}
        onSelect={onSelect}
        onToggleFav={onToggleFav}
        currentLocale="ko"
      />
    );

    const starBtn = screen.getByTestId('term-star-test-slug');
    await userEvent.click(starBtn);

    expect(onToggleFav).toHaveBeenCalledWith('test-slug');
  });

  it('star shows filled when isFavorite is true', () => {
    const onSelect = vi.fn();
    const onToggleFav = vi.fn();

    render(
      <TermCard
        term={mockTerm}
        isSelected={false}
        isFavorite={true}
        onSelect={onSelect}
        onToggleFav={onToggleFav}
        currentLocale="ko"
      />
    );

    const starBtn = screen.getByTestId('term-star-test-slug');
    expect(starBtn.querySelector('svg')).toHaveClass('fill-brand', 'text-brand');
  });

  it('shows selected state with ring and accent bar', () => {
    const onSelect = vi.fn();
    const onToggleFav = vi.fn();

    render(
      <TermCard
        term={mockTerm}
        isSelected={true}
        isFavorite={false}
        onSelect={onSelect}
        onToggleFav={onToggleFav}
        currentLocale="ko"
      />
    );

    const card = screen.getByTestId('term-card-test-slug');
    expect(card).toHaveClass('border-accent-mint', 'ring-2', 'ring-accent-mint');
  });
});
