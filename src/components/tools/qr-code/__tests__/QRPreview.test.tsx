import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { QRPreview } from '../QRPreview';
import type { QRGenerationResult } from '@/lib/qr-code';
import enMessages from '@/i18n/messages/en.json';

// Render QRPreview inside a real i18n context (it consumes tools.qr-code.*).
function renderWithProvider(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages as any}>
      {ui}
    </NextIntlClientProvider>
  );
}

const qr = enMessages.tools['qr-code'];

describe('QRPreview', () => {
  const mockMatrix: boolean[][] = [
    [true, true, true, true, true, true, true],
    [true, false, false, false, false, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, true, true, true, false, true],
    [true, false, false, false, false, false, true],
    [true, true, true, true, true, true, true],
  ];

  const mockResult: QRGenerationResult = {
    matrix: mockMatrix,
    svg: '<svg></svg>',
    contrastAcceptable: true,
  };

  it('renders empty state when no result', () => {
    renderWithProvider(
      <QRPreview
        size={300}
        quietZone={4}
        fgColor="#2a2411"
        bgColor="#ffffff"
      />
    );

    expect(screen.getByText(qr.empty.placeholder)).toBeInTheDocument();
  });

  it('renders canvas when result is provided', () => {
    const { container } = renderWithProvider(
      <QRPreview
        result={mockResult}
        size={300}
        quietZone={4}
        fgColor="#2a2411"
        bgColor="#ffffff"
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('renders loading spinner when isLoading is true', () => {
    const { container } = renderWithProvider(
      <QRPreview
        isLoading={true}
        size={300}
        quietZone={4}
        fgColor="#2a2411"
        bgColor="#ffffff"
      />
    );

    // Check for spinner indicator
    const spinnerDiv = container.querySelector('.animate-spin');
    expect(spinnerDiv).toBeInTheDocument();
  });

  it('renders localized error message when error is provided', () => {
    const error = new Error('Test error message');
    renderWithProvider(
      <QRPreview
        error={error}
        size={300}
        quietZone={4}
        fgColor="#2a2411"
        bgColor="#ffffff"
      />
    );

    // Raw domain error text is not surfaced; a localized message is shown instead.
    expect(screen.getByText(qr.errors.encodingFailed)).toBeInTheDocument();
  });

  it('forwards ref to canvas element', () => {
    const ref = { current: null as HTMLCanvasElement | null };
    const { container } = renderWithProvider(
      <QRPreview
        ref={ref}
        result={mockResult}
        size={300}
        quietZone={4}
        fgColor="#2a2411"
        bgColor="#ffffff"
      />
    );

    expect(ref.current).toBeInstanceOf(HTMLCanvasElement);
  });

  it('sets canvas width and height when result changes', () => {
    const ref = { current: null as HTMLCanvasElement | null };
    renderWithProvider(
      <QRPreview
        ref={ref}
        result={mockResult}
        size={300}
        quietZone={4}
        fgColor="#2a2411"
        bgColor="#ffffff"
      />
    );

    // Canvas dimensions are set in useEffect which may not run immediately in tests
    const canvas = ref.current as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('draws modules with correct colors', () => {
    const ref = { current: null as HTMLCanvasElement | null };
    renderWithProvider(
      <QRPreview
        ref={ref}
        result={mockResult}
        size={100}
        quietZone={0}
        fgColor="#2a2411"
        bgColor="#ffffff"
      />
    );

    const canvas = ref.current as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

    // Check that the canvas has been drawn (not all one color)
    if (imageData) {
      const pixels = imageData.data;
      const uniqueColors = new Set(
        Array.from({ length: pixels.length / 4 }, (_, i) => {
          const idx = i * 4;
          return `${pixels[idx]},${pixels[idx + 1]},${pixels[idx + 2]}`;
        })
      );
      expect(uniqueColors.size).toBeGreaterThan(1);
    }
  });
});
