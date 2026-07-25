import { render, screen } from '@/__test__/test-utils';
import type { EncodedBarcode } from '@/lib/barcode-generator';
import { BarcodePreview } from './BarcodePreview';

function mockCanvasContext() {
  const ctx = {
    fillStyle: '',
    font: '',
    textAlign: '' as CanvasTextAlign,
    fillRect: vi.fn(),
    fillText: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D
  );
  return ctx;
}

const baseEncoded: EncodedBarcode = {
  bars: '1010110',
  svgString: '<svg></svg>',
  textContent: '978014300723',
  encodedValue: '978014300723',
  format: 'EAN13',
};

describe('BarcodePreview', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the empty placeholder when there is no encoded result', () => {
    render(<BarcodePreview encoded={null} width={200} isLoading={false} error={null} />);
    expect(screen.getByText('Your barcode will appear here')).toBeInTheDocument();
    expect(screen.queryByTestId('barcode-canvas')).not.toBeInTheDocument();
  });

  it('shows the error message when encoding failed', () => {
    render(<BarcodePreview encoded={null} width={200} isLoading={false} error="encodingFailed" />);
    expect(screen.getByText('Unable to generate barcode')).toBeInTheDocument();
  });

  it('sizes the canvas to the given width and draws one bar per "1" bit', () => {
    const ctx = mockCanvasContext();
    render(<BarcodePreview encoded={baseEncoded} width={200} isLoading={false} error={null} />);

    const canvas = screen.getByTestId('barcode-canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(200);

    // '1010110' has 4 ones for the bars, plus 1 more fillRect call to clear
    // the white background = 5 total.
    expect(ctx.fillRect).toHaveBeenCalledTimes(5);
  });

  it('draws the human-readable text when textContent is present', () => {
    const ctx = mockCanvasContext();
    render(<BarcodePreview encoded={baseEncoded} width={200} isLoading={false} error={null} />);
    expect(ctx.fillText).toHaveBeenCalledWith('978014300723', 100, expect.any(Number));
  });

  it('skips the text draw and shrinks canvas height when textContent is empty', () => {
    const ctx = mockCanvasContext();
    const withoutText: EncodedBarcode = { ...baseEncoded, textContent: '' };
    render(<BarcodePreview encoded={withoutText} width={200} isLoading={false} error={null} />);

    const canvas = screen.getByTestId('barcode-canvas') as HTMLCanvasElement;
    expect(canvas.height).toBe(Math.round(200 * 0.5));
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('re-draws when width changes (canvas stays in sync with the size slider)', () => {
    const ctx = mockCanvasContext();
    const { rerender } = render(
      <BarcodePreview encoded={baseEncoded} width={200} isLoading={false} error={null} />
    );
    const canvas = screen.getByTestId('barcode-canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(200);

    rerender(<BarcodePreview encoded={baseEncoded} width={300} isLoading={false} error={null} />);
    expect(canvas.width).toBe(300);
  });
});
