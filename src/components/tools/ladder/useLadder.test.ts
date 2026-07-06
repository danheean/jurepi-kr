import { renderHook, act } from '@testing-library/react';
import { useLadder } from './useLadder';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useLadder Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with count=5 by default', () => {
    const { result } = renderHook(() => useLadder());
    expect(result.current.state.playerCount).toBe(5);
    expect(result.current.state.phase).toBe('setup');
    expect(result.current.state.players).toHaveLength(5);
    expect(result.current.state.prizes).toHaveLength(5);
  });

  it('clamped count to 2..10', () => {
    const { result } = renderHook(() => useLadder(15));
    expect(result.current.state.playerCount).toBe(10);

    const { result: r2 } = renderHook(() => useLadder(1));
    expect(r2.current.state.playerCount).toBe(2);
  });

  describe('Setup Phase', () => {
    it('initializes with tension=high by default', () => {
      const { result } = renderHook(() => useLadder());
      expect(result.current.state.tension).toBe('high');
    });

    it('SET_TENSION changes state.tension', () => {
      const { result } = renderHook(() => useLadder());
      expect(result.current.state.tension).toBe('high');

      act(() => {
        result.current.setTension('low');
      });

      expect(result.current.state.tension).toBe('low');

      act(() => {
        result.current.setTension('medium');
      });

      expect(result.current.state.tension).toBe('medium');

      act(() => {
        result.current.setTension('high');
      });

      expect(result.current.state.tension).toBe('high');
    });

    it('SET_COUNT preserves existing values', () => {
      const { result } = renderHook(() => useLadder());

      act(() => {
        result.current.setPlayerName(0, 'Alice');
        result.current.setPrizeLable(0, 'Coffee');
      });

      expect(result.current.state.players[0].name).toBe('Alice');
      expect(result.current.state.prizes[0].label).toBe('Coffee');

      act(() => {
        result.current.setCount(6);
      });

      expect(result.current.state.playerCount).toBe(6);
      expect(result.current.state.players[0].name).toBe('Alice');
      expect(result.current.state.prizes[0].label).toBe('Coffee');
      expect(result.current.state.players).toHaveLength(6);
    });

    it('truncates names/labels to 12 chars', () => {
      const { result } = renderHook(() => useLadder());

      act(() => {
        result.current.setPlayerName(0, 'VeryLongNameThatExceeds');
      });

      // Reducer truncates, hook should pass through
      expect(result.current.state.players[0].name.length).toBeLessThanOrEqual(
        12
      );
    });

    it('toggleShuffle flips shuffleResults', () => {
      const { result } = renderHook(() => useLadder());
      expect(result.current.state.shuffleResults).toBe(true);

      act(() => {
        result.current.toggleShuffle();
      });

      expect(result.current.state.shuffleResults).toBe(false);
    });

    it('toggleSound flips soundOn', () => {
      const { result } = renderHook(() => useLadder());
      expect(result.current.state.soundOn).toBe(false);

      act(() => {
        result.current.toggleSound();
      });

      expect(result.current.state.soundOn).toBe(true);
    });
  });

  describe('Build & Ready Phase', () => {
    it('BUILD transitions setup→ready, generates permutation+rungs', () => {
      const { result } = renderHook(() => useLadder());
      expect(result.current.state.phase).toBe('setup');

      act(() => {
        result.current.build();
      });

      expect(result.current.state.phase).toBe('ready');
      expect(result.current.state.permutation.length).toBe(
        result.current.state.playerCount
      );
      expect(result.current.state.rungs.length).toBeGreaterThan(0);
    });
  });

  describe('Reveal Flow', () => {
    beforeEach(() => {
      // Setup hook with build
      const { result } = renderHook(() => useLadder(2));
      act(() => {
        result.current.build();
      });
    });

    it('START_TRACE sets activeTrace, locks other clicks', () => {
      const { result } = renderHook(() => useLadder(2));
      act(() => {
        result.current.build();
      });

      const player1 = result.current.state.players[0];
      expect(result.current.canStartTrace()).toBe(true);

      act(() => {
        result.current.startTrace(player1.id);
      });

      expect(result.current.state.activeTrace).toBe(player1.id);
      expect(result.current.canStartTrace()).toBe(false);
      expect(result.current.isAnimating).toBe(true);
    });

    it('COMPLETE_REVEAL adds to revealed, clears activeTrace if one', () => {
      const { result } = renderHook(() => useLadder(2));
      act(() => {
        result.current.build();
      });

      const player1 = result.current.state.players[0];

      act(() => {
        result.current.startTrace(player1.id);
      });

      expect(result.current.state.revealed).not.toContain(player1.id);

      act(() => {
        result.current.completeReveal(player1.id);
      });

      expect(result.current.state.revealed).toContain(player1.id);
      expect(result.current.state.activeTrace).toBeNull();
      expect(result.current.canStartTrace()).toBe(true);
    });

    it('REVEAL_ALL transitions to done', () => {
      const { result } = renderHook(() => useLadder(2));
      act(() => {
        result.current.build();
      });

      act(() => {
        result.current.revealAll();
      });

      expect(result.current.state.phase).toBe('done');
      expect(result.current.state.revealed).toHaveLength(2);
    });
  });

  describe('Reshuffle & Reset', () => {
    it('RESHUFFLE generates new permutation, keeps labels, clears revealed', () => {
      const { result } = renderHook(() => useLadder(2));

      act(() => {
        result.current.setPlayerName(0, 'Alice');
        result.current.setPrizeLable(0, 'Prize1');
        result.current.build();
      });

      const perm1 = result.current.state.permutation;

      act(() => {
        result.current.revealAll();
      });

      expect(result.current.state.revealed).toHaveLength(2);

      act(() => {
        result.current.reshuffle();
      });

      expect(result.current.state.phase).toBe('ready');
      expect(result.current.state.revealed).toHaveLength(0);
      expect(result.current.state.players[0].name).toBe('Alice');
      expect(result.current.state.prizes[0].label).toBe('Prize1');
      // New permutation has been generated
      expect(result.current.state.permutation.length).toBe(2);
    });

    it('RESET returns to setup, keeps labels', () => {
      const { result } = renderHook(() => useLadder(2));

      act(() => {
        result.current.setPlayerName(0, 'Bob');
        result.current.build();
        result.current.revealAll();
      });

      expect(result.current.state.phase).toBe('done');

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.phase).toBe('setup');
      expect(result.current.state.players[0].name).toBe('Bob');
      expect(result.current.state.revealed).toHaveLength(0);
      expect(result.current.state.rungs).toHaveLength(0);
    });
  });

  describe('Derived State', () => {
    it('isRevealed checks membership in revealed[]', () => {
      const { result } = renderHook(() => useLadder(2));
      act(() => {
        result.current.build();
      });

      const player = result.current.state.players[0];
      expect(result.current.isRevealed(player.id)).toBe(false);

      act(() => {
        result.current.startTrace(player.id);
        result.current.completeReveal(player.id);
      });

      expect(result.current.isRevealed(player.id)).toBe(true);
    });

    it('canStartTrace returns false if activeTrace!=null or phase=setup', () => {
      const { result } = renderHook(() => useLadder(2));
      expect(result.current.state.phase).toBe('setup');
      expect(result.current.canStartTrace()).toBe(false);

      act(() => {
        result.current.build();
      });

      expect(result.current.canStartTrace()).toBe(true);

      act(() => {
        result.current.startTrace(result.current.state.players[0].id);
      });

      expect(result.current.canStartTrace()).toBe(false);
    });
  });

  describe('prefers-reduced-motion', () => {
    it('detects prefers-reduced-motion media query', () => {
      const { result } = renderHook(() => useLadder());
      // Should initialize to false (default)
      expect(typeof result.current.prefers_reduced_motion).toBe('boolean');
    });
  });
});
