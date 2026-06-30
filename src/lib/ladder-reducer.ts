/**
 * Pure state machine reducer for the ladder game.
 * No side effects, no i18n strings, no React imports.
 * RNG is injectable (default: cryptoRng).
 */

import { nanoid } from 'nanoid';
import type { Rng } from './ladder';
import {
  cryptoRng,
  uniformPermutation,
  ladderFromPermutation,
} from './ladder';

export interface Player {
  id: string;
  name: string; // max 12 chars; blank allowed (renders as default)
}

export interface Prize {
  id: string;
  label: string; // max 12 chars; blank allowed (renders as default)
}

export type LadderPhase = 'setup' | 'ready' | 'revealing' | 'done';

export interface LadderState {
  playerCount: number; // 2..10
  players: Player[];
  prizes: Prize[];
  hideResults: boolean; // default true
  soundOn: boolean; // default false
  phase: LadderPhase;
  rungs: boolean[][];
  permutation: number[]; // set by BUILD
  revealed: string[]; // playerId[], serialization-friendly
  activeTrace: string | null; // playerId being animated, or null
}

export type LadderAction =
  | { type: 'SET_COUNT'; count: number }
  | { type: 'SET_PLAYER_NAME'; index: number; name: string }
  | { type: 'SET_PRIZE_LABEL'; index: number; label: string }
  | { type: 'SET_ALL_PLAYER_NAMES'; names: string[] }
  | { type: 'SET_ALL_PRIZE_LABELS'; labels: string[] }
  | { type: 'TOGGLE_HIDE' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'BUILD'; rng?: Rng }
  | { type: 'START_TRACE'; playerId: string }
  | { type: 'COMPLETE_REVEAL'; playerId: string }
  | { type: 'REVEAL_ALL' }
  | { type: 'RESHUFFLE'; rng?: Rng }
  | { type: 'RESET' };

/**
 * Initialize the ladder state with a default player count.
 * All players and prizes start with blank names/labels (rendered as defaults).
 */
export function initLadderState(count: number = 4): LadderState {
  const playerCount = Math.max(2, Math.min(10, count));
  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: nanoid(),
    name: '',
  }));
  const prizes = Array.from({ length: playerCount }, (_, i) => ({
    id: nanoid(),
    label: '',
  }));

  return {
    playerCount,
    players,
    prizes,
    hideResults: true,
    soundOn: false,
    phase: 'setup',
    rungs: [],
    permutation: [],
    revealed: [],
    activeTrace: null,
  };
}

/**
 * Pure reducer: state + action → new state.
 */
