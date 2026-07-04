'use client';

import { useMemo } from 'react';
import type { Option } from '@/lib/roulette/schema';
import type { SliceInfo } from '@/lib/roulette/geometry';
import { LEGEND_THRESHOLD, SPIN_DURATION_MS } from '@/lib/roulette/schema';

export interface WheelSVGProps {
  options: Option[];
  sliceGeometry: SliceInfo[];
  selectedIndex: number | null;
  spinning: boolean;
  finalAngle: number | null;
  prefersReducedMotion: boolean;
}

const RADIUS = 140;
const CENTER_RADIUS = 40;
const TICK_COUNT = 24;

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = degreesToRadians(angleInDegrees - 90); // -90 to align with top
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function arcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function getSliceColor(_index: number, _total: number): string {
  return `var(--accent-rose)`;
}

// rose 단일 정체성 + 인덱스별 틴트 변화(시각 분리), 인접 wrap은 스트로크가 보완
function getSliceOpacity(index: number): number {
  return 0.55 + (index % 3) * 0.18; // 0.55, 0.73, 0.91
}

export function WheelSVG({
  options,
  sliceGeometry,
  selectedIndex,
  spinning,
  finalAngle,
  prefersReducedMotion,
}: WheelSVGProps) {
  const showLegend = options.length > LEGEND_THRESHOLD;

  // Determine SVG size based on option count
  const viewBoxSize = showLegend ? 400 : 320;
  const center = viewBoxSize / 2;

  // Current rotation angle (for animation)
  const rotationAngle = useMemo(() => {
    if (spinning) {
      // Animate to final angle (CSS will handle this)
      return finalAngle ?? 0;
    }
    return finalAngle ?? 0;
  }, [spinning, finalAngle]);

  const spinDuration = prefersReducedMotion ? 0 : SPIN_DURATION_MS;
  const shouldAnimate = spinning && !prefersReducedMotion;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        data-testid="roulette-wheel"
        className="w-full max-w-[20rem]"
        style={{
          aspectRatio: '1',
        }}
      >
        {/* Rotating group for wheel slices and center label */}
        <g
          style={{
            transform: `rotate(${rotationAngle}deg)`,
            transformOrigin: `${center}px ${center}px`,
            transition: shouldAnimate
              ? `transform ${spinDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`
              : 'none',
          }}
        >
          {/* Render slices */}
          {sliceGeometry.map((slice, idx) => {
            const isSelected = idx === selectedIndex;
            const color = getSliceColor(idx, options.length);

            return (
              <g key={idx}>
                {/* Slice path */}
                <path
                  d={arcPath(center, center, RADIUS, slice.angle, slice.angle + slice.span)}
                  data-testid={`roulette-slice-${idx}`}
                  fill={color}
                  fillOpacity={isSelected ? 0.95 : getSliceOpacity(idx)}
                  stroke={isSelected ? 'var(--accent-rose)' : 'var(--surface)'}
                  strokeWidth={2}
                  className="transition-all duration-300"
                />

                {/* Slice label (text on the radius) */}
                {!showLegend && (
                  <text
                    x={center}
                    y={center}
                    transform={`rotate(${slice.midAngle} ${center} ${center})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    dy={-RADIUS + 20} // Position along radius, inward
                    className="text-xs font-semibold fill-text pointer-events-none"
                    style={{
                      fontSize: Math.max(
                        9,
                        Math.min(12, 120 / options.length)
                      ),
                    }}
                  >
                    <title>{options[idx]?.label}</title>
                    {/* Truncate long labels */}
                    {options[idx]?.label.length > 15
                      ? options[idx].label.substring(0, 12) + '…'
                      : options[idx]?.label}
                  </text>
                )}

                {/* Index number (for dense wheels) */}
                {showLegend && (
                  <text
                    x={center}
                    y={center}
                    transform={`rotate(${slice.midAngle} ${center} ${center})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    dy={-RADIUS + 20}
                    className="text-sm font-bold fill-text pointer-events-none"
                  >
                    {idx + 1}
                  </text>
                )}
              </g>
            );
          })}

          {/* Tick marks around edge */}
          {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const angle = (360 / TICK_COUNT) * i;
            const outer = polarToCartesian(center, center, RADIUS, angle);
            const inner = polarToCartesian(center, center, RADIUS - 8, angle);

            return (
              <line
                key={`tick-${i}`}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke="var(--text-secondary)"
                strokeWidth={1}
                opacity={0.5}
              />
            );
          })}

          {/* Center circle (background for center label) */}
          <circle
            cx={center}
            cy={center}
            r={CENTER_RADIUS}
            fill="var(--surface)"
            stroke="var(--hairline)"
            strokeWidth={1}
          />

          {/* Center label (winner name, non-rotating) */}
          {selectedIndex !== null && options[selectedIndex] && (
            <text
              x={center}
              y={center}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-bold fill-text pointer-events-none"
              style={{
                fontSize: '16px',
              }}
            >
              <title>{options[selectedIndex].label}</title>
              {options[selectedIndex].label.length > 10
                ? options[selectedIndex].label.substring(0, 9) + '…'
                : options[selectedIndex].label}
            </text>
          )}
        </g>

        {/* Pointer indicator at top (non-rotating) */}
        <g transform={`translate(${center}, 10)`}>
          <polygon points="0,-8 -6,0 6,0" fill="var(--accent-rose)" />
        </g>
      </svg>

      {/* Legend (for dense wheels) */}
      {showLegend && (
        <div className="w-full max-w-[20rem] text-sm space-y-1 px-4 max-h-32 overflow-y-auto" data-testid="roulette-legend">
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2 text-text-secondary" data-testid={`roulette-legend-item-${idx}`}>
              <span className="font-semibold w-4">{idx + 1}.</span>
              <span className="truncate" title={opt.label}>
                {opt.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
