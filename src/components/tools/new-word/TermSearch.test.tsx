import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/__test__/test-utils';
import { TermSearch } from './TermSearch';

describe('TermSearch', () => {
  it('renders search input with placeholder', () => {
    render(
      <TermSearch
        query=""
        setQuery={vi.fn()}
        resultCount={0}
      />
    );

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('placeholder', expect.stringContaining('Search by term'));
  });

  it('updates query when user types', async () => {
    const setQuery = vi.fn();
    render(
      <TermSearch
        query=""
        setQuery={setQuery}
        resultCount={0}
      />
    );

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.keyboard('god');

    // setQuery is called for each character typed
    expect(setQuery).toHaveBeenCalledWith('d');
    expect(setQuery).toHaveBeenCalled();
  });

  it('displays result count when query is present', () => {
    render(
      <TermSearch
        query="god"
        setQuery={vi.fn()}
        resultCount={5}
      />
    );

    expect(screen.getByText('5 results')).toBeInTheDocument();
  });

  it('hides result count when query is empty', () => {
    render(
      <TermSearch
        query=""
        setQuery={vi.fn()}
        resultCount={0}
      />
    );

    expect(screen.queryByText(/results/)).not.toBeInTheDocument();
  });

  it('shows clear button when query is not empty', () => {
    render(
      <TermSearch
        query="test"
        setQuery={vi.fn()}
        resultCount={3}
      />
    );

    expect(screen.getByTestId('term-search-clear')).toBeInTheDocument();
  });

  it('hides clear button when query is empty', () => {
    render(
      <TermSearch
        query=""
        setQuery={vi.fn()}
        resultCount={0}
      />
    );

    expect(screen.queryByTestId('term-search-clear')).not.toBeInTheDocument();
  });

  it('clears query when clear button is clicked', async () => {
    const setQuery = vi.fn();
    render(
      <TermSearch
        query="test"
        setQuery={setQuery}
        resultCount={1}
      />
    );

    const clearBtn = screen.getByTestId('term-search-clear');
    await userEvent.click(clearBtn);

    expect(setQuery).toHaveBeenCalledWith('');
  });

  it('focuses input with "/" key when not in input', async () => {
    const { container } = render(
      <TermSearch
        query=""
        setQuery={vi.fn()}
        resultCount={0}
      />
    );

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    document.body.focus();

    await userEvent.keyboard('/');

    expect(document.activeElement).toBe(input);
  });

  it('clears query when Escape key is pressed with non-empty query', async () => {
    const setQuery = vi.fn();
    render(
      <TermSearch
        query="god"
        setQuery={setQuery}
        resultCount={1}
      />
    );

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    input.focus();
    await userEvent.keyboard('{Escape}');

    expect(setQuery).toHaveBeenCalledWith('');
  });

  it('does not clear query when Escape key is pressed with empty query', async () => {
    const setQuery = vi.fn();
    render(
      <TermSearch
        query=""
        setQuery={setQuery}
        resultCount={0}
      />
    );

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    input.focus();
    await userEvent.keyboard('{Escape}');

    expect(setQuery).not.toHaveBeenCalled();
  });

  it('has aria-controls pointing to term-list', () => {
    render(
      <TermSearch
        query=""
        setQuery={vi.fn()}
        resultCount={0}
      />
    );

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-controls', 'term-list');
  });

  it('result count has aria-live for screen readers', () => {
    const { container } = render(
      <TermSearch
        query="test"
        setQuery={vi.fn()}
        resultCount={5}
      />
    );

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveTextContent('5 results');
  });
});
