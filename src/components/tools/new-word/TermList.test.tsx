import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { TermList } from './TermList';
import type { MergedTerm } from '@/lib/new-word/schema';

const mockTerms: MergedTerm[] = [
  {
    slug: 'god-life',
    topic: 'mz',
    tags: ['lifestyle'],
    related: [],
    ko: { term: '신의 삶', definition: '이상적인 삶', examples: ['예시1'], body: '' },
    en: { term: 'god life', definition: 'An ideal life', examples: ['Example 1'], body: '' },
  },
  {
    slug: 'vibe-coding',
    topic: 'tech',
    tags: ['programming'],
    related: [],
    ko: { term: '기분 코딩', definition: '직관적 코딩', examples: ['예시2'], body: '' },
    en: { term: 'vibe coding', definition: 'Programming by feel', examples: ['Example 2'], body: '' },
  },
];

describe('TermList', () => {
  it('renders term cards for provided terms', () => {
    render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    expect(screen.getByText('god life')).toBeInTheDocument();
    expect(screen.getByText('vibe coding')).toBeInTheDocument();
  });

  it('shows empty state with message when no terms', () => {
    const onClearQuery = vi.fn();
    render(
      <TermList
        terms={[]}
        selectedSlug={null}
        favorites={[]}
        query="nonexistent"
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={onClearQuery}
        currentLocale="en"
      />
    );

    expect(screen.getByText(/No terms match/)).toBeInTheDocument();
  });

  it('shows clear button in empty state when query is present', async () => {
    const onClearQuery = vi.fn();
    render(
      <TermList
        terms={[]}
        selectedSlug={null}
        favorites={[]}
        query="test"
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={onClearQuery}
        currentLocale="en"
      />
    );

    const clearBtn = screen.getByText('Clear');
    await userEvent.click(clearBtn);

    expect(onClearQuery).toHaveBeenCalled();
  });

  it('shows favorites empty message when topic is favorites and no terms', () => {
    render(
      <TermList
        terms={[]}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="favorites"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    expect(screen.getByText(/Star terms to save/)).toBeInTheDocument();
  });

  it('shows recent empty message when topic is recent and no terms', () => {
    render(
      <TermList
        terms={[]}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="recent"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    expect(screen.getByText(/recently viewed/)).toBeInTheDocument();
  });

  it('calls onSelect when a card is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={onSelect}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const card = screen.getByTestId('term-card-god-life');
    await userEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith('god-life');
  });

  it('navigates with ArrowDown key to next card', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={onSelect}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const listContainer = container.querySelector('[role="list"]') as HTMLElement;
    const cards = container.querySelectorAll('[data-testid^="term-card-"]');

    (cards[0] as HTMLElement).focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(document.activeElement).toBe(cards[1]);
  });

  it('navigates with Home key to first card', async () => {
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const cards = container.querySelectorAll('[data-testid^="term-card-"]');
    (cards[1] as HTMLElement).focus();
    await userEvent.keyboard('{Home}');

    expect(document.activeElement).toBe(cards[0]);
  });

  it('navigates with End key to last card', async () => {
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const cards = container.querySelectorAll('[data-testid^="term-card-"]');
    (cards[0] as HTMLElement).focus();
    await userEvent.keyboard('{End}');

    expect(document.activeElement).toBe(cards[cards.length - 1]);
  });

  it('toggles favorite with "f" key', async () => {
    const onToggleFav = vi.fn();
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={onToggleFav}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const cards = container.querySelectorAll('[data-testid^="term-card-"]');
    (cards[0] as HTMLElement).focus();
    await userEvent.keyboard('f');

    expect(onToggleFav).toHaveBeenCalledWith('god-life');
  });

  it('marks selected term with selected state', () => {
    render(
      <TermList
        terms={mockTerms}
        selectedSlug="god-life"
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const selectedCard = screen.getByTestId('term-card-god-life');
    expect(selectedCard).toHaveClass('border-accent-mint', 'ring-2');
  });

  it('marks favorited terms with filled star', () => {
    render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={['god-life']}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const starBtn = screen.getByTestId('term-star-god-life');
    expect(starBtn.querySelector('svg')).toHaveClass('fill-brand');
  });

  it('navigates up with ArrowUp key', async () => {
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const cards = container.querySelectorAll('[data-testid^="term-card-"]');
    (cards[1] as HTMLElement).focus();
    await userEvent.keyboard('{ArrowUp}');

    expect(document.activeElement).toBe(cards[0]);
  });

  it('wraps to last item when pressing ArrowUp on first item', async () => {
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const cards = container.querySelectorAll('[data-testid^="term-card-"]');
    (cards[0] as HTMLElement).focus();
    await userEvent.keyboard('{ArrowUp}');

    expect(document.activeElement).toBe(cards[cards.length - 1]);
  });

  it('wraps to first item when pressing ArrowDown on last item', async () => {
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const cards = container.querySelectorAll('[data-testid^="term-card-"]');
    (cards[cards.length - 1] as HTMLElement).focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(document.activeElement).toBe(cards[0]);
  });

  it('calls onSelect when Enter is pressed on focused card', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={onSelect}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const cards = container.querySelectorAll('[data-testid^="term-card-"]');
    (cards[0] as HTMLElement).focus();
    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalled();
  });

  it('calls onSelect when Space is pressed on focused card', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={onSelect}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const cards = container.querySelectorAll('[data-testid^="term-card-"]');
    (cards[0] as HTMLElement).focus();
    await userEvent.keyboard(' ');

    expect(onSelect).toHaveBeenCalled();
  });

  it('navigates left between cards with ArrowLeft', async () => {
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const cards = container.querySelectorAll('[data-testid^="term-card-"]');
    // Position in the middle
    (cards[1] as HTMLElement).focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(document.activeElement).toBe(cards[0]);
  });

  it('navigates right between cards with ArrowRight', async () => {
    const { container } = render(
      <TermList
        terms={mockTerms}
        selectedSlug={null}
        favorites={[]}
        query=""
        activeTopic="all"
        onSelect={vi.fn()}
        onToggleFav={vi.fn()}
        onClearQuery={vi.fn()}
        currentLocale="en"
      />
    );

    const cards = container.querySelectorAll('[data-testid^="term-card-"]');
    (cards[0] as HTMLElement).focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(cards[1]);
  });
});
