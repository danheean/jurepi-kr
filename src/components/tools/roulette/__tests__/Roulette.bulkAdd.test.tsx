import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@/__test__/test-utils';
import { Roulette } from '../Roulette';

/**
 * 옵션 일괄 추가 — 콤마 구분 입력 + 줄바꿈 목록 붙여넣기.
 * (옵션을 하나씩 넣기 힘들다는 실사용 피드백)
 */
describe('Roulette bulk add', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function mountRoulette() {
    const utils = render(<Roulette />);
    act(() => {
      vi.runAllTimers();
    });
    return utils;
  }

  function optionRowValues(): string[] {
    // 옵션 행 라벨 입력들 (aria-label "Add Option N")
    return screen
      .getAllByRole('textbox')
      .filter((el) => /Add Option \d+/.test(el.getAttribute('aria-label') || ''))
      .map((el) => (el as HTMLInputElement).value);
  }

  it('adds multiple options from a comma-separated entry', () => {
    mountRoulette();

    const input = screen.getByTestId('roulette-add-input');
    fireEvent.change(input, { target: { value: '자장면, 짬뽕, 치킨' } });
    fireEvent.click(screen.getByTestId('roulette-add-button'));

    expect(optionRowValues()).toEqual(['자장면', '짬뽕', '치킨']);
  });

  it('adds multiple options on Enter with commas', () => {
    mountRoulette();

    const input = screen.getByTestId('roulette-add-input');
    fireEvent.change(input, { target: { value: 'A, B, C, D' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: false });

    expect(optionRowValues()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('adds multiple options from a pasted newline-separated list', () => {
    mountRoulette();

    const input = screen.getByTestId('roulette-add-input');
    fireEvent.paste(input, {
      clipboardData: { getData: () => '자장면\n짬뽕\n치킨\n' },
    });

    expect(optionRowValues()).toEqual(['자장면', '짬뽕', '치킨']);
  });

  it('skips duplicates (within the entry and against existing options)', () => {
    mountRoulette();

    const input = screen.getByTestId('roulette-add-input');
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.click(screen.getByTestId('roulette-add-button'));

    fireEvent.change(input, { target: { value: 'A, B, b, C' } });
    fireEvent.click(screen.getByTestId('roulette-add-button'));

    expect(optionRowValues()).toEqual(['A', 'B', 'C']);
  });

  it('applies the current weight to every bulk-added option', () => {
    mountRoulette();

    const weightInput = screen.getByTestId('roulette-add-weight');
    fireEvent.change(weightInput, { target: { value: '3' } });

    const input = screen.getByTestId('roulette-add-input');
    fireEvent.change(input, { target: { value: 'A, B' } });
    fireEvent.click(screen.getByTestId('roulette-add-button'));

    const weights = screen
      .getAllByRole('spinbutton')
      .filter((el) => /Weight \d+/.test(el.getAttribute('aria-label') || ''))
      .map((el) => (el as HTMLInputElement).value);
    expect(weights).toEqual(['3', '3']);
  });

  it('clears the input after a successful paste bulk add', () => {
    mountRoulette();

    const input = screen.getByTestId('roulette-add-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '자장' } });
    fireEvent.paste(input, {
      clipboardData: { getData: () => 'A, B' },
    });

    expect(input.value).toBe('');
    expect(optionRowValues()).toEqual(['A', 'B']);
  });
});
