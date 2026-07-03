'use client';

import { forwardRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { QRGenerationResult } from '@/lib/qr-code';

interface Props {
  result?: QRGenerationResult;
  isLoading?: boolean;
  error?: Error;
  size: number;
  quietZone: number;
  fgColor: string;
  bgColor: string;
  logoUrl?: string;
  prefersReducedMotion?: boolean;
}

/**
 * QRPreview renders the QR code matrix to canvas.
 * Forwards canvas ref for download operations.
 */
export const QRPreview = forwardRef<HTMLCanvasElement, Props>(
  (
    { result, isLoading, error, size, quietZone, fgColor, bgColor, logoUrl, prefersReducedMotion },
    ref
  ) => {
    const t = useTranslations('tools.qr-code');
    const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

    // Load logo image when logoUrl changes
    useEffect(() => {
      if (!logoUrl) {
        setLogoImage(null);
        return;
      }

      const img = new Image();
      img.onload = () => setLogoImage(img);
      img.onerror = () => setLogoImage(null);
      img.src = logoUrl;
    }, [logoUrl]);

    // Render canvas when result or styling changes
    useEffect(() => {
      const canvas = (ref as any)?.current;
      if (!canvas || !result) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { matrix } = result;
      const moduleCount = matrix.length + quietZone * 2;
      const moduleSize = size / moduleCount;

      // Set canvas size
      canvas.width = size;
      canvas.height = size;

      // Fill background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);

      // Draw modules
      ctx.fillStyle = fgColor;
      for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
          if (matrix[row][col]) {
            const x = (col + quietZone) * moduleSize;
            const y = (row + quietZone) * moduleSize;
            ctx.fillRect(x, y, moduleSize, moduleSize);
          }
        }
      }

      // Draw logo overlay if present
      if (logoImage) {
        const logoSize = size * 0.25; // 25% of QR size
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

        // Semi-transparent white background behind logo for visibility
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);

        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
      }
    }, [result, size, quietZone, fgColor, bgColor, logoImage, ref]);

    if (error) {
      return (
        <div className="flex items-center justify-center w-full aspect-square bg-surface border border-hairline rounded-lg">
          <p className="text-center text-sm text-danger-ink">{t('errors.encodingFailed')}</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center w-full aspect-square bg-surface border border-hairline rounded-lg">
          <div className={prefersReducedMotion ? '' : 'animate-spin'}>
            <div className="w-8 h-8 border-2 border-accent-sky/30 border-t-accent-sky rounded-full" />
          </div>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex items-center justify-center w-full aspect-square bg-surface border border-hairline rounded-lg">
          <p className="text-center text-sm text-text-secondary">{t('empty.placeholder')}</p>
        </div>
      );
    }

    return (
      <div className="flex justify-center w-full">
        <canvas
          ref={ref}
          role="img"
          aria-label={t('preview.ariaLabel')}
          className="border border-hairline rounded-lg max-w-full"
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>
    );
  }
);

QRPreview.displayName = 'QRPreview';
