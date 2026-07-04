'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { useTranslations } from 'next-intl';

interface JsonInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const JsonInput = forwardRef<HTMLTextAreaElement, JsonInputProps>(
  ({ label, className = '', ...props }, ref) => {
    const t = useTranslations('tools.json-formatter');
    const displayLabel = label || t('input.label');
    const placeholder = props.placeholder || t('input.placeholder');

    return (
      <div className="flex flex-col">
        <label
          htmlFor={props.id || 'json-input'}
          className="mb-2 text-sm font-medium text-text"
        >
          {displayLabel}
        </label>
        <textarea
          ref={ref}
          id={props.id || 'json-input'}
          placeholder={placeholder}
          className={`
            w-full h-64 p-4 font-mono text-sm
            bg-surface border border-surface-muted rounded-lg
            focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50
            resize-none
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

JsonInput.displayName = 'JsonInput';
