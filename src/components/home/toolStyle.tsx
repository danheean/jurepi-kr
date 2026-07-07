import type { AccentColor } from '@/tools/types';
import {
  ListTree,
  Dices,
  Type,
  Ruler,
  Percent,
  Timer,
  CalendarDays,
  NotebookPen,
  Replace,
  Wrench,
} from 'lucide-react';

/**
 * Map accent color to Tailwind bg + text classes for icon tiles.
 */
export function accentTileClass(accent: AccentColor): {
  bg: string;
  text: string;
} {
  const map: Record<AccentColor, { bg: string; text: string }> = {
    coral: { bg: 'bg-accent-coral-soft', text: 'text-accent-coral' },
    mint: { bg: 'bg-accent-mint-soft', text: 'text-accent-mint' },
    sky: { bg: 'bg-accent-sky-soft', text: 'text-accent-sky' },
    sun: { bg: 'bg-accent-sun-soft', text: 'text-accent-sun' },
    grape: { bg: 'bg-accent-grape-soft', text: 'text-accent-grape' },
    rose: { bg: 'bg-accent-rose-soft', text: 'text-accent-rose' },
  };
  return map[accent];
}

/**
 * Lucide icon name → React component. Tree-shake friendly (explicit map).
 * Fallback to Wrench if icon not found.
 */
export function ToolIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}): React.ReactNode {
  const iconMap: Record<string, React.ComponentType<any>> = {
    ListTree,
    Dices,
    Type,
    Ruler,
    Percent,
    Timer,
    CalendarDays,
    NotebookPen,
    Replace,
  };
  const Icon = iconMap[name] || Wrench;
  return (
    <Icon
      className={className || 'w-6 h-6'}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}
