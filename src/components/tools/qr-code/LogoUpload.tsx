'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { X } from 'lucide-react';

interface LogoUploadProps {
  logoUrl?: string;
  onLogoUrlChange: (url?: string) => void;
}

const VALID_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

export function LogoUpload({ logoUrl, onLogoUrlChange }: LogoUploadProps) {
  const t = useTranslations('tools.qr-code');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    if (!VALID_TYPES.includes(file.type)) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onLogoUrlChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onLogoUrlChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-text">{t('logo.label')}</label>

      <div className="flex flex-col gap-3">
        {/* File Input */}
        <label className="relative inline-flex items-center justify-center px-4 py-2 rounded-md border-2 border-dashed border-hairline bg-surface hover:bg-surface-muted cursor-pointer transition-colors min-h-[44px] focus-within:ring-2 focus-within:ring-focus-ring focus-within:outline-none">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label={t('logo.upload')}
          />
          <span className="text-sm font-medium text-text">{t('logo.upload')}</span>
        </label>

        {/* Logo Preview */}
        {logoUrl && (
          <div className="space-y-2">
            <div className="w-24 h-24 rounded-md border border-hairline overflow-hidden bg-surface flex items-center justify-center">
              <img
                src={logoUrl}
                alt={t('logo.previewAlt')}
                className="w-full h-full object-contain"
              />
            </div>
            <button
              onClick={handleRemove}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-surface-muted text-text-secondary hover:bg-surface-sunken text-sm font-medium transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none"
            >
              <X className="w-4 h-4" />
              {t('logo.remove')}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-text-secondary leading-relaxed">
        {t('logo.help')}
      </p>
    </div>
  );
}
