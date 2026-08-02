'use client';

interface ColorPaletteProps {
  hexes: string[];
  size?: 'sm' | 'md';
}

/** Row of color swatches. Colors come from data (inline style hex — not design tokens). */
export function ColorPalette({ hexes, size = 'md' }: ColorPaletteProps) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  return (
    <div className="flex items-center gap-2">
      {hexes.map((hex, i) => (
        <span
          key={`${hex}-${i}`}
          className={`${dim} rounded-full border border-hairline shrink-0`}
          style={{ background: hex }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
