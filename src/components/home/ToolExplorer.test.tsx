import { render, screen, waitFor, userEvent } from '@/__test__/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolExplorer } from './ToolExplorer';
import type { SearchableTool } from '@/lib/tool-search';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('ToolExplorer', () => {
  // ToolExplorer reflects filter state to the URL (history.replaceState) and
  // hydrates from it on mount. jsdom shares one window across tests in a file,
  // so reset the URL before each test to keep them isolated.
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  const mockTools: SearchableTool[] = [
    {
      id: 'ladder',
      slug: 'ladder',
      name: 'Ladder Game',
      description: 'Play the ladder game fairly',
      category: 'random',
      accent: 'coral',
      icon: 'ListTree',
      status: 'live',
      order: 1,
      keywords: ['ladder', 'fair'],
    },
    {
      id: 'wordcounter',
      slug: 'wordcounter',
      name: 'Word Counter',
      description: 'Count words and characters',
      category: 'text',
      accent: 'mint',
      icon: 'Type',
      status: 'coming_soon',
      order: 2,
      keywords: ['word', 'count'],
    },
  ];

  it('renders search bar', () => {
    render(<ToolExplorer initialTools={mockTools} />);
    const searchInput = screen.getByPlaceholderText('Search tools…');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders category filter', () => {
    render(<ToolExplorer initialTools={mockTools} />);
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('renders tool grid', () => {
    render(<ToolExplorer initialTools={mockTools} />);
    expect(screen.getByText('Ladder Game')).toBeInTheDocument();
    expect(screen.getByText('Word Counter')).toBeInTheDocument();
  });

  it('filters tools when search query is entered', async () => {
    const user = userEvent.setup();
    render(<ToolExplorer initialTools={mockTools} />);
    const searchInput = screen.getByPlaceholderText('Search tools…') as HTMLInputElement;

    await user.type(searchInput, 'ladder');

    await waitFor(() => {
      expect(screen.getByText('Ladder Game')).toBeInTheDocument();
      expect(screen.queryByText('Word Counter')).not.toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('filters tools by category', async () => {
    const user = userEvent.setup();
    render(<ToolExplorer initialTools={mockTools} />);
    const textCategory = screen.getByRole('button', { name: 'Text' });

    await user.click(textCategory);

    await waitFor(() => {
      expect(screen.getByText('Word Counter')).toBeInTheDocument();
      expect(screen.queryByText('Ladder Game')).not.toBeInTheDocument();
    });
  });

  it('shows result count when filtered', async () => {
    const user = userEvent.setup();
    render(<ToolExplorer initialTools={mockTools} />);
    const searchInput = screen.getByPlaceholderText('Search tools…') as HTMLInputElement;

    await user.type(searchInput, 'counter');

    await waitFor(() => {
      expect(screen.getByText(/1 tool/)).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('resets search and filters when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<ToolExplorer initialTools={mockTools} />);
    const searchInput = screen.getByPlaceholderText('Search tools…') as HTMLInputElement;

    // Search for a tool
    await user.type(searchInput, 'ladder');

    await waitFor(() => {
      expect(screen.queryByText('Word Counter')).not.toBeInTheDocument();
    }, { timeout: 500 });

    // Click reset button in empty state (but we have results, so this won't show)
    // Instead, clear the search
    await user.clear(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Ladder Game')).toBeInTheDocument();
      expect(screen.getByText('Word Counter')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('shows empty state when no results match filter', async () => {
    const user = userEvent.setup();
    render(<ToolExplorer initialTools={mockTools} />);
    const searchInput = screen.getByPlaceholderText('Search tools…') as HTMLInputElement;

    await user.type(searchInput, 'nonexistent_tool_xyz');

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('empty state reset button works', async () => {
    const user = userEvent.setup();
    render(<ToolExplorer initialTools={mockTools} />);
    const searchInput = screen.getByPlaceholderText('Search tools…') as HTMLInputElement;

    // Search for something that returns no results
    await user.type(searchInput, 'nonexistent_tool_xyz');

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    }, { timeout: 500 });

    // Click reset button
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    await user.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText('Ladder Game')).toBeInTheDocument();
      expect(screen.getByText('Word Counter')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('combines query and category filters', async () => {
    const user = userEvent.setup();
    render(<ToolExplorer initialTools={mockTools} />);
    const searchInput = screen.getByPlaceholderText('Search tools…') as HTMLInputElement;

    // Search and filter
    await user.type(searchInput, 'word');
    const textCategory = screen.getByRole('button', { name: 'Text' });
    await user.click(textCategory);

    await waitFor(() => {
      expect(screen.getByText('Word Counter')).toBeInTheDocument();
      expect(screen.queryByText('Ladder Game')).not.toBeInTheDocument();
    }, { timeout: 500 });
  });
});
