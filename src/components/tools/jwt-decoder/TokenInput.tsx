import { forwardRef, TextareaHTMLAttributes } from 'react';
import { useTranslations } from 'next-intl';

interface TokenInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
}

export const TokenInput = forwardRef<HTMLTextAreaElement, TokenInputProps>(
  ({ label, error = false, className = '', ...props }, ref) => {
    const t = useTranslations('tools.jwt-decoder');
    const displayLabel = label || t('input.label');

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={props.id || 'token-input'}
          className="text-sm font-medium text-text"
        >
          {displayLabel}
        </label>
        <textarea
          ref={ref}
          id={props.id || 'token-input'}
          placeholder={t('input.placeholder')}
          className={`
            w-full h-32 p-4 font-mono text-sm
            bg-surface border rounded-lg
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            resize-none
            transition-colors duration-200
            ${
              error
                ? 'border-danger/50 focus-visible:ring-danger'
                : 'border-hairline focus-visible:ring-brand'
            }
            ${className}
          `}
          spellCheck="false"
          autoComplete="off"
          {...props}
        />
      </div>
    );
  }
);

TokenInput.displayName = 'TokenInput';
