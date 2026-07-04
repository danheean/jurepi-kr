import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ImageUpload } from '../ImageUpload';
import messagesKo from '@/i18n/messages/ko.json';
import messagesEn from '@/i18n/messages/en.json';

const messages = { ko: messagesKo as any, en: messagesEn as any };

// Polyfill DataTransfer for jsdom
if (typeof DataTransfer === 'undefined') {
  (global as any).DataTransfer = class DataTransfer {
    items = {
      add: vi.fn(),
    };
  };
}

describe('ImageUpload', () => {
  it('renders upload area with label', () => {
    const mockOnFileSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    expect(screen.getByLabelText(messages.ko.tools['transparent-background'].upload.label)).toBeInTheDocument();
  });

  it('displays file input and accepts PNG/JPEG/WebP', () => {
    const mockOnFileSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    const fileInput = screen.getByLabelText(messages.ko.tools['transparent-background'].upload.label) as HTMLInputElement;
    expect(fileInput.accept).toContain('image/png');
    expect(fileInput.accept).toContain('image/jpeg');
    expect(fileInput.accept).toContain('image/webp');
  });

  it('calls onFileSelect when file is selected', async () => {
    const mockOnFileSelect = vi.fn();
    const { rerender } = render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    const fileInput = screen.getByLabelText(
      messages.ko.tools['transparent-background'].upload.label
    ) as HTMLInputElement;

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    if (fileInput) {
      fileInput.files = dataTransfer.files;
      fireEvent.change(fileInput);
    }
  });

  it('displays filename and file size when provided', () => {
    const mockOnFileSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload
          onFileSelect={mockOnFileSelect}
          fileName="test-image.png"
          fileSize="2.5 MB"
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(/test-image\.png/)).toBeInTheDocument();
    expect(screen.getByText(/2\.5 MB/)).toBeInTheDocument();
  });

  it('gives the button its own action label instead of repeating the instruction paragraph verbatim', () => {
    const mockOnFileSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    // "클릭해서 업로드하거나 드래그하세요" reads fine as the instruction paragraph,
    // but "drag and drop" doesn't make sense repeated as a button's own label.
    expect(
      screen.getByText(messages.ko.tools['transparent-background'].upload.button)
    ).toBeInTheDocument();
    expect(
      screen.queryAllByText(messages.ko.tools['transparent-background'].upload.text)
    ).toHaveLength(1); // only the instruction paragraph, not duplicated onto the button
  });

  it('does not have Korean text leakage in English locale', () => {
    const mockOnFileSelect = vi.fn();
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages.en}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    const text = container.textContent || '';
    // Check for Korean characters in the raw element tree
    expect(/[가-힣]/.test(text)).toBe(false);
  });

  it('shows drag-active feedback text and styling on dragEnter', () => {
    const mockOnFileSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    const dropzone = screen.getByTestId('upload-dropzone');
    fireEvent.dragEnter(dropzone);

    expect(
      screen.getByText(messages.ko.tools['transparent-background'].upload.dragActive)
    ).toBeInTheDocument();
    expect(dropzone.className).toContain('border-accent-sky');
  });

  it('clears drag-active feedback on dragLeave', () => {
    const mockOnFileSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    const dropzone = screen.getByTestId('upload-dropzone');
    fireEvent.dragEnter(dropzone);
    expect(
      screen.getByText(messages.ko.tools['transparent-background'].upload.dragActive)
    ).toBeInTheDocument();

    fireEvent.dragLeave(dropzone, { relatedTarget: document.body });

    expect(
      screen.queryByText(messages.ko.tools['transparent-background'].upload.dragActive)
    ).not.toBeInTheDocument();
  });

  it('clears drag-active feedback after a drop', () => {
    const mockOnFileSelect = vi.fn();
    render(
      <NextIntlClientProvider locale="ko" messages={messages.ko}>
        <ImageUpload onFileSelect={mockOnFileSelect} />
      </NextIntlClientProvider>
    );

    const dropzone = screen.getByTestId('upload-dropzone');
    fireEvent.dragEnter(dropzone);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(
      screen.queryByText(messages.ko.tools['transparent-background'].upload.dragActive)
    ).not.toBeInTheDocument();
  });
});
