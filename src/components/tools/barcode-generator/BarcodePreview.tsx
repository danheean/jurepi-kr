'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { EncodedBarcode, BarcodeErrorCode } from '@/lib/barcode-generator';

interface BarcodePreviewProps {
  encoded: EncodedBarcode | null;
  width: number;
  isLoading: boolean;
  error: BarcodeErrorCode | null;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

const ASPECT_RATIO = 0.5; // Standard barcode aspect ratio (width : height = 2:1)
const TEXT_SPACE_PX = 20; // Reserved height below bars for the human-readable line

export function BarcodePreview({
  encoded,
  width,
  isLoading,
  error,
  canvasRef,
}: BarcodePreviewProps) {
  const t = useTranslations('tools.barcode-generator');
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const actualCanvasRef = canvasRef || internalCanvasRef;

  useEffect(() => {
    const canvas = actualCanvasRef.current;
    if (!canvas || !encoded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = encoded.bars;
    const numBars = bars.length;
    const hasText = Boolean(encoded.textContent);

    // Canvas width matches the user's chosen width (same value passed to
    // encodeBarcode's options.width, so PNG and SVG stay in sync).
    const canvasWidth = width;
    const barsHeight = Math.round(canvasWidth * ASPECT_RATIO);
    const canvasHeight = hasText ? barsHeight + TEXT_SPACE_PX : barsHeight;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw bars
    ctx.fillStyle = '#000000';
    const barPixelWidth = canvasWidth / numBars;

    for (let i = 0; i < bars.length; i++) {
      if (bars[i] === '1') {
        const x = i * barPixelWidth;
        ctx.fillRect(x, 0, barPixelWidth, barsHeight);
      }
    }

    // Draw text if needed
    if (hasText) {
      ctx.fillStyle = '#000000';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(encoded.textContent, canvasWidth / 2, barsHeight + TEXT_SPACE_PX - 5);
    }
  }, [encoded, width, actualCanvasRef]);

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-surface-sunken rounded-md border border-hairline">
        <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-surface-sunken rounded-md border border-danger">
        <div className="text-center">
          <p className="text-sm text-danger-ink">{t('preview.error')}</p>
        </div>
      </div>
    );
  }

  if (!encoded) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-surface-sunken rounded-md border border-hairline">
        <p className="text-sm text-text-secondary">{t('preview.empty')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-surface-sunken rounded-md border border-hairline p-6 min-h-48">
      <canvas
        ref={actualCanvasRef}
        className="max-w-full"
        data-testid="barcode-canvas"
      />
    </div>
  );
}
