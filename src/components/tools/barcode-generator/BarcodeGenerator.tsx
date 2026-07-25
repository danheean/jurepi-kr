'use client';

import { useCallback, useRef, useState } from 'react';
import { useBarcodeGenerator } from './useBarcodeGenerator';
import { FormatSelector } from './FormatSelector';
import { InputArea } from './InputArea';
import { SizeControl } from './SizeControl';
import { TextToggle } from './TextToggle';
import { DownloadButtons } from './DownloadButtons';
import { BarcodePreview } from './BarcodePreview';
import { Toast } from '@/components/ui/Toast';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export function BarcodeGenerator() {
  const {
    input,
    setInput,
    format,
    setFormat,
    width,
    setWidth,
    textVisible,
    setTextVisible,
    encoded,
    error,
    isLoading,
  } = useBarcodeGenerator();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastState['type']) => {
    setToast({ message, type });
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* No Intro/StructuredData/HowTo/Faq here — the H1/eyebrow/lead are
          already rendered once by the shared <ToolIntro> at the route level
          ([slug]/page.tsx ToolContent), and StructuredData/HowTo/Faq are
          route-level only too — rendering any of these here would duplicate
          the H1 or the FAQPage/SoftwareApplication JSON-LD (a previously-
          recurring bug in this codebase). */}

      {/* Interactive Generator Section */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Panel */}
          <div className="space-y-6 bg-surface rounded-lg border border-hairline p-6">
            <FormatSelector selectedFormat={format} onChange={setFormat} />

            <InputArea
              value={input}
              onChange={setInput}
              format={format}
              error={error}
            />

            <SizeControl value={width} onChange={setWidth} />

            <TextToggle checked={textVisible} onChange={setTextVisible} />

            <DownloadButtons encoded={encoded} canvasRef={canvasRef} onToast={showToast} />
          </div>

          {/* Preview Panel */}
          <div className="flex items-center justify-center">
            <BarcodePreview
              encoded={encoded}
              width={width}
              isLoading={isLoading}
              error={error}
              canvasRef={canvasRef}
            />
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
