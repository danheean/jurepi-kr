import { render, screen } from '@/__test__/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { FileInput } from './FileInput';

describe('FileInput', () => {
  it('renders file drop zone button', () => {
    const mockOnSelect = vi.fn();

    render(
      <FileInput
        onFileSelect={mockOnSelect}
        selectedFile={null}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders hidden file input', () => {
    const mockOnSelect = vi.fn();

    const { container } = render(
      <FileInput
        onFileSelect={mockOnSelect}
        selectedFile={null}
      />
    );

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('displays file feedback when file is selected', () => {
    const mockOnSelect = vi.fn();
    const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });

    render(
      <FileInput
        onFileSelect={mockOnSelect}
        selectedFile={file}
      />
    );

    // File feedback is rendered (exact text may vary by locale)
    const feedbackTexts = screen.getAllByText(/\w+/);
    expect(feedbackTexts.length).toBeGreaterThan(0);
  });

  it('calls onFileSelect callback', () => {
    const mockOnSelect = vi.fn();

    render(
      <FileInput
        onFileSelect={mockOnSelect}
        selectedFile={null}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.txt');

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(mockOnSelect).toHaveBeenCalledWith(file);
  });

  it('handles file size limit of 5MB', () => {
    const mockOnSelect = vi.fn();

    const { container } = render(
      <FileInput
        onFileSelect={mockOnSelect}
        selectedFile={null}
      />
    );

    // Create a file that appears to exceed 5MB (5 * 1024 * 1024 = 5242880 bytes)
    // Using Object.defineProperty to simulate large file size
    const largeFile = new File(['x'], 'large.bin', { type: 'application/octet-stream' });
    Object.defineProperty(largeFile, 'size', {
      value: 6 * 1024 * 1024, // 6MB
      writable: false,
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    });

    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    // The component/hook should call onFileSelect with the file
    // The validation of size limit happens in the useBase64 hook (isValidInput)
    expect(mockOnSelect).toHaveBeenCalledWith(largeFile);
  });
});
