'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check } from 'lucide-react';
import { BallDisplay } from './BallDisplay';
import { formatGamesPlaintext } from '@/lib/lotto-generator/format';
import type { Draw } from '@/lib/lotto-generator/schema';
import type { AnimationPhase } from './useLottoGenerator';

interface GameListProps {
  games: Draw[];
  animationPhase: AnimationPhase;
}

export function GameList({ games, animationPhase }: GameListProps) {
  const t = useTranslations('tools.lotto-generator');
  const [copied, setCopied] = useState(false);

  const handleCopyAll = useCallback(async () => {
    if (games.length === 0) return;

    const plaintext = formatGamesPlaintext(games, (i) =>
      t('results.gameLabel', { count: i + 1 })
    );

    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback to textarea copy
      const textarea = document.createElement('textarea');
      textarea.value = plaintext;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [games, t]);

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">{t('results.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('results.title')}</h2>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors"
          aria-label={copied ? t('buttons.copied') : t('buttons.copyAll')}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-sm">{t('buttons.copied')}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm">{t('buttons.copyAll')}</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {games.map((game, gameIdx) => (
          <div key={gameIdx} className="p-4 rounded-lg bg-surface-sunken border border-hairline">
            <h3 className="text-sm font-medium mb-3 text-text">
              {t('results.gameLabel', { count: gameIdx + 1 })}
            </h3>
            <div className="flex flex-wrap gap-2">
              {game.map((num, ballIdx) => (
                <BallDisplay
                  key={`${gameIdx}-${ballIdx}`}
                  number={num}
                  index={ballIdx}
                  isAnimating={animationPhase !== 'idle' && animationPhase !== 'done'}
                  animationPhase={animationPhase}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
