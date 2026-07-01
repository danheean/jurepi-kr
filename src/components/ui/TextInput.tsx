'use client';

import { InputHTMLAttributes, useState } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  maxChars?: number;
  showCounter?: boolean;
  accentColor?: string;
  testId?: string;
}

export function TextInput({
  label,
  maxChars,
  showCounter = false,
  accentColor = 'coral',
  value = '',
  onChange,
  className = '',
  testId,
  ...props
}: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const charCount = String(value).length;

  return (
    <div className="w-full">
      {label && <label className="text-sm text-text">{label}</label>}
      <div className="relative mt-1">
        <input
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={maxChars}
          data-testid={testId}
          className={`
            w-full h-11 px-3.5 py-2.5 rounded-md font-body text-text
            border border-hairline bg-surface
            transition-all duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
            focus-visible:border-brand-ink
            placeholder:text-text-muted
            ${className}
          `}
          {...props}
        />
        {showCounter && maxChars && (
          <div
            className={`
              absolute right-2 top-1/2 -translate-y-1/2 text-xs
              ${charCount === maxChars ? 'text-danger-ink' : 'text-text-muted'}
            `}
          >
            {charCount}/{maxChars}
          </div>
        )}
      </div>
    </div>
  );
}
