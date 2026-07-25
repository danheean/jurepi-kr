import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameSummary, type WordResult } from './GameSummary';

const mockLabels = {
  titleDone: '게임 끝!',
  titleTimeout: '시간 초과',
  correct: '정답 {count}개',
  pass: '패스 {count}개',
  timeout: '시간초과 {count}개',
  results: '결과',
  replay: '다시 하기',
  home: '홈으로',
};

const mockWords: WordResult[] = [
  { term: '코끼리', result: 'correct' },
  { term: '캥거루', result: 'pass' },
  { term: '펭귄', result: 'timeout' },
];

function renderGameSummary(overrides = {}) {
  const defaultProps = {
    outcome: 'done' as const,
    score: { correct: 7, pass: 2, timeout: 1 },
    words: mockWords,
    onReplay: vi.fn(),
    onHome: vi.fn(),
    labels: mockLabels,
    ...overrides,
  };

  return render(<GameSummary {...defaultProps} />);
}

describe('GameSummary', () => {
  it('renders the correct title when outcome is "done"', () => {
    renderGameSummary({ outcome: 'done' });
    expect(screen.getByText('게임 끝!')).toBeInTheDocument();
  });

  it('renders the timeout title when outcome is "timeout"', () => {
    renderGameSummary({ outcome: 'timeout' });
    expect(screen.getByText('시간 초과')).toBeInTheDocument();
  });

  it('displays the correct/pass/timeout score counts', () => {
    renderGameSummary({ score: { correct: 7, pass: 2, timeout: 1 } });
    expect(screen.getByText('정답 7개')).toBeInTheDocument();
    expect(screen.getByText('패스 2개')).toBeInTheDocument();
    expect(screen.getByText('시간초과 1개')).toBeInTheDocument();
  });

  it('renders word-by-word results list', () => {
    const { container } = renderGameSummary({ words: mockWords });
    const resultsSection = container.querySelectorAll('.space-y-2')[0];
    expect(resultsSection.textContent).toContain('코끼리');
    expect(resultsSection.textContent).toContain('캥거루');
    expect(resultsSection.textContent).toContain('펭귄');
  });

  it('renders result icons correctly', () => {
    const { container } = renderGameSummary({ words: mockWords });
    const content = container.textContent;
    expect(content).toContain('✓');
    expect(content).toContain('✗');
    expect(content).toContain('·');
  });

  it('renders Replay button that calls onReplay when clicked', async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();
    renderGameSummary({ onReplay });
    await user.click(screen.getByRole('button', { name: /다시 하기/ }));
    expect(onReplay).toHaveBeenCalledOnce();
  });

  it('renders Home button that calls onHome when clicked', async () => {
    const user = userEvent.setup();
    const onHome = vi.fn();
    renderGameSummary({ onHome });
    await user.click(screen.getByRole('button', { name: /홈으로/ }));
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('handles empty word list gracefully', () => {
    renderGameSummary({ words: [] });
    expect(screen.getByText('결과')).toBeInTheDocument();
  });

  it('does not render the same words twice', () => {
    const { container } = renderGameSummary({ words: mockWords });
    const occurrences = container.textContent?.split('코끼리').length! - 1;
    expect(occurrences).toBe(1);
  });
});
