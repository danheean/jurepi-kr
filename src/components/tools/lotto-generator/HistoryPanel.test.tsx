import { render, screen, fireEvent } from '@testing-library/react';
import { AllTheProviders } from '@/__test__/test-utils';
import { HistoryPanel } from './HistoryPanel';
import type { HistoryEntry } from '@/lib/lotto-generator/schema';

function renderWithIntl(component: React.ReactElement) {
  return render(component, {
    wrapper: ({ children }) => AllTheProviders({ children, locale: 'en' }),
  });
}

function renderWithLocale(component: React.ReactElement, locale: string) {
  return render(component, {
    wrapper: ({ children }) => AllTheProviders({ children, locale }),
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

  it('formats a recent timestamp via Intl.RelativeTimeFormat, not hand-rolled ko/en branching', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [{ numbers: [1, 7, 13, 21, 35, 42], bonus: 25 }],
      },
    ];

    renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    expect(screen.getByText(/now/i)).toBeInTheDocument();
  });

  it('uses correct singular grammar for a 1-minute-old entry (regression: always said "1 minutes ago")', () => {
    const history: HistoryEntry[] = [
      {
        // 75s ago rounds to -1 minute — comfortably clear of any rounding
        // boundary ambiguity.
        timestamp: new Date(Date.now() - 75_000).toISOString(),
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [{ numbers: [1, 7, 13, 21, 35, 42], bonus: 25 }],
      },
    ];

    renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    expect(screen.getByText('1 minute ago')).toBeInTheDocument();
    expect(screen.queryByText('1 minutes ago')).toBeNull();
  });

  it('uses correct singular grammar for a 1-game entry (regression: always said "1 games")', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [{ numbers: [1, 7, 13, 21, 35, 42], bonus: 25 }],
      },
    ];

    renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    expect(screen.getByText('1 game')).toBeInTheDocument();
    expect(screen.queryByText('1 games')).toBeNull();
  });

  it('formats the timestamp in Korean on the ko locale', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date(Date.now() - 75_000).toISOString(),
        gameCount: 1,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [{ numbers: [1, 7, 13, 21, 35, 42], bonus: 25 }],
      },
    ];

    renderWithLocale(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />,
      'ko'
    );

    expect(screen.getByText('1분 전')).toBeInTheDocument();
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
        games: [
          { numbers: [1, 7, 13, 21, 35, 42], bonus: 25 },
          { numbers: [2, 8, 14, 22, 36, 43], bonus: 10 },
          { numbers: [3, 9, 15, 23, 37, 44], bonus: 30 },
        ],
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
        games: [
          { numbers: [1, 7, 13, 21, 35, 42], bonus: 25 },
          { numbers: [2, 8, 14, 22, 36, 43], bonus: 10 },
        ],
      },
    ];

    renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    const expandButton = screen.getByText(/2 games/i).closest('button');
    fireEvent.click(expandButton!);

    // The restore button has its own label — it restores a past draw, it
    // doesn't generate a new one (regression: it used to reuse GENERATE).
    expect(screen.getByRole('button', { name: /Restore this draw/i })).toBeInTheDocument();
  });

  it('exposes expand/collapse state via aria-expanded and aria-controls', () => {
    // Regression: the disclosure toggle had no aria-expanded/aria-controls
    // at all, so screen reader users got no indication it was a disclosure
    // or whether it was open.
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        gameCount: 2,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [
          { numbers: [1, 7, 13, 21, 35, 42], bonus: 25 },
          { numbers: [2, 8, 14, 22, 36, 43], bonus: 10 },
        ],
      },
    ];

    renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    const expandButton = screen.getByText(/2 games/i).closest('button')!;
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    const controlsId = expandButton.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();

    fireEvent.click(expandButton);

    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(controlsId!)).toBeInTheDocument();
  });

  it('uses a theme-aware surface token for the expanded panel, not hardcoded white', () => {
    // Regression: bg-white stayed literally white in dark mode (glaring box);
    // bg-surface resolves per theme like the rest of the tool.
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        gameCount: 2,
        fixedNumbers: [],
        excludedNumbers: [],
        games: [
          { numbers: [1, 7, 13, 21, 35, 42], bonus: 25 },
          { numbers: [2, 8, 14, 22, 36, 43], bonus: 10 },
        ],
      },
    ];

    const { container } = renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    const expandButton = screen.getByText(/2 games/i).closest('button');
    fireEvent.click(expandButton!);

    expect(container.querySelector('.bg-white')).toBeNull();
    expect(container.querySelector('.bg-surface')).not.toBeNull();
  });

  it('restores entry when restore button clicked', () => {
    const history: HistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        gameCount: 2,
        fixedNumbers: [7],
        excludedNumbers: [1, 2, 3],
        games: [
          { numbers: [7, 13, 21, 35, 42, 44], bonus: 25 },
          { numbers: [8, 14, 22, 36, 43, 45], bonus: 10 },
        ],
      },
    ];

    renderWithIntl(
      <HistoryPanel history={history} onRestore={mockHandlers.onRestore} onClear={mockHandlers.onClear} />
    );

    const expandButton = screen.getByText(/2 games/i).closest('button');
    fireEvent.click(expandButton!);

    // Fixed/excluded numbers render through the message catalog, not
    // hardcoded English (regression: literal "Fixed:"/"Excluded:" leaked
    // onto the ko page regardless of locale).
    expect(screen.getByText('Fixed: 7')).toBeInTheDocument();
    expect(screen.getByText('Excluded: 1, 2, 3')).toBeInTheDocument();

    const restoreButton = screen.getByRole('button', { name: /Restore this draw/i });
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
        games: [{ numbers: [1, 7, 13, 21, 35, 42], bonus: 25 }],
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
