import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DownloadButtons } from '../DownloadButtons';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

const messages = {
  tools: {
    'qr-code': {
      buttons: {
        downloadPng: 'Download PNG',
        downloadSvg: 'Download SVG',
        copyClipboard: 'Copy to Clipboard',
        confirmLowContrast: 'Generate Anyway',
      },
      toasts: {
        downloadSuccess: 'QR code downloaded.',
        copySuccess: 'Copied to clipboard.',
        copyFail: 'Failed to copy to clipboard.',
      },
    },
  },
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
);

describe('DownloadButtons', () => {
  let canvasRef: React.RefObject<HTMLCanvasElement | null>;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create a real canvas element
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 300;
    mockCanvas.height = 300;

    canvasRef = React.createRef() as React.RefObject<HTMLCanvasElement | null>;
    (canvasRef as any).current = mockCanvas;

    // Mock canvas.toBlob
    mockCanvas.toBlob = vi.fn((callback) => {
      const blob = new Blob(['fake png data'], { type: 'image/png' });
      callback(blob);
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();

    // Mock document methods
    const mockAnchor = document.createElement('a');
    mockAnchor.click = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor as any);
  });

  it('renders download buttons', () => {
    render(
      <DownloadButtons
        canvasRef={canvasRef}
        svg="<svg></svg>"
        isContrastAcceptable={true}
      />,
      { wrapper }
    );

    expect(screen.getByText(/Download PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/Download SVG/i)).toBeInTheDocument();
    expect(screen.getByText(/Copy to Clipboard/i)).toBeInTheDocument();
  });

  it('disables buttons when contrast is not acceptable', () => {
    render(
      <DownloadButtons
        canvasRef={canvasRef}
        svg="<svg></svg>"
        isContrastAcceptable={false}
      />,
      { wrapper }
    );

    const downloadPngBtn = screen.getByText(/Download PNG/i) as HTMLButtonElement;
    const downloadSvgBtn = screen.getByText(/Download SVG/i) as HTMLButtonElement;
    const copyBtn = screen.getByText(/Copy to Clipboard/i) as HTMLButtonElement;

    expect(downloadPngBtn).toBeDisabled();
    expect(downloadSvgBtn).toBeDisabled();
    expect(copyBtn).toBeDisabled();
  });

  it('shows confirm button when contrast is not acceptable', () => {
    render(
      <DownloadButtons
        canvasRef={canvasRef}
        svg="<svg></svg>"
        isContrastAcceptable={false}
      />,
      { wrapper }
    );

    expect(screen.getByText(/Generate Anyway/i)).toBeInTheDocument();
  });

  it('calls onConfirmLowContrast when confirm button is clicked', () => {
    const onConfirmLowContrast = vi.fn();
    render(
      <DownloadButtons
        canvasRef={canvasRef}
        svg="<svg></svg>"
        isContrastAcceptable={false}
        onConfirmLowContrast={onConfirmLowContrast}
      />,
      { wrapper }
    );

    const confirmBtn = screen.getByText(/Generate Anyway/i);
    fireEvent.click(confirmBtn);

    expect(onConfirmLowContrast).toHaveBeenCalled();
  });

  it('triggers canvas.toBlob on PNG download', () => {
    render(
      <DownloadButtons
        canvasRef={canvasRef}
        svg="<svg></svg>"
        isContrastAcceptable={true}
      />,
      { wrapper }
    );

    const downloadPngBtn = screen.getByText(/Download PNG/i);
    fireEvent.click(downloadPngBtn);

    expect(mockCanvas.toBlob).toHaveBeenCalled();
  });

  it('calls onDownload callback on successful PNG download', async () => {
    const onDownload = vi.fn();
    render(
      <DownloadButtons
        canvasRef={canvasRef}
        svg="<svg></svg>"
        isContrastAcceptable={true}
        onDownload={onDownload}
      />,
      { wrapper }
    );

    const downloadPngBtn = screen.getByText(/Download PNG/i);
    fireEvent.click(downloadPngBtn);

    await waitFor(() => {
      expect(onDownload).toHaveBeenCalled();
    });
  });

  it('renders buttons with padding for accessibility', () => {
    const { container } = render(
      <DownloadButtons
        canvasRef={canvasRef}
        svg="<svg></svg>"
        isContrastAcceptable={true}
      />,
      { wrapper }
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Check that buttons have padding classes
    buttons.forEach((btn) => {
      const classAttr = btn.getAttribute('class');
      expect(classAttr).toMatch(/px-/); // Has horizontal padding
      expect(classAttr).toMatch(/py-/); // Has vertical padding
    });
  });
});
