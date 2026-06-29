import { render, screen, waitFor } from '@/__test__/test-utils';
import { renderHook, act } from '@testing-library/react';
import { useLadder } from './useLadder';
import { ResultPanel } from './ResultPanel';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('ResultPanel Component', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  it('hides only in setup; keeps action panel (reveal-all/reshuffle/reset) once built', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<ResultPanel ladder={result.current} />);

    // setup phase → panel not rendered
    expect(screen.queryByText(/Reveal all/i)).not.toBeInTheDocument();

    // After build (ready, no reveals) the action panel IS available — including Reset,
    // so it persists after "다시 섞기" clears reveals (product decision).
    act(() => {
      result.current.build();
    });
    rerender(<ResultPanel ladder={result.current} />);

    expect(screen.getByText(/Reveal all/i)).toBeInTheDocument();
    expect(screen.getByText(/Reshuffle/i)).toBeInTheDocument();
    expect(screen.getByText(/Reset/i)).toBeInTheDocument();
    // Copy is gated before any reveal in hidden mode (no result leak via clipboard)
    expect(screen.queryByText(/Copy results/i)).not.toBeInTheDocument();
  });

  it('renders after first reveal', () => {
    const { result } = renderHook(() => useLadder(2));
    act(() => {
      result.current.build();
      result.current.startTrace(result.current.state.players[0].id);
      result.current.completeReveal(result.current.state.players[0].id);
    });

    render(<ResultPanel ladder={result.current} />);

    expect(screen.getByText(/Reveal all/i)).toBeInTheDocument();
    expect(screen.getByText(/Reshuffle/i)).toBeInTheDocument();
    expect(screen.getByText(/Reset/i)).toBeInTheDocument();
    expect(screen.getByText(/Copy results/i)).toBeInTheDocument();
  });

  it('disables revealAll when phase=done', async () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<ResultPanel ladder={result.current} />);

    act(() => {
      result.current.build();
      result.current.revealAll();
    });
    rerender(<ResultPanel ladder={result.current} />);

    const revealBtn = screen.getByText(/Reveal all/i);
    expect(revealBtn).toBeDisabled();
  });

  it('reshuffle resets revealed and generates new ladder', async () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<ResultPanel ladder={result.current} />);

    act(() => {
      result.current.build();
      result.current.revealAll();
    });
    rerender(<ResultPanel ladder={result.current} />);

    expect(result.current.state.revealed).toHaveLength(2);

    const reshuffleBtn = screen.getByText(/Reshuffle/i);
    await userEvent.click(reshuffleBtn);
    act(() => {
      result.current.reshuffle();
    });

    expect(result.current.state.phase).toBe('ready');
    expect(result.current.state.revealed).toHaveLength(0);
  });

  it('reset returns to setup', async () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<ResultPanel ladder={result.current} />);

    act(() => {
      result.current.build();
      result.current.revealAll();
    });
    rerender(<ResultPanel ladder={result.current} />);

    const resetBtn = screen.getByText(/Reset/i);
    await userEvent.click(resetBtn);
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.phase).toBe('setup');
  });

  it('copies results to clipboard', async () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<ResultPanel ladder={result.current} />);

    act(() => {
      result.current.setPlayerName(0, 'Alice');
      result.current.setPrizeLable(0, 'Prize1');
      result.current.build();
      result.current.revealAll();
    });
    rerender(<ResultPanel ladder={result.current} />);

    const copyBtn = screen.getByText(/Copy results/i);
    await userEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    // Toast should show "Copied"
    await waitFor(() => {
      expect(screen.getByText(/Copied/i)).toBeInTheDocument();
    });
  });

  it('shows Modal fallback when clipboard fails', async () => {
    // Mock clipboard failure
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.reject(new Error('Denied'))),
      },
    });

    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<ResultPanel ladder={result.current} />);

    act(() => {
      result.current.build();
      result.current.revealAll();
    });
    rerender(<ResultPanel ladder={result.current} />);

    const copyBtn = screen.getByText(/Copy results/i);
    await userEvent.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays summary mapping when phase=done', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<ResultPanel ladder={result.current} />);

    act(() => {
      result.current.setPlayerName(0, 'Alice');
      result.current.setPrizeLable(0, 'Prize1');
      result.current.build();
      result.current.revealAll();
    });
    rerender(<ResultPanel ladder={result.current} />);

    const summary = screen.getByRole('heading', { name: /Results/i });
    expect(summary).toBeInTheDocument();

    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/Prize1/i)).toBeInTheDocument();
  });

  it('toggles sound', async () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<ResultPanel ladder={result.current} />);

    act(() => {
      result.current.build();
      result.current.revealAll();
    });
    rerender(<ResultPanel ladder={result.current} />);

    let toggleBtn = screen.getByRole('switch');
    expect(toggleBtn).toHaveAttribute('aria-checked', 'false');

    // Click the toggle button - this will call onChange which calls toggleSound()
    act(() => {
      result.current.toggleSound();
    });
    rerender(<ResultPanel ladder={result.current} />);

    expect(result.current.state.soundOn).toBe(true);
    toggleBtn = screen.getByRole('switch');
    expect(toggleBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('renders aria-live region', () => {
    const { result } = renderHook(() => useLadder(2));
    const { container, rerender } = render(
      <ResultPanel ladder={result.current} />
    );

    // Set up state so component renders
    act(() => {
      result.current.build();
      result.current.startTrace(result.current.state.players[0].id);
      result.current.completeReveal(result.current.state.players[0].id);
    });
    rerender(<ResultPanel ladder={result.current} />);

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });
});
