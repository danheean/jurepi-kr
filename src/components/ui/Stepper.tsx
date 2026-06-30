'use client';

interface StepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  step?: number;
  decrementLabel?: string;
  incrementLabel?: string;
}

export function Stepper({
  value,
  onValueChange,
  min = 1,
  max = 10,
  label,
  step = 1,
  decrementLabel = 'Decrease',
  incrementLabel = 'Increase',
}: StepperProps) {
  const isAtMin = value <= min;
  const isAtMax = value >= max;

  const handleMinus = () => {
    if (!isAtMin) onValueChange(value - step);
  };

  const handlePlus = () => {
    if (!isAtMax) onValueChange(value + step);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {label && <label className="text-text text-sm">{label}</label>}
      <div className="flex items-center gap-2 bg-surface rounded-lg p-2 border border-hairline">
        <button
          onClick={handleMinus}
          disabled={isAtMin}
          data-testid="stepper-decrement"
          className={`
            w-10 h-10 flex items-center justify-center rounded-md
            text-lg transition-all
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
            ${
              isAtMin
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-surface-muted active:scale-95'
            }
          `}
          aria-label={decrementLabel}
        >
          −
        </button>

        <div className="font-display text-headline text-text min-w-[2rem] text-center">
          {value}
        </div>

        <button
          onClick={handlePlus}
          disabled={isAtMax}
          data-testid="stepper-increment"
          className={`
            w-10 h-10 flex items-center justify-center rounded-md
            text-lg transition-all
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
            ${
              isAtMax
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-surface-muted active:scale-95'
            }
          `}
          aria-label={incrementLabel}
        >
          +
        </button>
      </div>
    </div>
  );
}
