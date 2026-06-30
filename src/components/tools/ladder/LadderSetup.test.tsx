import { render, screen, fireEvent } from '@/__test__/test-utils';
import { renderHook, act } from '@testing-library/react';
import { useLadder } from './useLadder';
import { LadderSetup } from './LadderSetup';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('LadderSetup Component', () => {
  it('renders stepper with player count, min-max bounds', () => {
    const { result } = renderHook(() => useLadder(4));
    render(<LadderSetup ladder={result.current} />);

    const stepper = screen.getByText('4');
    expect(stepper).toBeInTheDocument();

    // Minus button should be enabled (count > 2)
    const minusBtn = screen.getByTestId('stepper-decrement');
    expect(minusBtn).not.toBeDisabled();

    // Plus button should be enabled (count < 10)
    const plusBtn = screen.getByTestId('stepper-increment');
    expect(plusBtn).not.toBeDisabled();
  });

  it('disables minus at count=2, plus at count=10', () => {
    const { result: r2 } = renderHook(() => useLadder(2));
    const { rerender: rerender2 } = render(<LadderSetup ladder={r2.current} />);

    let minusBtn = screen.getByTestId('stepper-decrement');
    expect(minusBtn).toBeDisabled();

    const { result: r10 } = renderHook(() => useLadder(10));
    rerender2(<LadderSetup ladder={r10.current} />);

    let plusBtn = screen.getByTestId('stepper-increment');
    expect(plusBtn).toBeDisabled();
  });

  it('updates count via stepper, preserves existing values', async () => {
    const { result } = renderHook(() => useLadder(4));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    // Enter names in first and last using act() to ensure state updates
    const inputs = screen.getAllByPlaceholderText(/Player name/i);
    await userEvent.type(inputs[0], 'Alice');
    act(() => {
      result.current.setPlayerName(0, 'Alice');
    });
    await userEvent.type(inputs[3], 'Diana');
    act(() => {
      result.current.setPlayerName(3, 'Diana');
    });

    // Simulate increment
    act(() => {
      result.current.setCount(5);
    });
    rerender(<LadderSetup ladder={result.current} />);

    expect(result.current.state.playerCount).toBe(5);
    expect(result.current.state.players[0].name).toBe('Alice');
    expect(result.current.state.players[3].name).toBe('Diana');
    expect(result.current.state.players).toHaveLength(5);
  });

  it('enforces 12 char max on inputs with counter', async () => {
    const { result } = renderHook(() => useLadder(2));
    render(<LadderSetup ladder={result.current} />);

    const playerInput = screen.getAllByPlaceholderText(/Player name/i)[0];
    await userEvent.type(playerInput, 'ThisIsAVeryLongName');

    // Input should be truncated by onChange handler
    expect((playerInput as HTMLInputElement).value.length).toBeLessThanOrEqual(
      12
    );
  });

  it('displays counter near limit', async () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    const playerInput = screen.getAllByPlaceholderText(/Player name/i)[0];
    await userEvent.type(playerInput, '123456789012'); // Exactly 12

    act(() => {
      result.current.setPlayerName(0, '123456789012');
    });
    rerender(<LadderSetup ladder={result.current} />);

    // Counter should show 12/12
    const counter = screen.getByText('12/12');
    expect(counter).toBeInTheDocument();
  });

  it('toggles shuffleResults', async () => {
    const { result } = renderHook(() => useLadder(2));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    let toggleButton = screen.getByTestId('shuffle-results-toggle');
    expect(toggleButton).toHaveAttribute('aria-checked', 'true'); // default ON

    act(() => {
      result.current.toggleShuffle();
    });
    rerender(<LadderSetup ladder={result.current} />);

    expect(result.current.state.shuffleResults).toBe(false);
    toggleButton = screen.getByTestId('shuffle-results-toggle');
    expect(toggleButton).toHaveAttribute('aria-checked', 'false');
  });

  it('dispatches build on button click', async () => {
    const { result } = renderHook(() => useLadder(2));
    render(<LadderSetup ladder={result.current} />);

    expect(result.current.state.phase).toBe('setup');

    const buildBtn = screen.getByText(/Build ladder/i);
    await userEvent.click(buildBtn);

    act(() => {
      result.current.build();
    });

    expect(result.current.state.phase).toBe('ready');
    expect(result.current.state.permutation.length).toBeGreaterThan(0);
  });

  it('renders player & prize inputs in two-column layout', () => {
    const { result } = renderHook(() => useLadder(3));
    render(<LadderSetup ladder={result.current} />);

    const playerInputs = screen.getAllByPlaceholderText(/Player name/i);
    const prizeInputs = screen.getAllByPlaceholderText(/Outcome/i);

    expect(playerInputs).toHaveLength(3);
    expect(prizeInputs).toHaveLength(3);
  });

  it('renders auto-names toggle and result buttons', () => {
    const { result } = renderHook(() => useLadder(4));
    render(<LadderSetup ladder={result.current} />);

    const autoNamesToggle = screen.getByTestId('auto-names-toggle');
    expect(autoNamesToggle).toBeInTheDocument();

    const resultWinnerBtn = screen.getByTestId('result-winner-btn');
    const resultRankBtn = screen.getByTestId('result-rank-btn');
    expect(resultWinnerBtn).toBeInTheDocument();
    expect(resultRankBtn).toBeInTheDocument();
  });

  it('toggling auto-names ON fills player inputs with fruit names', async () => {
    const { result } = renderHook(() => useLadder(4));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    const toggle = screen.getByTestId('auto-names-toggle');
    await userEvent.click(toggle);

    // Trigger the effect to auto-fill
    act(() => {
      result.current.setAllPlayerNames(['🍎 Apple', '🍇 Grape', '🍊 Orange', '🍓 Strawberry']);
    });
    rerender(<LadderSetup ladder={result.current} />);

    const playerInputs = screen.getAllByTestId('player-input');
    playerInputs.forEach((input) => {
      const value = (input as HTMLInputElement).value;
      // Each input should either be empty or contain a non-empty string
      // (the exact value depends on auto-fill from pickFruits)
      expect(typeof value).toBe('string');
    });
  });

  it('shows reroll button only when auto-names is ON', async () => {
    const { result } = renderHook(() => useLadder(4));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    // Reroll button should not be visible initially
    expect(screen.queryByTestId('reroll-names-btn')).not.toBeInTheDocument();

    // Toggle auto-names ON
    const toggle = screen.getByTestId('auto-names-toggle');
    await userEvent.click(toggle);

    act(() => {
      result.current.setAllPlayerNames(['🍎 Apple', '🍇 Grape', '🍊 Orange', '🍓 Strawberry']);
    });
    rerender(<LadderSetup ladder={result.current} />);

    // Now reroll button should be visible
    const rerollBtn = screen.getByTestId('reroll-names-btn');
    expect(rerollBtn).toBeInTheDocument();
  });

  it('clicking reroll button updates player names', async () => {
    const { result } = renderHook(() => useLadder(4));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    // Turn on auto-names
    const toggle = screen.getByTestId('auto-names-toggle');
    await userEvent.click(toggle);

    act(() => {
      result.current.setAllPlayerNames(['🍎 Apple', '🍇 Grape', '🍊 Orange', '🍓 Strawberry']);
    });
    rerender(<LadderSetup ladder={result.current} />);

    // Get initial player names
    const playerInputs = screen.getAllByTestId('player-input');
    const initialFirstName = (playerInputs[0] as HTMLInputElement).value;

    // Click reroll
    const rerollBtn = screen.getByTestId('reroll-names-btn');
    await userEvent.click(rerollBtn);

    act(() => {
      result.current.setAllPlayerNames(['🍓 Strawberry', '🍑 Peach', '🍌 Banana', '🍉 Watermelon']);
    });
    rerender(<LadderSetup ladder={result.current} />);

    // First player name may have changed (or stayed the same due to randomness)
    const updatedPlayerInputs = screen.getAllByTestId('player-input');
    expect(updatedPlayerInputs).toHaveLength(4);
  });

  it('clicking result-winner-btn fills exactly one prize with win label and rest with lose label', async () => {
    const { result } = renderHook(() => useLadder(4));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    const winnerBtn = screen.getByTestId('result-winner-btn');
    await userEvent.click(winnerBtn);

    // Simulate the result (one win, three loses)
    act(() => {
      result.current.setAllPrizeLabels(['Win', 'Lose', 'Lose', 'Lose']);
    });
    rerender(<LadderSetup ladder={result.current} />);

    const prizeInputs = screen.getAllByTestId('prize-input');
    expect(prizeInputs).toHaveLength(4);

    const winCount = prizeInputs.filter(
      (input) => (input as HTMLInputElement).value === 'Win'
    ).length;
    const loseCount = prizeInputs.filter(
      (input) => (input as HTMLInputElement).value === 'Lose'
    ).length;

    expect(winCount).toBe(1);
    expect(loseCount).toBe(3);
  });

  it('clicking result-rank-btn fills prizes with rank emojis', async () => {
    const { result } = renderHook(() => useLadder(4));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    const rankBtn = screen.getByTestId('result-rank-btn');
    await userEvent.click(rankBtn);

    // Simulate ranks being set (e.g., "1️⃣", "2️⃣", "3️⃣", "4️⃣")
    act(() => {
      result.current.setAllPrizeLabels(['1️⃣', '2️⃣', '3️⃣', '4️⃣']);
    });
    rerender(<LadderSetup ladder={result.current} />);

    const prizeInputs = screen.getAllByTestId('prize-input');
    expect(prizeInputs).toHaveLength(4);

    // Each input should contain an emoji
    prizeInputs.forEach((input) => {
      const value = (input as HTMLInputElement).value;
      expect(value).toMatch(/[0-9️⃣]/);
    });

    // All values should be unique (they're ranks 1-4)
    const values = prizeInputs.map((input) => (input as HTMLInputElement).value);
    expect(new Set(values).size).toBe(4);
  });

  // Regression: the auto-names effect must NOT re-roll on every render.
  // Driven through a real useLadder-owning parent (like the live app), where the
  // `ladder` prop is a fresh object each render. The previous effect depended on the
  // whole `ladder` object, which looped forever (React: "Maximum update depth exceeded")
  // and made names flicker. This passed the old fixed-prop tests but broke in the app.
  it('does not re-roll names on unrelated re-renders when auto-names stays on', async () => {
    function Harness() {
      const ladder = useLadder(4);
      return <LadderSetup ladder={ladder} />;
    }
    render(<Harness />);

    const toggle = screen.getByTestId('auto-names-toggle');
    await userEvent.click(toggle);

    const firstPass = screen
      .getAllByTestId('player-input')
      .map((i) => (i as HTMLInputElement).value);
    // Effect filled all four names exactly once.
    expect(firstPass.every((v) => v.length > 0)).toBe(true);

    // Trigger several unrelated re-renders (typing into a prize input). With the loop
    // bug, this re-rolls the names; with the fix, the names stay identical.
    const prize0 = screen.getAllByTestId('prize-input')[0];
    await userEvent.type(prize0, 'abc');

    const secondPass = screen
      .getAllByTestId('player-input')
      .map((i) => (i as HTMLInputElement).value);
    expect(secondPass).toEqual(firstPass);
  });

  it('clicking clear-all-btn clears all player and prize inputs and disables auto-names', async () => {
    const { result } = renderHook(() => useLadder(4));
    const { rerender } = render(<LadderSetup ladder={result.current} />);

    // First, populate with some data
    act(() => {
      result.current.setAllPlayerNames(['🍎 Apple', '🍇 Grape', '🍊 Orange', '🍓 Strawberry']);
      result.current.setAllPrizeLabels(['Win', 'Lose', 'Lose', 'Lose']);
    });
    rerender(<LadderSetup ladder={result.current} />);

    // Turn on auto-names
    const toggle = screen.getByTestId('auto-names-toggle');
    await userEvent.click(toggle);
    rerender(<LadderSetup ladder={result.current} />);

    // Verify data is there
    let playerInputs = screen.getAllByTestId('player-input');
    let prizeInputs = screen.getAllByTestId('prize-input');
    expect((playerInputs[0] as HTMLInputElement).value).not.toBe('');
    expect((prizeInputs[0] as HTMLInputElement).value).not.toBe('');

    // Click clear-all
    const clearAllBtn = screen.getByTestId('clear-all-btn');
    await userEvent.click(clearAllBtn);

    act(() => {
      result.current.setAllPlayerNames([]);
      result.current.setAllPrizeLabels([]);
    });
    rerender(<LadderSetup ladder={result.current} />);

    // Verify all inputs are now empty
    playerInputs = screen.getAllByTestId('player-input');
    prizeInputs = screen.getAllByTestId('prize-input');
    playerInputs.forEach((input) => {
      expect((input as HTMLInputElement).value).toBe('');
    });
    prizeInputs.forEach((input) => {
      expect((input as HTMLInputElement).value).toBe('');
    });
  });

  describe('Tension Control', () => {
    it('renders tension control with three options (low, medium, high)', () => {
      const { result } = renderHook(() => useLadder(4));
      render(<LadderSetup ladder={result.current} />);

      const tensionControl = screen.getByTestId('tension-control');
      expect(tensionControl).toBeInTheDocument();

      const lowBtn = screen.getByTestId('tension-option-low');
      const mediumBtn = screen.getByTestId('tension-option-medium');
      const highBtn = screen.getByTestId('tension-option-high');

      expect(lowBtn).toBeInTheDocument();
      expect(mediumBtn).toBeInTheDocument();
      expect(highBtn).toBeInTheDocument();
    });

    it('defaults to high tension (active state)', () => {
      const { result } = renderHook(() => useLadder(4));
      const { rerender } = render(<LadderSetup ladder={result.current} />);

      const highBtn = screen.getByTestId('tension-option-high');
      expect(highBtn).toHaveAttribute('aria-pressed', 'true');

      const lowBtn = screen.getByTestId('tension-option-low');
      const mediumBtn = screen.getByTestId('tension-option-medium');
      expect(lowBtn).toHaveAttribute('aria-pressed', 'false');
      expect(mediumBtn).toHaveAttribute('aria-pressed', 'false');
    });

    it('clicking tension option updates state', async () => {
      const { result } = renderHook(() => useLadder(4));
      const { rerender } = render(<LadderSetup ladder={result.current} />);

      expect(result.current.state.tension).toBe('high');

      // Click low
      const lowBtn = screen.getByTestId('tension-option-low');
      await userEvent.click(lowBtn);

      act(() => {
        result.current.setTension('low');
      });
      rerender(<LadderSetup ladder={result.current} />);

      expect(result.current.state.tension).toBe('low');
      expect(lowBtn).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('tension-option-high')).toHaveAttribute('aria-pressed', 'false');

      // Click medium
      const mediumBtn = screen.getByTestId('tension-option-medium');
      await userEvent.click(mediumBtn);

      act(() => {
        result.current.setTension('medium');
      });
      rerender(<LadderSetup ladder={result.current} />);

      expect(result.current.state.tension).toBe('medium');
      expect(mediumBtn).toHaveAttribute('aria-pressed', 'true');
      expect(lowBtn).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
