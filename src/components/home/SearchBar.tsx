'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  ariaLabel?: string;
}

/**
 * SearchBar: controlled input, 56px tall, rounded-xl, shadow-card.
 * Leading search icon, focus-visible ring + brand border.
 */
export function SearchBar({
  value,
  onChange,
  placeholder,
  id,
  ariaLabel,
}: SearchBarProps): React.ReactNode {
  return (
    <div className="relative w-full">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none">
        <Search size={24} strokeWidth={1.75} />
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full h-14 pl-14 pr-4 bg-surface rounded-xl border border-hairline shadow-card placeholder:text-text-muted text-text text-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring focus-visible:border-brand-ink transition-all"
      />
    </div>
  );
}
