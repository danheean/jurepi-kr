import { useTranslations } from 'next-intl';

interface ProgressChipProps {
  currentStreak: number;
  totalAnswered: number;
  yearCompletion: { answered: number; elapsed: number };
}

export function ProgressChip({
  currentStreak,
  totalAnswered,
  yearCompletion,
}: ProgressChipProps) {
  const t = useTranslations('tools.qna-a-day');

  const { answered, elapsed } = yearCompletion;
  const progressPercent = elapsed > 0 ? (answered / elapsed) * 100 : 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex items-center justify-center gap-6 mb-8 py-6">
      {/* Progress Ring */}
      <div className="relative w-24 h-24" role="img" aria-label={t('stats.ringAria', { answered, elapsed })}>
        <svg className="w-full h-full" viewBox="0 0 120 120">
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-surface-sunken"
          />
          {/* Progress */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-accent-grape transition-all"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xs text-text-secondary">{answered}</div>
          <div className="text-sm font-bold text-text leading-none">/</div>
          <div className="text-xs text-text-secondary">{elapsed}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        {/* Streak */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <span className="text-body font-medium">
            {t('stats.streak', { count: currentStreak })}
          </span>
        </div>

        {/* Total */}
        <div className="text-body text-text-secondary">
          {t('stats.total', { count: totalAnswered })}
        </div>
      </div>
    </div>
  );
}
