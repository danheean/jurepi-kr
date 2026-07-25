'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCharades } from './useCharades';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { DeckBrowser } from './DeckBrowser';
import { GameSetup } from './GameSetup';
import { GameBoard } from './GameBoard';
import { GameSummary } from './GameSummary';

/**
 * Orchestrator component: owns useCharades() and renders by phase.
 * Manages global keyboard shortcuts (active only in playing phase).
 */
export function Charades() {
  const t = useTranslations('tools.charades');
  const quiz = useCharades();
  const reducedMotion = useReducedMotion();
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global keyboard shortcuts (active only in playing phase, disabled when search focused)
  useEffect(() => {
    if (quiz.phase !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if typing in search input
      if (document.activeElement === inputRef.current) return;

      switch (e.code) {
        case 'Space': {
          e.preventDefault();
          quiz.markCorrect();
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          quiz.markPass();
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (quiz.canUndo) {
            quiz.undo();
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          quiz.endGame();
          break;
        }
        case 'Slash': {
          if (e.shiftKey) {
            e.preventDefault();
            setShowHelp(!showHelp);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quiz, showHelp]);

  if (!quiz.mounted) {
    return null; // Hydration guard
  }

  // Render by phase
  if (quiz.phase === 'browse') {
    return <DeckBrowser quiz={quiz} inputRef={inputRef as React.RefObject<HTMLInputElement>} />;
  }

  if (quiz.phase === 'setup') {
    return (
      <GameSetup
        deck={quiz.selectedDeck}
        settings={quiz.settings}
        onSetting={quiz.setSetting}
        onStart={quiz.startGame}
        onCancel={quiz.cancelSetup}
      />
    );
  }

  if (quiz.phase === 'playing') {
    return (
      <>
        <GameBoard
          word={quiz.currentWord?.term || ''}
          hint={quiz.currentWord?.hint}
          showHint={quiz.settings.showHints}
          index={quiz.index}
          total={quiz.total}
          timerMs={quiz.timerMs}
          roundTimeMs={quiz.roundTimeMs}
          score={quiz.score}
          canUndo={quiz.canUndo}
          reducedMotion={reducedMotion}
          onCorrect={quiz.markCorrect}
          onPass={quiz.markPass}
          onUndo={quiz.undo}
          onEnd={quiz.endGame}
          labels={{
            correct: t('board.correct'),
            pass: t('board.pass'),
            undo: t('board.undo'),
            end: t('board.end'),
            correctScore: t('board.correctScore', { count: quiz.score.correct }),
            passScore: t('board.passScore', { count: quiz.score.pass }),
            hintLabel: t('board.hintLabel'),
            // Raw ICU template ("{current} / {total}"); GameBoard fills placeholders.
            of: t.raw('board.of') as string,
            noTalking: t('board.noTalking'),
          }}
        />
        {/* Keyboard help overlay */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-surface rounded-lg p-6 max-w-[32rem] border border-hairline shadow-pop">
              <h2 className="text-lg font-bold mb-4 text-text">{t('keyboard.title')}</h2>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>
                  <strong className="text-text">Space:</strong> {t('keyboard.space')}
                </li>
                <li>
                  <strong className="text-text">→:</strong> {t('keyboard.pass')}
                </li>
                <li>
                  <strong className="text-text">←:</strong> {t('keyboard.undo')}
                </li>
                <li>
                  <strong className="text-text">Esc:</strong> {t('keyboard.end')}
                </li>
                <li>
                  <strong className="text-text">? / Shift+/:</strong> {t('keyboard.help')}
                </li>
              </ul>
              <button
                onClick={() => setShowHelp(false)}
                className="mt-4 w-full px-4 py-2 bg-brand text-on-brand rounded-lg font-semibold hover:bg-brand-strong transition-colors"
              >
                {t('keyboard.close')}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (quiz.phase === 'summary') {
    return (
      <GameSummary
        outcome={quiz.outcome}
        score={quiz.score}
        words={quiz.summaryWords}
        onReplay={() => {
          quiz.openSetup(quiz.selectedDeck?.slug || '');
        }}
        onHome={quiz.goHome}
        labels={{
          titleDone: t('summary.titleDone'),
          titleTimeout: t('summary.titleTimeout'),
          correct: t('summary.correct', { count: quiz.score.correct }),
          pass: t('summary.pass', { count: quiz.score.pass }),
          timeout: t('summary.timeout', { count: quiz.score.timeout }),
          results: t('summary.results'),
          replay: t('summary.replay'),
          home: t('summary.home'),
        }}
      />
    );
  }

  return null;
}