export function ladderReducer(
  state: LadderState,
  action: LadderAction
): LadderState {
  switch (action.type) {
    case 'SET_COUNT': {
      const newCount = Math.max(2, Math.min(10, action.count));
      if (newCount === state.playerCount) return state;

      // If growing: add new rows with blank names/labels, preserve existing
      // If shrinking: remove from the end, preserve existing
      const newPlayers = state.players.slice(0, newCount);
      const newPrizes = state.prizes.slice(0, newCount);

      // Add new rows if needed
      while (newPlayers.length < newCount) {
        newPlayers.push({ id: nanoid(), name: '' });
      }
      while (newPrizes.length < newCount) {
        newPrizes.push({ id: nanoid(), label: '' });
      }

      return {
        ...state,
        playerCount: newCount,
        players: newPlayers,
        prizes: newPrizes,
      };
    }

    case 'SET_PLAYER_NAME': {
      const { index, name } = action;
      if (index < 0 || index >= state.players.length) return state;
      const truncated = name.substring(0, 12);
      const newPlayers = state.players.map((p, i) =>
        i === index ? { ...p, name: truncated } : p
      );
      return { ...state, players: newPlayers };
    }

    case 'SET_PRIZE_LABEL': {
      const { index, label } = action;
      if (index < 0 || index >= state.prizes.length) return state;
      const truncated = label.substring(0, 12);
      const newPrizes = state.prizes.map((p, i) =>
        i === index ? { ...p, label: truncated } : p
      );
      return { ...state, prizes: newPrizes };
    }

    case 'SET_ALL_PLAYER_NAMES': {
      const { names } = action;
      const newPlayers = state.players.map((p, i) => ({
        ...p,
        name: (names[i] ?? '').substring(0, 12),
      }));
      return { ...state, players: newPlayers };
    }

    case 'SET_ALL_PRIZE_LABELS': {
      const { labels } = action;
      const newPrizes = state.prizes.map((p, i) => ({
        ...p,
        label: (labels[i] ?? '').substring(0, 12),
      }));
      return { ...state, prizes: newPrizes };
    }

    case 'TOGGLE_HIDE': {
      return { ...state, hideResults: !state.hideResults };
    }

    case 'TOGGLE_SOUND': {
      return { ...state, soundOn: !state.soundOn };
    }

    case 'BUILD': {
      const rng = action.rng || cryptoRng;
      const permutation = uniformPermutation(state.playerCount, rng);
      const rungs = ladderFromPermutation(permutation, rng);
      return {
        ...state,
        phase: 'ready',
        permutation,
        rungs,
        revealed: [],
        activeTrace: null,
      };
    }

    case 'START_TRACE': {
      // Only allow if phase is ready or revealing (not setup or done)
      if (state.phase !== 'ready' && state.phase !== 'revealing') return state;
      // Ignore if another trace is already active
      if (state.activeTrace !== null) return state;
      return {
        ...state,
        phase: 'revealing',
        activeTrace: action.playerId,
      };
    }

    case 'COMPLETE_REVEAL': {
      const { playerId } = action;
      // Add to revealed if not already there
      const newRevealed = state.revealed.includes(playerId)
        ? state.revealed
        : [...state.revealed, playerId];

      // Check if all are revealed
      const allRevealed = newRevealed.length === state.playerCount;
      const nextPhase = allRevealed ? 'done' : 'revealing';

      return {
        ...state,
        revealed: newRevealed,
        activeTrace: null,
        phase: nextPhase,
      };
    }

    case 'REVEAL_ALL': {
      if (state.phase !== 'revealing' && state.phase !== 'ready')
        return state;
      // Reveal all players not yet revealed
      const allPlayerIds = state.players.map((p) => p.id);
      const newRevealed = Array.from(new Set([...state.revealed, ...allPlayerIds]));
      return {
        ...state,
        revealed: newRevealed,
        activeTrace: null,
        phase: 'done',
      };
    }

    case 'RESHUFFLE': {
      if (state.phase === 'setup') return state; // Cannot reshuffle if not yet built
      const rng = action.rng || cryptoRng;
      const permutation = uniformPermutation(state.playerCount, rng);
      const rungs = ladderFromPermutation(permutation, rng);
      return {
        ...state,
        phase: 'ready',
        permutation,
        rungs,
        revealed: [],
        activeTrace: null,
      };
    }

    case 'RESET': {
      return {
        ...state,
        phase: 'setup',
        rungs: [],
        permutation: [],
        revealed: [],
        activeTrace: null,
      };
    }

    default:
      return state;
  }
}

/**
 * Selector: derive the player→prize mapping from the state.
 * Returns Record<playerId, prizeId>.
 */
export function selectMapping(state: LadderState): Record<string, string> {
  const mapping: Record<string, string> = {};
  const { permutation, players, prizes } = state;

  for (let startCol = 0; startCol < players.length; startCol++) {
    const playerId = players[startCol].id;
    const prizeIdx = permutation[startCol] ?? startCol; // fallback if permutation not yet set
    const prizeId = prizes[prizeIdx]?.id ?? '';
    mapping[playerId] = prizeId;
  }

  return mapping;
}

/**
 * Selector: inverse of the permutation — for each END column, which START column
 * (player index) lands there. `permutation[startCol] = endCol`, so
 * `inverse[endCol] = startCol`. Falls back to identity until BUILD sets permutation.
 * Used to reveal/color the prize card under a rail by the player whose trace ends there.
 */
export function selectInversePermutation(state: LadderState): number[] {
  const n = state.players.length;
  const inverse = Array.from({ length: n }, (_, i) => i); // identity fallback
  const { permutation } = state;
  if (permutation.length === n) {
    for (let startCol = 0; startCol < n; startCol++) {
      const endCol = permutation[startCol];
      if (endCol >= 0 && endCol < n) inverse[endCol] = startCol;
    }
  }
  return inverse;
}
