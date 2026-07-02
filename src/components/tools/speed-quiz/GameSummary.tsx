'use client';

export type GameOutcome = 'done' | 'timeout';

export interface WordResult {
  term: string;
  result: 'correct' | 'pass' | 'timeout' | 'unrevealed';
}

export interface GameSummaryProps {
  outcome: GameOutcome;
  score: {
    correct: number;
    pass: number;
    timeout: number;
  };
  words: WordResult[];
  onReplay: () => void;
  onHome: () => void;
  labels: {
    titleDone: string;
    titleTimeout: string;
    correct: string;
    pass: string;
    timeout: string;
    results: string;
    wordList: string;
    replay: string;
    home: string;
  };
}

function getResultIcon(result: WordResult['result']): string {
  switch (result) {
    case 'correct':
      return '✓';
    case 'pass':
      return '✗';
    case 'timeout':
      return '·';
    case 'unrevealed':
      return '?';
    default:
      return '?';
  }
}

function getResultColorClass(result: WordResult['result']): string {
  switch (result) {
    case 'correct':
      return 'text-success';
    case 'pass':
      return 'text-danger';
    case 'timeout':
      return 'text-warning';
    case 'unrevealed':
      return 'text-text-muted';
    default:
      return 'text-text-muted';
  }
}

export function GameSummary({
  outcome,
  score,
  words,
  onReplay,
  onHome,
  labels,
}: GameSummaryProps) {
  const title = outcome === 'done' ? labels.titleDone : labels.titleTimeout;

  // Score lines with dynamic labels
  const correctLabel = labels.correct.replace('{count}', String(score.correct));
  const passLabel = labels.pass.replace('{count}', String(score.pass));
  const timeoutLabel = labels.timeout.replace('{count}', String(score.timeout));

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto p-6 md:p-8 flex flex-col" data-testid="game-summary">
      {/* Headline */}
      <h2 className="font-display text-3xl md:text-4xl font-bold text-text mb-8">
        {title}
      </h2>

      {/* Score card */}
      <div className="bg-surface shadow-card rounded-lg border border-hairline p-6 md:p-8 mb-8 space-y-4">
        <div className="text-center">
          <p className="text-5xl md:text-6xl font-bold text-brand mb-2">
            {score.correct}
          </p>
          <p className="text-lg text-text-secondary">{correctLabel}</p>
        </div>
        <div className="text-center border-t border-hairline pt-4">
          <p className="text-4xl font-bold text-text-secondary mb-2">{score.pass}</p>
          <p className="text-base text-text-muted">{passLabel}</p>
        </div>
        {score.timeout > 0 && (
          <div className="text-center border-t border-hairline pt-4">
            <p className="text-4xl font-bold text-warning mb-2">{score.timeout}</p>
            <p className="text-base text-text-muted">{timeoutLabel}</p>
          </div>
        )}
      </div>

      {/* Word-by-word results */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg text-text mb-4">{labels.results}</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {words.map((word, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg bg-surface-muted hover:bg-surface-sunken transition-colors"
            >
              <span className={`text-xl font-bold ${getResultColorClass(word.result)}`}>
                {getResultIcon(word.result)}
              </span>
              <span className="text-text">{word.term}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full word list */}
      <div className="mb-12">
        <h3 className="font-semibold text-lg text-text mb-4">{labels.wordList}</h3>
        <div className="space-y-1 text-text-secondary text-sm max-h-40 overflow-y-auto">
          {words.map((word, idx) => (
            <p key={idx}>{word.term}</p>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-auto">
        <button
          onClick={onReplay}
          className="py-3 md:py-4 px-6 rounded-lg font-bold text-base md:text-lg bg-brand text-on-brand hover:bg-brand-strong transition-all active:scale-95 focus-visible:outline-offset-2"
          data-testid="summary-replay"
        >
          {labels.replay}
        </button>
        <button
          onClick={onHome}
          className="py-3 md:py-4 px-6 rounded-lg font-bold text-base md:text-lg bg-surface-muted text-text hover:bg-surface-sunken transition-all active:scale-95 focus-visible:outline-offset-2"
          data-testid="summary-home"
        >
          {labels.home}
        </button>
      </div>
    </div>
  );
}
