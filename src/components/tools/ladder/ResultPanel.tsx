'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { selectMapping } from '@/lib/ladder-reducer';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import type { UseLadderReturn } from './useLadder';

const ACCENT_COLORS = [
  'coral',
  'mint',
  'sky',
  'sun',
  'grape',
  'rose',
];

interface ResultPanelProps {
  ladder: UseLadderReturn;
}

export function ResultPanel({ ladder }: ResultPanelProps) {
  const t = useTranslations('tools.ladder');
  const [showToast, setShowToast] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Action panel (reveal-all / reshuffle / reset) is available as soon as a ladder
  // is built — and stays available after "다시 섞기" clears reveals. Only setup hides it.
  if (ladder.state.phase === 'setup') return null;

  // Copy stays gated so hidden results can't leak before any reveal.
  const canCopy =
    ladder.state.revealed.length > 0 || !ladder.state.hideResults;

  const mapping = selectMapping(ladder.state);
  const resultText = ladder.state.players
    .map((player) => {
      const prizeId = mapping[player.id];
      const prize = ladder.state.prizes.find((p) => p.id === prizeId);
      return `${player.name || t('defaults.player', { n: ladder.state.players.indexOf(player) + 1 })} → ${
        prize?.label || t('defaults.prizeOther')
      }`;
    })
    .join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setShowToast(true);
    } catch {
      setShowCopyModal(true);
    }
  };

  const handleRevealAll = () => {
    if (ladder.state.phase !== 'done') {
      ladder.revealAll();
    }
  };

  return (
    <div className="space-y-4 p-4" role="region" aria-live="polite">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="secondary"
          onClick={handleRevealAll}
          disabled={ladder.state.phase === 'done'}
        >
          {t('panel.revealAll')}
        </Button>

        <Button variant="secondary" onClick={ladder.reshuffle}>
          {t('panel.reshuffle')}
        </Button>

        <Button variant="secondary" onClick={ladder.reset}>
          {t('panel.reset')}
        </Button>

        {canCopy && (
          <Button variant="secondary" onClick={handleCopy}>
            {t('panel.copy')}
          </Button>
        )}
      </div>

      {/* Sound toggle */}
      <div className="py-2">
        <Toggle
          checked={ladder.state.soundOn}
          onChange={ladder.toggleSound}
          label={ladder.state.soundOn ? t('panel.soundOn') : t('panel.soundOff')}
        />
      </div>

      {/* Summary (phase = done) */}
      {ladder.state.phase === 'done' && (
        <div className="bg-surface-muted rounded-lg p-4" data-testid="result-summary">
          <h3 className="font-card-title text-text mb-3">
            {t('panel.summaryTitle')}
          </h3>
          <div className="space-y-2">
            {ladder.state.players.map((player, idx) => {
              const prizeId = mapping[player.id];
              const prize = ladder.state.prizes.find(
                (p) => p.id === prizeId
              );
              const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];

              return (
                <div
                  key={player.id}
                  className="flex items-center gap-2 font-body text-text"
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-accent-${accentColor}`}
                  />
                  <span className="flex-1">
                    {player.name || t('defaults.player', { n: idx + 1 })}
                  </span>
                  <span className="text-text-secondary">→</span>
                  <span className="font-button">
                    {prize?.label || t('defaults.prizeOther')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Copy fallback modal */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        title={t('panel.copy')}
        footer={
          <Button
            variant="secondary"
            onClick={() => setShowCopyModal(false)}
            className="w-full"
          >
            Close
          </Button>
        }
      >
        <textarea
          value={resultText}
          readOnly
          className="w-full h-32 p-2 rounded border border-hairline bg-surface text-text font-body text-sm"
        />
      </Modal>

      <Toast
        message={t('panel.copied')}
        type="success"
        duration={2000}
        open={showToast}
        onDismiss={() => setShowToast(false)}
      />
    </div>
  );
}
