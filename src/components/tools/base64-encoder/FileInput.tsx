'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';

interface Props {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export function FileInput({ onFileSelect, selectedFile, disabled = false }: Props) {
  const t = useTranslations('tools.base64-encoder');
  const inputRef = useRef<HTMLInputElement>(null);
  const isDragOver = useRef(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    isDragOver.current = true;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      isDragOver.current = false;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    isDragOver.current = false;
    const files = e.dataTransfer.files;
    if (files[0]) {
      onFileSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className="relative border-2 border-dashed border-hairline rounded-lg p-8 cursor-pointer hover:border-hairline-strong transition-colors text-center"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={t('input.fileLabel')}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-text">{t('input.fileLabel')}</p>
      </div>
      {selectedFile && (
        <p className="text-sm text-text-secondary">
          {t('input.fileSuccess', {
            filename: selectedFile.name,
            size: (selectedFile.size / 1024).toFixed(1) + ' KB',
          })}
        </p>
      )}
    </div>
  );
}
