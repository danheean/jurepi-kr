'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Trash2, Plus, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Person } from '@/lib/age-calculator/schema';
import type { CalendarType } from '@/lib/age-calculator/resolve';
import { CalendarDateInput, type CalendarDateValue } from './CalendarDateInput';

interface Props {
  people: Person[];
  onAdd: (name: string, birthdate: string, calendarType: CalendarType, isLeapMonth: boolean) => void;
  onRemove: (personId: string) => void;
  onSelect: (person: Person) => void;
  /** When `prefillNonce` changes, open the add form pre-filled with these values. */
  prefill?: CalendarDateValue | null;
  prefillNonce?: number;
}

const NAME_MAX = 40;

/**
 * PeopleList: saved people + inline add form. The birthdate uses the same
 * CalendarDateInput (solar/lunar dropdowns + leap) as the main input, and the
 * form can be opened pre-filled from the result panel ("이 생년월일 저장").
 */
export function PeopleList({ people, onAdd, onRemove, onSelect, prefill, prefillNonce }: Props) {
  const t = useTranslations('tools.age-calculator');
  const locale = useLocale();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addValue, setAddValue] = useState<CalendarDateValue>({ date: null, calendarType: 'solar', isLeapMonth: false });
  const [addError, setAddError] = useState<'name' | 'birthdate' | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus the name field when the form opens.
  useEffect(() => {
    if (isAddOpen) nameInputRef.current?.focus();
  }, [isAddOpen]);

  // Open + prefill from the result panel. Guard on a truthy nonce so the form
  // does not auto-open on first mount (initial nonce is 0).
  useEffect(() => {
    if (!prefillNonce) return;
    if (prefill) setAddValue(prefill);
    setAddError(null);
    setIsAddOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillNonce]);

  const resetForm = () => {
    setAddName('');
    setAddValue({ date: null, calendarType: 'solar', isLeapMonth: false });
    setAddError(null);
    setIsAddOpen(false);
  };

  const handleAddSubmit = () => {
    if (!addName.trim()) {
      setAddError('name');
      nameInputRef.current?.focus();
      return;
    }
    if (!addValue.date) {
      setAddError('birthdate');
      return;
    }
    onAdd(addName.trim(), addValue.date, addValue.calendarType, addValue.isLeapMonth);
    resetForm();
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      resetForm();
    }
  };

  const formatBirthdate = (person: Person): string => {
    const [year, month, day] = person.birthdate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const base = new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
    if (person.calendarType !== 'lunar') return base;
    const leap = person.isLeapMonth ? ` ${t('recents.leapTag')}` : '';
    return `${base} · ${t('recents.lunarTag')}${leap}`;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">{t('people.heading')}</h3>
        {!isAddOpen && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-semibold hover:bg-brand-strong transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('people.addButton')}
          </button>
        )}
      </div>

      {/* Inline add form */}
      {isAddOpen && (
        <div className="bg-surface-muted border border-hairline rounded-lg p-4 space-y-4" onKeyDown={handleFormKeyDown}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text">{t('people.addModal.title')}</h4>
            <button
              onClick={resetForm}
              aria-label={t('people.addModal.cancel')}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-surface-sunken hover:text-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="add-name" className="block text-sm font-semibold text-text">
              {t('people.addModal.nameLabel')}
            </label>
            <input
              id="add-name"
              ref={nameInputRef}
              type="text"
              value={addName}
              maxLength={NAME_MAX}
              onChange={(e) => {
                setAddName(e.target.value);
                if (addError === 'name') setAddError(null);
              }}
              placeholder={t('people.addModal.namePlaceholder')}
              aria-invalid={addError === 'name'}
              aria-describedby={addError === 'name' ? 'add-name-error' : undefined}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-surface transition-colors ${
                addError === 'name' ? 'border-danger' : 'border-hairline hover:border-hairline-strong focus:border-accent-mint'
              }`}
            />
            {addError === 'name' && (
              <p id="add-name-error" className="text-xs text-danger-ink" role="alert" aria-live="polite">
                {t('people.addModal.errorName')}
              </p>
            )}
          </div>

          {/* Birthdate — same solar/lunar dropdowns as the main input */}
          <div className="space-y-1.5">
            <span className="block text-sm font-semibold text-text">{t('people.addModal.birthdateLabel')}</span>
            <CalendarDateInput
              date={addValue.date}
              calendarType={addValue.calendarType}
              isLeapMonth={addValue.isLeapMonth}
              onChange={(v) => {
                setAddValue(v);
                if (addError === 'birthdate') setAddError(null);
              }}
              idPrefix="add"
              ariaLabel={t('people.addModal.birthdateLabel')}
              invalid={addError === 'birthdate'}
            />
            {addError === 'birthdate' && (
              <p className="text-xs text-danger-ink" role="alert" aria-live="polite">
                {t('people.addModal.errorBirthdate')}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-hairline text-text text-sm font-semibold hover:bg-surface-sunken transition-colors"
            >
              {t('people.addModal.cancel')}
            </button>
            <button
              onClick={handleAddSubmit}
              className="px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-strong transition-colors"
            >
              {t('people.addModal.save')}
            </button>
          </div>
        </div>
      )}

      {/* People list or empty state */}
      {people.length === 0 ? (
        <div className="p-4 bg-surface-muted border border-hairline rounded-lg text-center text-sm text-text-secondary">
          {t('people.emptyState')}
        </div>
      ) : (
        <div className="space-y-2">
          {people.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between gap-3 p-3 bg-surface border border-hairline rounded-lg hover:bg-surface-muted transition-colors"
            >
              <button
                onClick={() => onSelect(person)}
                className="flex-1 min-w-0 text-left min-h-11 rounded-md"
                aria-label={t('people.selectAria', { name: person.name })}
              >
                <div className="font-medium text-text break-words">{person.name}</div>
                <div className="text-xs text-text-secondary">{formatBirthdate(person)}</div>
              </button>
              <button
                onClick={() => onRemove(person.id)}
                aria-label={t('people.removeButton')}
                className="flex-shrink-0 inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg hover:bg-danger/10 text-danger-ink transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
