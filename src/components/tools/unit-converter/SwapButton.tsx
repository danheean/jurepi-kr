'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRightLeft } from 'lucide-react';

interface Props {
  fromUnit: string;
  toUnit: string;
  onClick: () => void;
}

/**
 * SwapButton: Flip from/to units with rotate animation.
 */
export function SwapButton({ fromUnit, toUnit, onClick }: Props) {
  const t = useTranslations('tools.unit-converter');
  const [isRotating, setIsRotating] = useState(false);

  const handleClick = () => {
    setIsRotating(true);
    onClick();
    setTimeout(() => setIsRotating(false), 200);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={t('buttons.swap')}
      title={t('buttons.swap')}
      className={`
        p-3 rounded-lg border-2 border-hairline hover:border-accent-sky
        bg-surface hover:bg-accent-sky-soft
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
        flex items-center justify-center
        min-h-[44px] min-w-[44px]
      `}
      style={{
        transform: isRotating ? 'rotate(180deg) scale(0.95)' : 'rotate(0deg)',
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <ArrowRightLeft
        size={18}
        className="text-text-secondary"
        style={{
          transform: isRotating ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'none',
        }}
      />
    </button>
  );
}
