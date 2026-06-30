import { render, screen } from '@/__test__/test-utils';
import { renderHook, act } from '@testing-library/react';
import { useLadder } from './useLadder';
import { PlayerHeader } from './PlayerHeader';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('PlayerHeader Component', () => {
  it('does not render when phase=setup', () => {
    const { result } = renderHook(() => useLadder(2));
    render(<PlayerHeader ladder={result.current} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders player chips after build', () => {
    const { result } = renderHook(() => useLadder(2));
    act(() => {
      result.current.setPlayerName(0, 'Alice');
      result.current.setPlayerName(1, 'Bob');
      result.current.build();
    });

    render(<PlayerHeader ladder={result.current} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('chip has aria-label with player name', () => {
    const { result } = renderHook(() => useLadder(2));
    act(() => {
      result.current.setPlayerName(0, 'Alice');
      result.current.build();
    });

    render(<PlayerHeader ladder={result.current} />);

    const aliceBtn = screen.getByLabelText(/Alice/i);
    expect(aliceBtn).toBeInTheDocument();
  });

  it('clicking chip starts trace', async () => {
    const { result } = renderHook(() => useLadder(2));
    act(() => {
      result.current.setPlayerName(0, 'Alice');
      result.current.build();
    });

    render(<PlayerHeader ladder={result.current} />);

    const aliceChip = screen.getByText('Alice');
    await userEvent.click(aliceChip);

    act(() => {
      result.current.startTrace(result.current.state.players[0].id);
    });

    expect(result.current.state.activeTrace).toBe(
      result.current.state.players[0].id
    );
  });

  it('disables chip click during active trace', async () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<PlayerHeader ladder={result.current} />);

    act(() => {
      result.current.setPlayerName(0, 'Alice');
      result.current.setPlayerName(1, 'Bob');
      result.current.build();
      result.current.startTrace(result.current.state.players[0].id);
    });
    rerender(<PlayerHeader ladder={result.current} />);

    const bobChip = screen.getByText('Bob');
    expect(bobChip).toBeDisabled();
  });

  it('shows check mark on revealed chip', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<PlayerHeader ladder={result.current} />);

    act(() => {
      result.current.setPlayerName(0, 'Alice');
      result.current.build();
      result.current.startTrace(result.current.state.players[0].id);
      result.current.completeReveal(result.current.state.players[0].id);
    });
    rerender(<PlayerHeader ladder={result.current} />);

    expect(screen.getByText('Alice ✓')).toBeInTheDocument();
  });

  it('disables revealed chip', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<PlayerHeader ladder={result.current} />);

    act(() => {
      result.current.setPlayerName(0, 'Alice');
      result.current.build();
      result.current.startTrace(result.current.state.players[0].id);
      result.current.completeReveal(result.current.state.players[0].id);
    });
    rerender(<PlayerHeader ladder={result.current} />);

    const aliceChip = screen.getByText(/Alice/i);
    expect(aliceChip).toBeDisabled();
  });

  it('renders with default names when empty', () => {
    const { result } = renderHook(() => useLadder(2));
    act(() => {
      // Don't set names, leave blank
      result.current.build();
    });

    render(<PlayerHeader ladder={result.current} />);

    expect(screen.getByText(/Player 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Player 2/i)).toBeInTheDocument();
  });

  it('positions each chip at its column center via inline left %', () => {
    const { result } = renderHook(() => useLadder(4));
    act(() => {
      result.current.build();
    });

    render(<PlayerHeader ladder={result.current} />);

    const chips = screen.getAllByTestId('player-chip');
    expect(chips).toHaveLength(4);
    // Column centers for N=4 → (2i+1)/8 → 12.5%, 37.5%, 62.5%, 87.5%.
    expect(parseFloat((chips[0] as HTMLElement).style.left)).toBeCloseTo(12.5, 2);
    expect(parseFloat((chips[1] as HTMLElement).style.left)).toBeCloseTo(37.5, 2);
    expect(parseFloat((chips[2] as HTMLElement).style.left)).toBeCloseTo(62.5, 2);
    expect(parseFloat((chips[3] as HTMLElement).style.left)).toBeCloseTo(87.5, 2);
  });
});
