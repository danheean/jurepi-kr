import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  fileName?: string;
  fileSize?: string;
}

export function ImageUpload({ onFileSelect, isLoading, fileName, fileSize }: ImageUploadProps) {
  const t = useTranslations('tools.transparent-background');
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Ignore leave events fired when the pointer moves onto a child element
    // (icon, text, input) — only clear once it actually leaves the dropzone.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-text" htmlFor="file-upload">
        {t('upload.label')}
      </label>

      <div
        data-testid="upload-dropzone"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200 ${
          isDragActive
            ? 'border-accent-sky bg-accent-sky-soft'
            : 'border-hairline-strong bg-surface-sunken hover:border-accent-sky hover:bg-accent-sky-soft'
        }`}
      >
        <input
          id="file-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileInputChange}
          disabled={isLoading}
          className="sr-only"
          aria-label={t('upload.label')}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <Upload className="h-6 w-6 text-text-muted" />
          <div className="space-y-1">
            <p className="font-medium text-text">
              {isDragActive ? t('upload.dragActive') : t('upload.text')}
            </p>
            <p className="text-xs text-text-secondary">
              {t('upload.formats')}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="file-upload" className="inline-block cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-strong disabled:opacity-50">
            {isLoading ? t('preview.detecting') : t('upload.button')}
          </label>
        </div>
      </div>

      {fileName && fileSize && (
        <div className="rounded-lg bg-surface p-3 text-sm text-text">
          <div className="flex justify-between">
            <span className="font-medium">{t('upload.fileName')}:</span>
            <span className="text-text-secondary">{fileName}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="font-medium">{t('upload.fileSize')}:</span>
            <span className="text-text-secondary">{fileSize}</span>
          </div>
        </div>
      )}
    </div>
  );
}
