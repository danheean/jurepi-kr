'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Check } from 'lucide-react';
import { CATEGORIES, type CategoryId } from '@/lib/unit-converter';

interface Props {
  category: CategoryId;
  selectedId: string;
  onChange: (id: string) => void;
  /** Button id so an external <label htmlFor> associates with this control. */
  id?: string;
  /** Accessible name for the picker button (e.g. "From unit" / "To unit"). */
  ariaLabel?: string;
}

/**
 * UnitPicker: Dropdown/combobox for unit selection.
 * Searchable (100ms debounce), keyboard navigable (Arrow/Home/End/Enter/Esc).
 */
export function UnitPicker({ category, selectedId, onChange, id, ariaLabel }: Props) {
  const t = useTranslations('tools.unit-converter');
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const catData = CATEGORIES.find((c) => c.id === category);
  const units = catData?.units || [];

  const filteredUnits = units.filter((u) =>
    filter === ''
      ? true
      : u.id.toLowerCase().includes(filter.toLowerCase()) ||
        u.symbol.toLowerCase().includes(filter.toLowerCase())
  );

  const selectedUnit = units.find((u) => u.id === selectedId);

  const handleOpenMenu = useCallback(() => {
    setIsOpen(true);
    setFilter('');
    setFocusedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsOpen(false);
    setFilter('');
    setFocusedIndex(0);
    buttonRef.current?.focus();
  }, []);

  const handleSelect = useCallback(
    (unitId: string) => {
      onChange(unitId);
      handleCloseMenu();
    },
    [onChange, handleCloseMenu]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenMenu();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % filteredUnits.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev === 0 ? filteredUnits.length - 1 : prev - 1
        );
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusedIndex(filteredUnits.length - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredUnits[focusedIndex]) {
          handleSelect(filteredUnits[focusedIndex].id);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseMenu();
      }
    },
    [isOpen, filteredUnits, focusedIndex, handleOpenMenu, handleCloseMenu, handleSelect]
  );

  // Close menu on blur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        handleCloseMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleCloseMenu]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? handleCloseMenu() : handleOpenMenu())}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-4 py-3 rounded-lg border-2 text-left flex items-center justify-between
          font-medium text-base transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring
          ${
            isOpen
              ? 'border-accent-sky bg-accent-sky-soft'
              : 'border-hairline bg-surface hover:border-hairline-strong'
          }
        `}
      >
        <span className="truncate">
          {selectedUnit ? `${selectedUnit.symbol}` : 'Select unit'}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 right-0 mt-2 bg-surface border border-hairline rounded-lg shadow-lg z-50 max-h-64 overflow-hidden flex flex-col"
        >
          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setFocusedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('picker.search')}
            className="px-3 py-2 border-b border-hairline text-sm focus-visible:outline-none"
          />

          {/* Unit list */}
          <div className="overflow-y-auto flex-1">
            {filteredUnits.length > 0 ? (
              filteredUnits.map((unit, idx) => (
                <button
                  key={unit.id}
                  onClick={() => handleSelect(unit.id)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={`
                    w-full px-3 py-2 text-left flex items-center justify-between text-sm
                    transition-colors
                    ${
                      idx === focusedIndex
                        ? 'bg-accent-sky-soft'
                        : selectedId === unit.id
                        ? 'bg-surface-muted'
                        : 'hover:bg-surface-muted'
                    }
                  `}
                >
                  <span>
                    <span className="font-medium">{unit.symbol}</span>
                    <span className="text-text-muted ml-2 text-xs">{t(`units.${unit.id}`)}</span>
                  </span>
                  {selectedId === unit.id && <Check size={14} className="text-accent-sky-ink" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-text-muted">{t('picker.noMatch')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
