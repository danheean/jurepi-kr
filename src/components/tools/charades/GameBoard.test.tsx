import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameBoard } from './GameBoard';

const mockLabels = {
  correct: '정답',
  pass: '패스',
  undo: '되돌리기',
  end: '끝내기',
  correctScore: '정답: {count}',
  passScore: '패스: {count}',
  hintLabel: '힌트',
  of: '{current} / {total}',
  noTalking: '말하지 마세요!',
};

function renderGameBoard(overrides = {}) {
  const defaultProps = {
    word: '코끼리',
    hint: '긴 코를 가진 큰 동물',
    showHint: true,
    index: 0,
    total: 10,
    timerMs: 30000,
    roundTimeMs: 30000,
    score: { correct: 2, pass: 1 },
    canUndo: true,
    reducedMotion: false,
    onCorrect: vi.fn(),
    onPass: vi.fn(),
    onUndo: vi.fn(),
    onEnd: vi.fn(),
    labels: mockLabels,
    ...overrides,
  };

  return render(<GameBoard {...defaultProps} />);
}

describe('GameBoard', () => {
  it('renders the prompt word in large, bold font', () => {
    renderGameBoard({ word: '캥거루' });
    const wordEl = screen.getByText('캥거루');
    expect(wordEl).toBeInTheDocument();
    expect(wordEl).toHaveClass('font-bold');
  });

  it('renders the "no talking" reminder badge', () => {
    renderGameBoard();
    expect(screen.getByTestId('game-no-talking-badge')).toHaveTextContent('말하지 마세요!');
  });

  it('renders the countdown timer', () => {
    renderGameBoard({ timerMs: 15000 });
    expect(screen.getByTestId('game-timer')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows the performer-only hint when showHint is true', () => {
    renderGameBoard({ hint: '다리가 여덟 개예요', showHint: true });
    expect(screen.getByText(/다리가 여덟 개예요/)).toBeInTheDocument();
  });

  it('hides the hint when showHint is false', () => {
    renderGameBoard({ hint: '다리가 여덟 개예요', showHint: false });
    expect(screen.queryByText(/다리가 여덟 개예요/)).not.toBeInTheDocument();
  });

  it('calls onCorrect when the correct button is clicked', async () => {
    const user = userEvent.setup();
    const onCorrect = vi.fn();
    renderGameBoard({ onCorrect });
    await user.click(screen.getByTestId('game-correct'));
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it('calls onPass when the pass button is clicked', async () => {
    const user = userEvent.setup();
    const onPass = vi.fn();
    renderGameBoard({ onPass });
    await user.click(screen.getByTestId('game-pass'));
    expect(onPass).toHaveBeenCalledOnce();
  });

  it('disables undo when canUndo is false', () => {
    renderGameBoard({ canUndo: false });
    expect(screen.getByTestId('game-undo')).toBeDisabled();
  });

  it('renders word progress indicator', () => {
    renderGameBoard({ index: 2, total: 10 });
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('renders the score tally', () => {
    renderGameBoard({ score: { correct: 5, pass: 2 } });
    expect(screen.getByText('정답: 5')).toBeInTheDocument();
    expect(screen.getByText('패스: 2')).toBeInTheDocument();
  });
});
