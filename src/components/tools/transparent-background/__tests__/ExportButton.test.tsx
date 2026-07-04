import { render, screen, fireEvent } from '@/__test__/test-utils';
import { ExportButton } from '../ExportButton';
import messages from '@/i18n/messages/ko.json';

describe('ExportButton', () => {
  const mockCallbacks = {
    onDownload: vi.fn(),
    onCopyClipboard: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders download and copy buttons', () => {
    render(
      <ExportButton
        resultBlob={undefined}
        canExport={false}
        onDownload={mockCallbacks.onDownload}
        onCopyClipboard={mockCallbacks.onCopyClipboard}
      />
    );

    const downloadBtn = screen.getByRole('button', {
      name: /Download PNG|PNG 다운로드/i,
    });
    const copyBtn = screen.getByRole('button', {
      name: /Copy|복사/i,
    });

    expect(downloadBtn).toBeInTheDocument();
    expect(copyBtn).toBeInTheDocument();
  });

  it('disables buttons when canExport is false', () => {
    render(
      <ExportButton
        resultBlob={undefined}
        canExport={false}
        onDownload={mockCallbacks.onDownload}
        onCopyClipboard={mockCallbacks.onCopyClipboard}
      />
    );

    const downloadBtn = screen.getByRole('button', {
      name: /Download PNG|PNG 다운로드/i,
    }) as HTMLButtonElement;
    const copyBtn = screen.getByRole('button', {
      name: /Copy|복사/i,
    }) as HTMLButtonElement;

    expect(downloadBtn.disabled).toBe(true);
    expect(copyBtn.disabled).toBe(true);
  });

  it('enables buttons when canExport is true', () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });

    render(
      <ExportButton
        resultBlob={mockBlob}
        canExport={true}
        onDownload={mockCallbacks.onDownload}
        onCopyClipboard={mockCallbacks.onCopyClipboard}
      />
    );

    const downloadBtn = screen.getByRole('button', {
      name: /Download PNG|PNG 다운로드/i,
    }) as HTMLButtonElement;
    const copyBtn = screen.getByRole('button', {
      name: /Copy|복사/i,
    }) as HTMLButtonElement;

    expect(downloadBtn.disabled).toBe(false);
    expect(copyBtn.disabled).toBe(false);
  });

  it('calls onDownload when download button is clicked', async () => {
    mockCallbacks.onDownload.mockResolvedValue(null);

    const mockBlob = new Blob(['test'], { type: 'image/png' });

    render(
      <ExportButton
        resultBlob={mockBlob}
        canExport={true}
        onDownload={mockCallbacks.onDownload}
        onCopyClipboard={mockCallbacks.onCopyClipboard}
      />
    );

    const downloadBtn = screen.getByRole('button', {
      name: /Download PNG|PNG 다운로드/i,
    });

    fireEvent.click(downloadBtn);
    expect(mockCallbacks.onDownload).toHaveBeenCalled();
  });

  it('calls onCopyClipboard when copy button is clicked', async () => {
    mockCallbacks.onCopyClipboard.mockResolvedValue(undefined);

    const mockBlob = new Blob(['test'], { type: 'image/png' });

    render(
      <ExportButton
        resultBlob={mockBlob}
        canExport={true}
        onDownload={mockCallbacks.onDownload}
        onCopyClipboard={mockCallbacks.onCopyClipboard}
      />
    );

    const copyBtn = screen.getByRole('button', {
      name: /Copy|복사/i,
    });

    fireEvent.click(copyBtn);
    expect(mockCallbacks.onCopyClipboard).toHaveBeenCalled();
  });

  it('displays success feedback on download', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockCallbacks.onDownload.mockResolvedValue(mockBlob);

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    render(
      <ExportButton
        resultBlob={undefined}
        canExport={true}
        onDownload={mockCallbacks.onDownload}
        onCopyClipboard={mockCallbacks.onCopyClipboard}
      />
    );

    const downloadBtn = screen.getByRole('button', {
      name: /Download PNG|PNG 다운로드/i,
    });

    fireEvent.click(downloadBtn);

    // Button text changes to show success
    await screen.findByText(/Downloaded|다운로드되었습니다/, { selector: 'button' });
  });

  it('shows a failure message instead of a false success state when copy fails', async () => {
    mockCallbacks.onCopyClipboard.mockResolvedValue(false);

    const mockBlob = new Blob(['test'], { type: 'image/png' });

    render(
      <ExportButton
        resultBlob={mockBlob}
        canExport={true}
        onDownload={mockCallbacks.onDownload}
        onCopyClipboard={mockCallbacks.onCopyClipboard}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /Copy|복사/i });
    fireEvent.click(copyBtn);

    await screen.findByText(/Copy failed|복사 실패/);
    expect(screen.queryByText(/Copied|복사되었습니다/)).not.toBeInTheDocument();
  });

  it('shows a failure message instead of silently doing nothing when download fails', async () => {
    mockCallbacks.onDownload.mockResolvedValue(null);

    render(
      <ExportButton
        resultBlob={undefined}
        canExport={true}
        onDownload={mockCallbacks.onDownload}
        onCopyClipboard={mockCallbacks.onCopyClipboard}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Download PNG|PNG 다운로드/i });
    fireEvent.click(downloadBtn);

    await screen.findByText(/Download failed|다운로드 실패/);
  });

  it('announces download/copy success to screen readers via aria-live (matches ShareButtons convention)', () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });

    render(
      <ExportButton
        resultBlob={mockBlob}
        canExport={true}
        onDownload={mockCallbacks.onDownload}
        onCopyClipboard={mockCallbacks.onCopyClipboard}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Download PNG|PNG 다운로드/i });
    const copyBtn = screen.getByRole('button', { name: /Copy|복사/i });

    expect(downloadBtn).toHaveAttribute('aria-live', 'polite');
    expect(copyBtn).toHaveAttribute('aria-live', 'polite');
  });
});
