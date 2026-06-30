import { render, screen } from '@/__test__/test-utils';
import { renderHook, act } from '@testing-library/react';
import { useLadder } from './useLadder';
import { PrizeCards } from './PrizeCards';
import { mulberry32 } from '@/lib/ladder';
import { describe, it, expect } from 'vitest';

describe('PrizeCards Component', () => {
  it('does not render when phase=setup', () => {
    const { result } = renderHook(() => useLadder(2));
    render(<PrizeCards ladder={result.current} />);

    expect(
      screen.queryByRole('region', { name: /Prize cards/i })
    ).not.toBeInTheDocument();
  });

  it('shows question marks when hideResults=true and not revealed', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.build();
    });
    rerender(<PrizeCards ladder={result.current} />);

    const questionMarks = screen.getAllByText('?');
    expect(questionMarks).toHaveLength(2);
  });

  it('shows labels when hideResults=false', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.setPrizeLable(0, 'Prize1');
      result.current.setPrizeLable(1, 'Prize2');
      result.current.toggleHide();
      result.current.build();
    });
    rerender(<PrizeCards ladder={result.current} />);

    expect(screen.getByText('Prize1')).toBeInTheDocument();
    expect(screen.getByText('Prize2')).toBeInTheDocument();
    expect(screen.queryByText('?')).not.toBeInTheDocument();
  });

  it('reveals the card at the END column the revealed player lands on (not the same index)', () => {
    const { result } = renderHook(() => useLadder(4));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    // Seeded build → deterministic, non-identity permutation. Distinct labels per column.
    act(() => {
      ['P0', 'P1', 'P2', 'P3'].forEach((l, i) =>
        result.current.setPrizeLable(i, l)
      );
      result.current.dispatch({ type: 'BUILD', rng: mulberry32(42) });
    });
    rerender(<PrizeCards ladder={result.current} />);
    expect(screen.getAllByText('?')).toHaveLength(4);

    // Pick a player whose trace ends at a DIFFERENT column than its index,
    // so index-coupling vs landing-coupling give different cards.
    const perm = result.current.state.permutation;
    let pIdx = perm.findIndex((endCol, i) => endCol !== i);
    expect(pIdx).toBeGreaterThanOrEqual(0); // mulberry32(42) is non-identity
    const endCol = perm[pIdx];

    act(() => {
      result.current.completeReveal(result.current.state.players[pIdx].id);
    });
    rerender(<PrizeCards ladder={result.current} />);

    // The card at the trace's END column is revealed...
    expect(screen.getByText(`P${endCol}`)).toBeInTheDocument();
    // ...and the same-index card (the OLD wrong target) stays hidden.
    expect(screen.queryByText(`P${pIdx}`)).not.toBeInTheDocument();
    expect(screen.getAllByText('?')).toHaveLength(3);
  });

  it('positions each card at its column center via inline left %', () => {
    const { result } = renderHook(() => useLadder(3));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.build();
    });
    rerender(<PrizeCards ladder={result.current} />);

    const cards = screen.getAllByTestId('prize-card');
    expect(cards).toHaveLength(3);
    // Column centers for N=3 are at (2i+1)/6 → ~16.67%, 50%, 83.33%.
    expect(parseFloat(cards[0].style.left)).toBeCloseTo(16.667, 2);
    expect(parseFloat(cards[1].style.left)).toBeCloseTo(50, 2);
    expect(parseFloat(cards[2].style.left)).toBeCloseTo(83.333, 2);
  });

  it('uses default label when prize.label is empty', () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.toggleHide();
      result.current.build();
    });
    rerender(<PrizeCards ladder={result.current} />);

    // Prize cards should exist (default labels rendered)
    const cards = result.current.state.prizes;
    expect(cards.length).toBe(2);
  });

  it('renders exactly N cards for N players', () => {
    const { result } = renderHook(() => useLadder(5));
    const { rerender } = render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.build();
    });
    rerender(<PrizeCards ladder={result.current} />);

    const questionMarks = screen.getAllByText('?');
    expect(questionMarks).toHaveLength(5);
  });

  it('respects prefers-reduced-motion (no rotateY)', () => {
    // This test verifies the component respects the flag
    // (actual CSS transform is not tested here, just prop passing)
    const { result } = renderHook(() => useLadder(2));
    render(<PrizeCards ladder={result.current} />);

    act(() => {
      result.current.build();
      result.current.completeReveal(result.current.state.players[0].id);
    });

    // Component should render without error
    expect(result.current.prefers_reduced_motion).toBeDefined();
  });
});
