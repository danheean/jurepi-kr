'use client';

import { useId } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  testId?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  testId,
}: ToggleProps) {
  const switchId = useId();
  const labelId = `${switchId}-label`;
  return (
    <div className="flex items-center gap-3">
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? labelId : undefined}
        disabled={disabled}
        data-testid={testId}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 rounded-full transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
          focus-visible:ring-offset-2 disabled:opacity-50
          ${
            checked
              ? 'bg-brand'
              : 'bg-surface-sunken border border-hairline-strong'
          }
        `}
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full bg-surface
            shadow-card transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0.5'}
          `}
        />
      </button>
      {label && (
        <label
          id={labelId}
          htmlFor={switchId}
          className="text-button text-text cursor-pointer"
        >
          {label}
        </label>
      )}
    </div>
  );
}
