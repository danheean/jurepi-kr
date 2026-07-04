import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface PreviewCanvasProps {
  resultCanvas?: HTMLCanvasElement;
  isProcessing?: boolean;
  sourceWidth?: number | null;
  sourceHeight?: number | null;
}

export function PreviewCanvas({
  resultCanvas,
  isProcessing,
  sourceWidth,
  sourceHeight,
}: PreviewCanvasProps) {
  const t = useTranslations('tools.transparent-background');
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render result canvas to display canvas
  useEffect(() => {
    if (!resultCanvas || !canvasRef.current) return;

    const displayCtx = canvasRef.current.getContext('2d');
    if (!displayCtx) return;

    canvasRef.current.width = resultCanvas.width;
    canvasRef.current.height = resultCanvas.height;

    // Draw checkerboard background
    const checkerSize = 8;
    const checkColor1 = '#e5e7eb';
    const checkColor2 = '#ffffff';

    for (let y = 0; y < canvasRef.current.height; y += checkerSize) {
      for (let x = 0; x < canvasRef.current.width; x += checkerSize) {
        const isEven = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0;
        displayCtx.fillStyle = isEven ? checkColor1 : checkColor2;
        displayCtx.fillRect(x, y, checkerSize, checkerSize);
      }
    }

    // Draw the result image on top
    displayCtx.drawImage(resultCanvas, 0, 0);
  }, [resultCanvas]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text">
        {t('preview.label')}
      </label>

      <div
        ref={containerRef}
        className="relative flex items-center justify-center overflow-auto rounded-lg border border-hairline bg-surface"
        style={{ maxWidth: '100%', maxHeight: '400px' }}
      >
        {resultCanvas ? (
          <canvas
            ref={canvasRef}
            className="block max-h-full max-w-full"
            style={{ imageRendering: 'crisp-edges' }}
            role="img"
            aria-label={t('preview.resultAlt')}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            {isProcessing ? (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-sky-soft border-t-accent-sky" />
                <p className="text-sm text-text-secondary">{t('preview.detecting')}</p>
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                {t('preview.empty')}
              </p>
            )}
          </div>
        )}
      </div>

      {sourceWidth && sourceHeight && (
        <div className="text-xs text-text-secondary">
          {t('preview.dimensions', {
            width: sourceWidth,
            height: sourceHeight,
          })}
        </div>
      )}
    </div>
  );
}
