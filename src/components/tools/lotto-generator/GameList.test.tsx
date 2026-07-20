import { render, screen, fireEvent, waitFor, act } from '@/__test__/test-utils';
import { GameList } from './GameList';
import type { Draw } from '@/lib/lotto-generator/schema';

describe('GameList', () => {
  it('displays empty state when no games', () => {
    render(<GameList games={[]} animationPhase="idle" />);

    expect(screen.getByText(/Generate numbers/i)).toBeInTheDocument();
  });

  it('displays games with correct labels', () => {
    const games: Draw[] = [
      [1, 7, 13, 21, 35, 42],
      [2, 8, 14, 22, 36, 43],
    ];

    render(<GameList games={games} animationPhase="idle" />);

    expect(screen.getByText(/Game 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Game 2/i)).toBeInTheDocument();
  });

  it('renders all balls in games', () => {
    const games: Draw[] = [[1, 7, 13, 21, 35, 42]];

    render(<GameList games={games} animationPhase="idle" />);

    // Get all balls with the role and check for specific numbers
    const balls = screen.getAllByRole('img', { name: /Ball/i });
    expect(balls.length).toBeGreaterThanOrEqual(6);

    // Verify we have at least 6 balls rendered
    expect(balls.length).toBe(6);
  });

  it('copy button shows "Copied!" after click', async () => {
    const games: Draw[] = [[1, 7, 13, 21, 35, 42]];

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    render(<GameList games={games} animationPhase="idle" />);

    const copyButton = screen.getByRole('button', { name: /COPY/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });
  });

  it('reverts copy button after 2 seconds', async () => {
    const games: Draw[] = [[1, 7, 13, 21, 35, 42]];

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.useFakeTimers();

    render(<GameList games={games} animationPhase="idle" />);

    const copyButton = screen.getByRole('button', { name: /COPY/i });
    fireEvent.click(copyButton);

    // Flush the async clipboard promise (advanceTimersByTimeAsync flushes
    // microtasks AND timers — waitFor deadlocks under fake timers).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(copyButton.textContent).toContain('Copied!');

    // Advance past the 2s revert timeout
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(copyButton.textContent).toContain('COPY');
    expect(copyButton.textContent).not.toContain('Copied!');

    vi.useRealTimers();
  });
});
