import { render, screen, userEvent, waitFor } from '@/__test__/test-utils';
import { createRef } from 'react';
import type { EncodedBarcode } from '@/lib/barcode-generator';
import { DownloadButtons } from './DownloadButtons';

const encoded: EncodedBarcode = {
  bars: '1010110',
  svgString: '<svg><rect /></svg>',
  textContent: '978014300723',
  encodedValue: '978014300723',
  format: 'EAN13',
};

function renderWithCanvas(props: Partial<React.ComponentProps<typeof DownloadButtons>> = {}) {
  const canvasRef = createRef<HTMLCanvasElement>();
  const canvas = document.createElement('canvas');
  (canvasRef as { current: HTMLCanvasElement | null }).current = canvas;
  const onToast = props.onToast ?? vi.fn();

  return {
    canvas,
    onToast,
    ...render(
      <DownloadButtons encoded={encoded} canvasRef={canvasRef} onToast={onToast} {...props} />
    ),
  };
}

describe('DownloadButtons', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disables all three buttons when there is no encoded barcode', () => {
    const canvasRef = createRef<HTMLCanvasElement>();
    render(<DownloadButtons encoded={null} canvasRef={canvasRef} onToast={vi.fn()} />);

    expect(screen.getByTestId('download-png-button')).toBeDisabled();
    expect(screen.getByTestId('download-svg-button')).toBeDisabled();
    expect(screen.getByTestId('copy-button')).toBeDisabled();
  });

  it('enables all three buttons once a barcode is encoded', () => {
    renderWithCanvas();

    expect(screen.getByTestId('download-png-button')).toBeEnabled();
    expect(screen.getByTestId('download-svg-button')).toBeEnabled();
    expect(screen.getByTestId('copy-button')).toBeEnabled();
  });

  it('downloads a PNG from the already-drawn canvas (not a fresh SVG rasterization) and reports success', async () => {
    const { canvas, onToast } = renderWithCanvas();
    const toBlobSpy = vi
      .spyOn(canvas, 'toBlob')
      .mockImplementation((cb) => cb(new Blob(['png'], { type: 'image/png' })));
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock-png');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const user = userEvent.setup();
    await user.click(screen.getByTestId('download-png-button'));

    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(onToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('downloads the SVG string as its own independent blob and reports success', async () => {
    const { onToast } = renderWithCanvas();
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation((obj: Blob | MediaSource) => {
        expect((obj as Blob).type).toBe('image/svg+xml');
        return 'blob:mock-svg';
      });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const user = userEvent.setup();
    await user.click(screen.getByTestId('download-svg-button'));

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(onToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('copies the canvas PNG to the clipboard and reports failure via onToast (no false-success)', async () => {
    const { canvas, onToast } = renderWithCanvas();
    vi.spyOn(canvas, 'toBlob').mockImplementation((cb) =>
      cb(new Blob(['png'], { type: 'image/png' }))
    );
    // userEvent.setup() installs its own navigator.clipboard stub — set up
    // ours AFTER setup() runs, or setup() clobbers it before the click.
    const user = userEvent.setup();

    const writeSpy = vi.fn().mockRejectedValue(new Error('clipboard unavailable'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: writeSpy },
      configurable: true,
    });
    // Arrow functions can't be used with `new` — use a real function/class here.
    (global as any).ClipboardItem = vi.fn(function ClipboardItem(items: unknown) {
      return items;
    });

    await user.click(screen.getByTestId('copy-button'));

    // The toBlob callback is fire-and-forget (not awaited by the component),
    // so poll rather than assume it's settled the instant click() resolves.
    await waitFor(() => expect(writeSpy).toHaveBeenCalled());
    // A rejected clipboard write must not claim success, but it must not be
    // silent either — the user needs to see that the copy failed.
    await waitFor(() => expect(onToast).toHaveBeenCalledWith(expect.any(String), 'error'));
    expect(onToast).not.toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('reports failure via onToast when the clipboard canvas produces no blob', async () => {
    const { canvas, onToast } = renderWithCanvas();
    vi.spyOn(canvas, 'toBlob').mockImplementation((cb) => cb(null));
    const user = userEvent.setup();

    await user.click(screen.getByTestId('copy-button'));

    await waitFor(() => expect(onToast).toHaveBeenCalledWith(expect.any(String), 'error'));
  });
});
