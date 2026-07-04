import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import type { RGB } from '@/lib/transparent-background';

interface EyedropperCursorProps {
  isActive: boolean;
  imageCanvas?: HTMLCanvasElement;
  onColorSampled: (rgb: RGB) => void;
  onCancel: () => void;
}

function sampleColorAt(imageCanvas: HTMLCanvasElement, clientX: number, clientY: number): RGB | null {
  const rect = imageCanvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  if (x < 0 || x >= rect.width || y < 0 || y >= rect.height) return null;

  const ctx = imageCanvas.getContext('2d');
  if (!ctx) return null;

  // Scale coordinates to canvas resolution
  const scaleX = imageCanvas.width / rect.width;
  const scaleY = imageCanvas.height / rect.height;
  const canvasX = Math.floor(x * scaleX);
  const canvasY = Math.floor(y * scaleY);

  const data = ctx.getImageData(canvasX, canvasY, 1, 1).data;
  return { r: data[0], g: data[1], b: data[2] };
}

export function EyedropperCursor({
  isActive,
  imageCanvas,
  onColorSampled,
  onCancel,
}: EyedropperCursorProps) {
  const t = useTranslations('tools.transparent-background');
  const [hoveredColor, setHoveredColor] = useState<RGB | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isActive || !imageCanvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = imageCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x < rect.width && y >= 0 && y < rect.height) {
        setMousePos({ x, y });
        setHoveredColor(sampleColorAt(imageCanvas, e.clientX, e.clientY));
      }
    };

    // Sample directly at the event's own coordinates rather than relying on a
    // prior `mousemove` — touch devices tap without ever firing `mousemove`,
    // so gating on `hoveredColor` left the eyedropper permanently inert on mobile.
    const handleClick = (e: MouseEvent) => {
      const color = sampleColorAt(imageCanvas, e.clientX, e.clientY);
      if (color) {
        onColorSampled(color);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isActive, imageCanvas, onColorSampled, onCancel]);

  if (!isActive) {
    return null;
  }

  const handleCancelClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Stop this click from reaching the document-level sampler above —
    // otherwise cancelling would also sample whatever is under the button.
    e.stopPropagation();
    onCancel();
  };

  return (
    <>
      {/* Mode banner: always visible while active, independent of pointer
          hover — the only affordance touch/keyboard users have to know the
          mode is on and to get out of it. */}
      <div
        role="status"
        aria-live="polite"
        className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-hairline-strong bg-surface px-4 py-2 shadow-lg"
      >
        <span className="text-sm font-medium text-text">{t('colorPicker.eyedropperActive')}</span>
        <button
          type="button"
          onClick={handleCancelClick}
          className="flex min-h-[32px] min-w-[32px] items-center justify-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-text transition-colors hover:bg-hairline-strong"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {t('colorPicker.eyedropperCancel')}
        </button>
      </div>

      {/* Global crosshair cursor */}
      <div
        className="pointer-events-none fixed z-50"
        style={{
          cursor: 'crosshair',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
        }}
      />

      {/* Color preview circle at cursor (mouse-hover only; touch has no hover phase) */}
      {mousePos && hoveredColor && (
        <div
          className="pointer-events-none fixed z-50 rounded-full border-2 border-white shadow-lg"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            width: '24px',
            height: '24px',
            backgroundColor: `rgb(${hoveredColor.r}, ${hoveredColor.g}, ${hoveredColor.b})`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </>
  );
}
