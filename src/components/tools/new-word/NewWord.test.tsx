import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/__test__/test-utils';
import { NewWord } from './NewWord';

// Mock the static terms data
vi.mock('./data/terms.generated.json', () => ({
  default: [
    {
      slug: 'god-life',
      topic: 'mz',
      tags: ['lifestyle'],
      related: [],
      ko: {
        term: '신의 삶',
        definition: '이상적인 삶',
        examples: ['예시1'],
        body: 'markdown body **bold**',
      },
      en: {
        term: 'god life',
        definition: 'An ideal life',
        examples: ['Example 1'],
        body: 'markdown body `code`',
      },
    },
    {
      slug: 'vibe-coding',
      topic: 'tech',
      tags: ['programming'],
      related: [],
      ko: {
        term: '기분 코딩',
        definition: '직관적 코딩',
        examples: ['예시2'],
        body: '',
      },
      en: {
        term: 'vibe coding',
        definition: 'Programming by feel',
        examples: ['Example 2'],
        body: '',
      },
    },
  ],
}));

describe('NewWord component', () => {
  it('renders without crashing', async () => {
    const { container } = render(<NewWord />);
    expect(container).toBeInTheDocument();
  });

  it('renders intro section for SEO', async () => {
    render(<NewWord />);
    await waitFor(() => {
      expect(screen.getByText('New Word Glossary')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    render(<NewWord />);
    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('renders topic tabs', async () => {
    render(<NewWord />);
    await waitFor(() => {
      expect(screen.getByTestId('topic-tab-all')).toBeInTheDocument();
      expect(screen.getByTestId('topic-tab-mz')).toBeInTheDocument();
      expect(screen.getByTestId('topic-tab-tech')).toBeInTheDocument();
    });
  });

  it('renders term list', async () => {
    render(<NewWord />);
    await waitFor(() => {
      expect(screen.getByText('god life')).toBeInTheDocument();
      expect(screen.getByText('vibe coding')).toBeInTheDocument();
    });
  });

  it('renders how-to section', async () => {
    render(<NewWord />);
    await waitFor(() => {
      expect(screen.getByText('What is New Word?')).toBeInTheDocument();
    });
  });

  it('renders FAQ section', async () => {
    render(<NewWord />);
    await waitFor(() => {
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    });
  });

  it('renders structured data', async () => {
    const { container } = render(<NewWord />);
    await waitFor(() => {
      const jsonLd = container.querySelector('script[type="application/ld+json"]');
      expect(jsonLd).toBeInTheDocument();
    });
  });

  it('renders detail panel with empty hint initially', async () => {
    render(<NewWord />);
    await waitFor(() => {
      expect(screen.getByText(/Select a term/)).toBeInTheDocument();
    });
  });

  it('displays toast on successful copy', async () => {
    const { container } = render(<NewWord />);
    await waitFor(() => {
      expect(screen.getByText('god life')).toBeInTheDocument();
    });

    // Click to select a term
    const card = screen.getByTestId('term-card-god-life');
    await userEvent.click(card);

    // Click copy button and verify toast appears
    await waitFor(() => {
      const copyBtn = screen.getByTestId('copy-term');
      expect(copyBtn).toBeInTheDocument();
    });
  });

  it('toggleFavorite shows toast message', async () => {
    render(<NewWord />);
    await waitFor(() => {
      expect(screen.getByText('god life')).toBeInTheDocument();
    });

    const starBtn = screen.getByTestId('term-star-god-life');
    await userEvent.click(starBtn);

    // Toast should appear
    await waitFor(() => {
      expect(screen.getByText(/Added to favorites|Removed from favorites/)).toBeInTheDocument();
    });
  });
});
