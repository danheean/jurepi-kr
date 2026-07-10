'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

interface Props {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export function FileInput({ onFileSelect, selectedFile, disabled = false }: Props) {
  const t = useTranslations('tools.base64-encoder');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
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

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        className={`relative border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
          isDragOver ? 'border-brand bg-brand/5' : 'border-hairline hover:border-hairline-strong'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
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
