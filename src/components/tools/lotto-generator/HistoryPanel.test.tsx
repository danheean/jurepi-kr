import { render, screen, fireEvent } from '@testing-library/react';
import { AllTheProviders } from '@/__test__/test-utils';
import { HistoryPanel } from './HistoryPanel';
import type { HistoryEntry } from '@/lib/lotto-generator/schema';

function renderWithIntl(component: React.ReactElement) {
  return render(component, {
    wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }),
  });
}

describe('HistoryPanel', () => {
  const mockHandlers = {
    onRestore: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays empty state when history is empty', () => {
    renderWithIntl(
      <HistoryPanel history={[]} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    expect(screen.getByText('No history yet.')).toBeInTheDocument();
  });

  it('displays history entries', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        gameCount: 3,
        fixedNumbers: [7],
        excludedNumbers: [],
        games: [[1, 7, 13, 21, 35, 42], [2, 8, 14, 22, 36, 43], [3, 9, 15, 23, 37, 44]],
      },
    ];

    renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    expect(screen.getByText(/3 games/i)).toBeInTheDocument();
  });

  it('expands entry on click', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        gameCount: 2,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [[1, 7, 13, 21, 35, 42], [2, 8, 14, 22, 36, 43]],
      },
    ];

    renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    const expandButton = screen.getByText(/2 games/i).closest('button');
    fireEvent.click(expandButton!);

    // The restore button uses GENERATE text from catalog
    expect(screen.getByRole('button', { name: /GENERATE/i })).toBeInTheDocument();
  });

  it('restores entry when restore button clicked', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        gameCount: 2,
        fixedNumbers: [7],
        excludedNumbers: [1, 2, 3],
        games: [[7, 13, 21, 35, 42, 44], [8, 14, 22, 36, 43, 45]],
      },
    ];

    renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    const expandButton = screen.getByText(/2 games/i).closest('button');
    fireEvent.click(expandButton!);

    const restoreButton = screen.getByRole('button', { name: /GENERATE/i });
    fireEvent.click(restoreButton);

    expect(mockHandlers.onRestore).toHaveBeenCalledWith(history[0]);
  });

  it('clears history when clear button clicked', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [[1, 7, 13, 21, 35, 42]],
      },
    ];

    renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    const clearButton = screen.getByRole('button', { name: /Clear History/i });
    fireEvent.click(clearButton);

    expect(mockHandlers.onClear).toHaveBeenCalled();
  });
});
