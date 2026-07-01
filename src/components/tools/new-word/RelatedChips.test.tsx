import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { RelatedChips } from './RelatedChips';
import type { MergedTerm } from '@/lib/new-word/schema';

const mockCatalog: MergedTerm[] = [
  {
    slug: 'god-life',
    topic: 'mz',
    tags: [],
    related: [],
    ko: { term: '신의 삶', definition: '정의', examples: [], body: '' },
    en: { term: 'god life', definition: 'definition', examples: [], body: '' },
  },
  {
    slug: 'vibe-coding',
    topic: 'tech',
    tags: [],
    related: [],
    ko: { term: '기분 코딩', definition: '정의', examples: [], body: '' },
    en: { term: 'vibe coding', definition: 'definition', examples: [], body: '' },
  },
  {
    slug: 'context-window',
    topic: 'tech',
    tags: [],
    related: [],
    ko: { term: '컨텍스트 윈도우', definition: '정의', examples: [], body: '' },
    en: { term: 'context window', definition: 'definition', examples: [], body: '' },
  },
];

describe('RelatedChips', () => {
  it('returns null when related array is empty', () => {
    const { container } = render(
      <RelatedChips
        related={[]}
        catalog={mockCatalog}
        onSelect={vi.fn()}
        currentLocale="en"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders related terms as clickable chips', () => {
    render(
      <RelatedChips
        related={['vibe-coding', 'context-window']}
        catalog={mockCatalog}
        onSelect={vi.fn()}
        currentLocale="en"
      />
    );

    expect(screen.getByText('vibe coding')).toBeInTheDocument();
    expect(screen.getByText('context window')).toBeInTheDocument();
  });

  it('displays heading in current locale', () => {
    render(
      <RelatedChips
        related={['vibe-coding']}
        catalog={mockCatalog}
        onSelect={vi.fn()}
        currentLocale="en"
      />
    );

    expect(screen.getByText('Related Terms')).toBeInTheDocument();
  });

  it('displays korean heading when currentLocale is ko', () => {
    render(
      <RelatedChips
        related={['vibe-coding']}
        catalog={mockCatalog}
        onSelect={vi.fn()}
        currentLocale="ko"
      />
    );

    expect(screen.getByText('관련 용어')).toBeInTheDocument();
  });

  it('uses current locale for term names', () => {
    render(
      <RelatedChips
        related={['vibe-coding']}
        catalog={mockCatalog}
        onSelect={vi.fn()}
        currentLocale="ko"
      />
    );

    expect(screen.getByText('기분 코딩')).toBeInTheDocument();
  });

  it('calls onSelect with slug when chip is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <RelatedChips
        related={['vibe-coding']}
        catalog={mockCatalog}
        onSelect={onSelect}
        currentLocale="en"
      />
    );

    const chip = screen.getByTestId('related-chip-vibe-coding');
    await userEvent.click(chip);

    expect(onSelect).toHaveBeenCalledWith('vibe-coding');
  });

  it('hides unknown slugs that do not exist in catalog', () => {
    render(
      <RelatedChips
        related={['vibe-coding', 'nonexistent-slug']}
        catalog={mockCatalog}
        onSelect={vi.fn()}
        currentLocale="en"
      />
    );

    expect(screen.getByText('vibe coding')).toBeInTheDocument();
    expect(screen.queryByText('nonexistent-slug')).not.toBeInTheDocument();
  });

  it('renders arrow icon', () => {
    const { container } = render(
      <RelatedChips
        related={['vibe-coding']}
        catalog={mockCatalog}
        onSelect={vi.fn()}
        currentLocale="en"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders multiple chips without duplicates', () => {
    render(
      <RelatedChips
        related={['vibe-coding', 'context-window', 'vibe-coding']}
        catalog={mockCatalog}
        onSelect={vi.fn()}
        currentLocale="en"
      />
    );

    const vibeChips = screen.getAllByText('vibe coding');
    expect(vibeChips).toHaveLength(2); // rendered twice due to duplicate in related
  });

  it('has data-testid for each chip', () => {
    render(
      <RelatedChips
        related={['vibe-coding', 'context-window']}
        catalog={mockCatalog}
        onSelect={vi.fn()}
        currentLocale="en"
      />
    );

    expect(screen.getByTestId('related-chip-vibe-coding')).toBeInTheDocument();
    expect(screen.getByTestId('related-chip-context-window')).toBeInTheDocument();
  });
});
