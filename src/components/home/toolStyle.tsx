import type { AccentColor } from '@/tools/types';
import type { LucideIcon } from 'lucide-react';
import {
  Binary,
  BookA,
  BookOpen,
  Bookmark,
  Braces,
  Cake,
  CalendarSync,
  Clock,
  Eraser,
  Globe,
  Link,
  ListTree,
  MapPin,
  NotebookPen,
  QrCode,
  Replace,
  RotateCcw,
  Ruler,
  Trophy,
  Type,
  Users,
  Zap,
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
 * Map accent color to the Tailwind text class for a tool-page eyebrow label.
 * Uses the darker `-ink` variant for AA contrast on light surfaces. Shared by
 * `ToolIntro` so every tool's eyebrow is colored by its category accent.
 */
export function accentEyebrowClass(accent: AccentColor): string {
  const map: Record<AccentColor, string> = {
    coral: 'text-accent-coral-ink',
    mint: 'text-accent-mint-ink',
    sky: 'text-accent-sky-ink',
    sun: 'text-accent-sun-ink',
    grape: 'text-accent-grape-ink',
    rose: 'text-accent-rose-ink',
  };
  return map[accent];
}

/**
 * Lucide icon name → component. Explicit map (tree-shake friendly) covering
 * every `icon` referenced in the tool registry, so no tool silently regresses
 * to the generic Wrench. `toolStyle.test.tsx` asserts registry ↔ map parity, so
 * a new tool with an unmapped icon fails CI instead of shipping a wrench.
 * `Wrench` stays as a defensive fallback only.
 */
export const TOOL_ICONS: Record<string, LucideIcon> = {
  Binary,
  BookA,
  BookOpen,
  Bookmark,
  Braces,
  Cake,
  CalendarSync,
  Clock,
  Eraser,
  Globe,
  Link,
  ListTree,
  MapPin,
  NotebookPen,
  QrCode,
  Replace,
  RotateCcw,
  Ruler,
  Trophy,
  Type,
  Users,
  Zap,
};

export function ToolIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}): React.ReactNode {
  const Icon = TOOL_ICONS[name] ?? Wrench;
  return (
    <Icon
      className={className || 'w-6 h-6'}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}
