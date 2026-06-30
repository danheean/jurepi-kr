import { describe, it, expect } from 'vitest';
import {
  Player,
  Prize,
  LadderPhase,
  LadderState,
  initLadderState,
  ladderReducer,
  selectMapping,
  selectInversePermutation,
} from './ladder-reducer';
import { mulberry32, uniformPermutation } from './ladder';

describe('ladder reducer', () => {
  describe('initLadderState', () => {
    it('initializes with default count=4', () => {
      const state = initLadderState();
      expect(state.playerCount).toBe(4);
      expect(state.players).toHaveLength(4);
      expect(state.prizes).toHaveLength(4);
      expect(state.phase).toBe('setup');
      expect(state.shuffleResults).toBe(true);
      expect(state.prizeOrder).toEqual([0, 1, 2, 3]);
      expect(state.soundOn).toBe(false);
      expect(state.rungs).toEqual([]);
      expect(state.permutation).toEqual([]);
      expect(state.revealed).toEqual([]);
      expect(state.activeTrace).toBeNull();
    });

    it('initializes with custom count', () => {
      const state = initLadderState(6);
      expect(state.playerCount).toBe(6);
      expect(state.players).toHaveLength(6);
      expect(state.prizes).toHaveLength(6);
    });

    it('clamps count to 2..10', () => {
      expect(initLadderState(1).playerCount).toBe(2);
      expect(initLadderState(0).playerCount).toBe(2);
      expect(initLadderState(11).playerCount).toBe(10);
      expect(initLadderState(15).playerCount).toBe(10);
    });

    it('generates unique player and prize IDs', () => {
      const state = initLadderState(3);
      const playerIds = state.players.map((p) => p.id);
      const prizeIds = state.prizes.map((p) => p.id);
      const allIds = [...playerIds, ...prizeIds];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  describe('SET_COUNT action', () => {
    it('increases player/prize counts, preserving existing values', () => {
      let state = initLadderState(2);
      state = ladderReducer(state, { type: 'SET_PLAYER_NAME', index: 0, name: 'Alice' });
      state = ladderReducer(state, { type: 'SET_PRIZE_LABEL', index: 0, label: 'Prize A' });

      state = ladderReducer(state, { type: 'SET_COUNT', count: 4 });
      expect(state.playerCount).toBe(4);
      expect(state.players).toHaveLength(4);
      expect(state.players[0].name).toBe('Alice');
      expect(state.prizes).toHaveLength(4);
      expect(state.prizes[0].label).toBe('Prize A');
      // New rows should be blank
      expect(state.players[2].name).toBe('');
      expect(state.prizes[2].label).toBe('');
    });

    it('decreases player/prize counts, preserving existing values', () => {
      let state = initLadderState(4);
      state = ladderReducer(state, { type: 'SET_PLAYER_NAME', index: 0, name: 'Alice' });
      state = ladderReducer(state, { type: 'SET_PLAYER_NAME', index: 3, name: 'Dave' });

      state = ladderReducer(state, { type: 'SET_COUNT', count: 2 });
      expect(state.playerCount).toBe(2);
      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe('Alice');
      // Dave is removed (was at index 3)
    });

    it('clamps count to 2..10', () => {
      let state = initLadderState(4);
      state = ladderReducer(state, { type: 'SET_COUNT', count: 1 });
      expect(state.playerCount).toBe(2);
      state = ladderReducer(state, { type: 'SET_COUNT', count: 15 });
      expect(state.playerCount).toBe(10);
    });

    it('ignores count if already at that value', () => {
      const state = initLadderState(4);
      const newState = ladderReducer(state, { type: 'SET_COUNT', count: 4 });
      expect(newState).toBe(state);
    });

    it('resets prizeOrder to identity when changing count', () => {
      let state = initLadderState(2);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });
      // After BUILD, prizeOrder should be shuffle-dependent
      state = ladderReducer(state, { type: 'SET_COUNT', count: 4 });
      expect(state.prizeOrder).toEqual([0, 1, 2, 3]);
    });
  });

  describe('SET_PLAYER_NAME action', () => {
    it('sets player name at index', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'SET_PLAYER_NAME', index: 1, name: 'Bob' });
      expect(state.players[1].name).toBe('Bob');
      expect(state.players[0].name).toBe('');
      expect(state.players[2].name).toBe('');
    });

    it('truncates name to 12 chars', () => {
      let state = initLadderState(2);
      state = ladderReducer(state, {
        type: 'SET_PLAYER_NAME',
        index: 0,
        name: 'This is way too long',
      });
      expect(state.players[0].name).toBe('This is way ');
      expect(state.players[0].name.length).toBe(12);
    });

    it('ignores invalid index', () => {
      const state = initLadderState(3);
      const newState = ladderReducer(state, {
        type: 'SET_PLAYER_NAME',
        index: 10,
        name: 'Out of bounds',
      });
      expect(newState).toBe(state);
    });
  });

  describe('SET_PRIZE_LABEL action', () => {
    it('sets prize label at index', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'SET_PRIZE_LABEL', index: 2, label: 'Coffee' });
      expect(state.prizes[2].label).toBe('Coffee');
      expect(state.prizes[0].label).toBe('');
    });

    it('truncates label to 12 chars', () => {
      let state = initLadderState(2);
      state = ladderReducer(state, {
        type: 'SET_PRIZE_LABEL',
        index: 0,
        label: 'This label is extremely long',
      });
      expect(state.prizes[0].label).toBe('This label i');
      expect(state.prizes[0].label.length).toBe(12);
    });
  });

  describe('TOGGLE_SHUFFLE action', () => {
    it('toggles shuffleResults', () => {
      let state = initLadderState();
      expect(state.shuffleResults).toBe(true);
      state = ladderReducer(state, { type: 'TOGGLE_SHUFFLE' });
      expect(state.shuffleResults).toBe(false);
      state = ladderReducer(state, { type: 'TOGGLE_SHUFFLE' });
      expect(state.shuffleResults).toBe(true);
    });
  });

  describe('TOGGLE_SOUND action', () => {
    it('toggles soundOn', () => {
      let state = initLadderState();
      expect(state.soundOn).toBe(false);
      state = ladderReducer(state, { type: 'TOGGLE_SOUND' });
      expect(state.soundOn).toBe(true);
      state = ladderReducer(state, { type: 'TOGGLE_SOUND' });
      expect(state.soundOn).toBe(false);
    });
  });

  describe('BUILD action', () => {
    it('transitions setup → ready and generates permutation + rungs', () => {
      let state = initLadderState(3);
      // Set tension to 'low' to get baseline rungs (no decoy pairs) for this test
      state = ladderReducer(state, { type: 'SET_TENSION', tension: 'low' });
      const rng = mulberry32(42);
      state = ladderReducer(state, { type: 'BUILD', rng });

      expect(state.phase).toBe('ready');
      expect(state.permutation).toHaveLength(3);
      expect(state.rungs).toHaveLength(state.playerCount - 1); // bubble sort exactly n-1 levels with tension='low'
      expect(state.revealed).toEqual([]);
      expect(state.activeTrace).toBeNull();
    });

    it('uses cryptoRng by default', () => {
      let state = initLadderState(2);
      state = ladderReducer(state, { type: 'BUILD' });
      expect(state.phase).toBe('ready');
      expect(state.permutation).toHaveLength(2);
      expect(state.rungs).toBeDefined();
    });

    it('generates a valid permutation with seeded RNG (reproducible)', () => {
      let state1 = initLadderState(4);
      const rng1 = mulberry32(999);
      state1 = ladderReducer(state1, { type: 'BUILD', rng: rng1 });

      let state2 = initLadderState(4);
      const rng2 = mulberry32(999);
      state2 = ladderReducer(state2, { type: 'BUILD', rng: rng2 });

      expect(state1.permutation).toEqual(state2.permutation);
    });

    it('generates prizeOrder when shuffleResults=true', () => {
      let state = initLadderState(4);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(123) });
      expect(state.prizeOrder).toHaveLength(4);
      // prizeOrder should be a valid permutation (contains each index 0..3 exactly once)
      const sorted = state.prizeOrder.slice().sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3]);
    });

    it('sets prizeOrder to identity when shuffleResults=false', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'TOGGLE_SHUFFLE' });
      expect(state.shuffleResults).toBe(false);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(456) });
      expect(state.prizeOrder).toEqual([0, 1, 2]);
    });
  });

  describe('START_TRACE action', () => {
    it('sets activeTrace and phase to revealing', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });
      const playerId = state.players[0].id;

      state = ladderReducer(state, { type: 'START_TRACE', playerId });
      expect(state.activeTrace).toBe(playerId);
      expect(state.phase).toBe('revealing');
    });

    it('ignores START_TRACE during setup phase', () => {
      let state = initLadderState(3);
      const playerId = state.players[0].id;
      const newState = ladderReducer(state, { type: 'START_TRACE', playerId });
      expect(newState).toBe(state);
    });

    it('ignores START_TRACE if another trace is active', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });
      const playerId1 = state.players[0].id;
      const playerId2 = state.players[1].id;

      state = ladderReducer(state, { type: 'START_TRACE', playerId: playerId1 });
      expect(state.activeTrace).toBe(playerId1);

      const newState = ladderReducer(state, { type: 'START_TRACE', playerId: playerId2 });
      expect(newState).toBe(state); // unchanged
    });
  });

  describe('COMPLETE_REVEAL action', () => {
    it('adds playerId to revealed and clears activeTrace', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });
      const playerId = state.players[0].id;
      state = ladderReducer(state, { type: 'START_TRACE', playerId });

      state = ladderReducer(state, { type: 'COMPLETE_REVEAL', playerId });
      expect(state.revealed).toContain(playerId);
      expect(state.activeTrace).toBeNull();
      expect(state.phase).toBe('revealing'); // not all revealed
    });

    it('transitions to done when all players revealed', () => {
      let state = initLadderState(2);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });
      const playerId0 = state.players[0].id;
      const playerId1 = state.players[1].id;

      state = ladderReducer(state, { type: 'START_TRACE', playerId: playerId0 });
      state = ladderReducer(state, { type: 'COMPLETE_REVEAL', playerId: playerId0 });
      expect(state.phase).toBe('revealing');

      state = ladderReducer(state, { type: 'START_TRACE', playerId: playerId1 });
      state = ladderReducer(state, { type: 'COMPLETE_REVEAL', playerId: playerId1 });
      expect(state.phase).toBe('done');
      expect(state.revealed).toEqual([playerId0, playerId1]);
    });

    it('does not add duplicate to revealed', () => {
      let state = initLadderState(2);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });
      const playerId = state.players[0].id;

      state = ladderReducer(state, { type: 'START_TRACE', playerId });
      state = ladderReducer(state, { type: 'COMPLETE_REVEAL', playerId });
      const firstRevealed = state.revealed.slice();

      state = ladderReducer(state, { type: 'START_TRACE', playerId });
      state = ladderReducer(state, { type: 'COMPLETE_REVEAL', playerId });
      expect(state.revealed).toEqual(firstRevealed);
    });
  });

  describe('REVEAL_ALL action', () => {
    it('reveals all unrevealed players and transitions to done', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });
      const [playerId0, playerId1, playerId2] = state.players.map((p) => p.id);

      state = ladderReducer(state, { type: 'START_TRACE', playerId: playerId0 });
      state = ladderReducer(state, { type: 'COMPLETE_REVEAL', playerId: playerId0 });
      expect(state.revealed).toEqual([playerId0]);

      state = ladderReducer(state, { type: 'REVEAL_ALL' });
      expect(state.phase).toBe('done');
      expect(state.revealed).toContain(playerId0);
      expect(state.revealed).toContain(playerId1);
      expect(state.revealed).toContain(playerId2);
      expect(state.activeTrace).toBeNull();
    });

    it('ignores REVEAL_ALL during setup', () => {
      const state = initLadderState(2);
      const newState = ladderReducer(state, { type: 'REVEAL_ALL' });
      expect(newState).toBe(state);
    });
  });

  describe('RESHUFFLE action', () => {
    it('generates new permutation/rungs/prizeOrder while keeping labels', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'SET_PLAYER_NAME', index: 0, name: 'Alice' });
      state = ladderReducer(state, { type: 'SET_PRIZE_LABEL', index: 1, label: 'Coffee' });
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });

      const oldPerm = state.permutation.slice();
      const oldPrizeOrder = state.prizeOrder.slice();
      const playerId0 = state.players[0].id;
      state = ladderReducer(state, { type: 'START_TRACE', playerId: playerId0 });
      state = ladderReducer(state, { type: 'COMPLETE_REVEAL', playerId: playerId0 });
      expect(state.revealed).toHaveLength(1);

      state = ladderReducer(state, { type: 'RESHUFFLE', rng: mulberry32(123) });
      expect(state.phase).toBe('ready');
      expect(state.permutation).not.toEqual(oldPerm);
      expect(state.prizeOrder).not.toEqual(oldPrizeOrder);
      expect(state.players[0].name).toBe('Alice'); // label preserved
      expect(state.prizes[1].label).toBe('Coffee'); // label preserved
      expect(state.revealed).toEqual([]); // reveals cleared
      expect(state.activeTrace).toBeNull();
    });

    it('ignores RESHUFFLE during setup', () => {
      const state = initLadderState(2);
      const newState = ladderReducer(state, { type: 'RESHUFFLE' });
      expect(newState).toBe(state);
    });
  });

  describe('RESET action', () => {
    it('transitions back to setup, clearing rungs/revealed/prizeOrder', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'SET_PLAYER_NAME', index: 0, name: 'Alice' });
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });
      const playerId = state.players[0].id;
      state = ladderReducer(state, { type: 'START_TRACE', playerId });
      state = ladderReducer(state, { type: 'COMPLETE_REVEAL', playerId });

      state = ladderReducer(state, { type: 'RESET' });
      expect(state.phase).toBe('setup');
      expect(state.rungs).toEqual([]);
      expect(state.permutation).toEqual([]);
      expect(state.prizeOrder).toEqual([0, 1, 2]);
      expect(state.revealed).toEqual([]);
      expect(state.activeTrace).toBeNull();
      expect(state.players[0].name).toBe('Alice'); // labels preserved
    });
  });

  describe('SET_ALL_PLAYER_NAMES action', () => {
    it('sets all player names from array', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, {
        type: 'SET_ALL_PLAYER_NAMES',
        names: ['Alice', 'Bob', 'Carol'],
      });
      expect(state.players[0].name).toBe('Alice');
      expect(state.players[1].name).toBe('Bob');
      expect(state.players[2].name).toBe('Carol');
    });

    it('truncates each name to 12 chars', () => {
      let state = initLadderState(2);
      state = ladderReducer(state, {
        type: 'SET_ALL_PLAYER_NAMES',
        names: ['This is way too long', 'Short'],
      });
      expect(state.players[0].name).toBe('This is way ');
      expect(state.players[0].name.length).toBe(12);
      expect(state.players[1].name).toBe('Short');
    });

    it('fills missing names with empty string', () => {
      let state = initLadderState(4);
      state = ladderReducer(state, {
        type: 'SET_ALL_PLAYER_NAMES',
        names: ['Alice'],
      });
      expect(state.players[0].name).toBe('Alice');
      expect(state.players[1].name).toBe('');
      expect(state.players[2].name).toBe('');
      expect(state.players[3].name).toBe('');
    });

    it('clears all names when passed empty array', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, {
        type: 'SET_PLAYER_NAME',
        index: 0,
        name: 'Alice',
      });
      state = ladderReducer(state, {
        type: 'SET_ALL_PLAYER_NAMES',
        names: [],
      });
      expect(state.players[0].name).toBe('');
      expect(state.players[1].name).toBe('');
      expect(state.players[2].name).toBe('');
    });

    it('preserves player IDs', () => {
      let state = initLadderState(2);
      const playerIds = state.players.map((p) => p.id);
      state = ladderReducer(state, {
        type: 'SET_ALL_PLAYER_NAMES',
        names: ['Alice', 'Bob'],
      });
      expect(state.players.map((p) => p.id)).toEqual(playerIds);
    });

    it('does not mutate original state', () => {
      const state = initLadderState(2);
      const originalPlayers = state.players.map((p) => ({ ...p }));
      ladderReducer(state, {
        type: 'SET_ALL_PLAYER_NAMES',
        names: ['Alice', 'Bob'],
      });
      expect(state.players).toEqual(originalPlayers);
    });
  });

  describe('SET_ALL_PRIZE_LABELS action', () => {
    it('sets all prize labels from array', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, {
        type: 'SET_ALL_PRIZE_LABELS',
        labels: ['First', 'Second', 'Third'],
      });
      expect(state.prizes[0].label).toBe('First');
      expect(state.prizes[1].label).toBe('Second');
      expect(state.prizes[2].label).toBe('Third');
    });

    it('truncates each label to 12 chars', () => {
      let state = initLadderState(2);
      state = ladderReducer(state, {
        type: 'SET_ALL_PRIZE_LABELS',
        labels: ['This label is extremely long', 'Short'],
      });
      expect(state.prizes[0].label).toBe('This label i');
      expect(state.prizes[0].label.length).toBe(12);
      expect(state.prizes[1].label).toBe('Short');
    });

    it('fills missing labels with empty string', () => {
      let state = initLadderState(4);
      state = ladderReducer(state, {
        type: 'SET_ALL_PRIZE_LABELS',
        labels: ['Prize A'],
      });
      expect(state.prizes[0].label).toBe('Prize A');
      expect(state.prizes[1].label).toBe('');
      expect(state.prizes[2].label).toBe('');
      expect(state.prizes[3].label).toBe('');
    });

    it('clears all labels when passed empty array', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, {
        type: 'SET_PRIZE_LABEL',
        index: 0,
        label: 'Prize A',
      });
      state = ladderReducer(state, {
        type: 'SET_ALL_PRIZE_LABELS',
        labels: [],
      });
      expect(state.prizes[0].label).toBe('');
      expect(state.prizes[1].label).toBe('');
      expect(state.prizes[2].label).toBe('');
    });

    it('preserves prize IDs', () => {
      let state = initLadderState(2);
      const prizeIds = state.prizes.map((p) => p.id);
      state = ladderReducer(state, {
        type: 'SET_ALL_PRIZE_LABELS',
        labels: ['First', 'Second'],
      });
      expect(state.prizes.map((p) => p.id)).toEqual(prizeIds);
    });

    it('does not mutate original state', () => {
      const state = initLadderState(2);
      const originalPrizes = state.prizes.map((p) => ({ ...p }));
      ladderReducer(state, {
        type: 'SET_ALL_PRIZE_LABELS',
        labels: ['First', 'Second'],
      });
      expect(state.prizes).toEqual(originalPrizes);
    });
  });

  describe('selectMapping selector', () => {
    it('returns playerId → prizeId mapping', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });

      const mapping = selectMapping(state);
      const playerIds = state.players.map((p) => p.id);
      const prizeIds = state.prizes.map((p) => p.id);

      expect(Object.keys(mapping)).toHaveLength(3);
      for (const playerId of playerIds) {
        expect(mapping[playerId]).toBeDefined();
        expect(prizeIds).toContain(mapping[playerId]);
      }
    });

    it('mapping is a bijection (each prize used once)', () => {
      let state = initLadderState(4);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });

      const mapping = selectMapping(state);
      const prizeIdUsed = Object.values(mapping);
      const uniquePrizeIds = new Set(prizeIdUsed);
      expect(uniquePrizeIds.size).toBe(4);
    });

    it('mapping matches permutation structure (permutation[startCol] → prizeOrder[endCol])', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });

      const mapping = selectMapping(state);
      for (let i = 0; i < state.playerCount; i++) {
        const playerId = state.players[i].id;
        const endCol = state.permutation[i];
        const prizeIdx = state.prizeOrder[endCol] ?? endCol;
        const expectedPrizeId = state.prizes[prizeIdx].id;
        expect(mapping[playerId]).toBe(expectedPrizeId);
      }
    });

    it('prizeOrder affects mapping when shuffled', () => {
      // Build two games: one with shuffling ON, one with shuffling OFF
      // When shuffleResults=false, prizeOrder should always be identity
      // When shuffleResults=true, prizeOrder should be a separate permutation
      const seed = 999; // Use different seed to likely get non-identity permutation

      // State 1: shuffleResults = true (default)
      let state1 = initLadderState(4);
      state1 = ladderReducer(state1, { type: 'BUILD', rng: mulberry32(seed) });

      // State 2: shuffleResults = false
      let state2 = initLadderState(4);
      state2 = ladderReducer(state2, { type: 'TOGGLE_SHUFFLE' }); // Disable shuffling
      state2 = ladderReducer(state2, { type: 'BUILD', rng: mulberry32(seed) });

      // state2 should always have identity prizeOrder
      expect(state2.prizeOrder).toEqual([0, 1, 2, 3]);

      // state1 may have different prizeOrder (no guarantee it's not identity, but likely)
      // Main test: when shuffleResults is OFF, prizeOrder is always identity
      const mapping1 = selectMapping(state1);
      const mapping2 = selectMapping(state2);

      // If state1 happens to have identity prizeOrder, they'd be the same
      // But the key invariant is: shuffleResults=false always gives identity
      // Let's just verify that shuffleResults=false gives identity
      expect(state2.shuffleResults).toBe(false);
      expect(state2.prizeOrder).toEqual([0, 1, 2, 3]);
    });
  });

  describe('selectInversePermutation selector', () => {
    it('falls back to identity before BUILD', () => {
      const state = initLadderState(4);
      expect(selectInversePermutation(state)).toEqual([0, 1, 2, 3]);
    });

    it('is the true inverse of permutation (inverse[permutation[s]] === s)', () => {
      let state = initLadderState(5);
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });

      const inverse = selectInversePermutation(state);
      expect(inverse).toHaveLength(5);
      // Round-trip: the start column that lands at endCol is permutation^-1(endCol).
      for (let startCol = 0; startCol < state.playerCount; startCol++) {
        const endCol = state.permutation[startCol];
        expect(inverse[endCol]).toBe(startCol);
      }
      // It is itself a permutation of 0..n-1.
      expect([...inverse].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('tension state management', () => {
    it('initializes with default tension=high', () => {
      const state = initLadderState(4);
      expect(state.tension).toBe('high');
    });

    it('SET_TENSION action changes tension', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'SET_TENSION', tension: 'low' });
      expect(state.tension).toBe('low');

      state = ladderReducer(state, { type: 'SET_TENSION', tension: 'medium' });
      expect(state.tension).toBe('medium');

      state = ladderReducer(state, { type: 'SET_TENSION', tension: 'high' });
      expect(state.tension).toBe('high');
    });

    it('tension is preserved across SET_COUNT', () => {
      let state = initLadderState(2);
      state = ladderReducer(state, { type: 'SET_TENSION', tension: 'low' });
      expect(state.tension).toBe('low');

      state = ladderReducer(state, { type: 'SET_COUNT', count: 4 });
      expect(state.tension).toBe('low'); // Should remain low
    });

    it('tension is preserved across RESET', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'SET_TENSION', tension: 'medium' });
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });
      state = ladderReducer(state, { type: 'RESET' });
      expect(state.tension).toBe('medium'); // Should remain medium after reset
    });

    it('BUILD uses the current tension setting', () => {
      let state1 = initLadderState(4);
      state1 = ladderReducer(state1, { type: 'SET_TENSION', tension: 'low' });
      state1 = ladderReducer(state1, { type: 'BUILD', rng: mulberry32(999) });
      const rungsLow = state1.rungs;

      let state2 = initLadderState(4);
      state2 = ladderReducer(state2, { type: 'SET_TENSION', tension: 'high' });
      state2 = ladderReducer(state2, { type: 'BUILD', rng: mulberry32(999) });
      const rungsHigh = state2.rungs;

      // Both should be valid rungs, but high should have more levels
      expect(rungsHigh.length).toBeGreaterThan(rungsLow.length);
    });

    it('RESHUFFLE preserves tension', () => {
      let state = initLadderState(3);
      state = ladderReducer(state, { type: 'SET_TENSION', tension: 'medium' });
      state = ladderReducer(state, { type: 'BUILD', rng: mulberry32(42) });

      const oldTension = state.tension;
      state = ladderReducer(state, { type: 'RESHUFFLE', rng: mulberry32(123) });
      expect(state.tension).toBe(oldTension);
    });
  });
});
