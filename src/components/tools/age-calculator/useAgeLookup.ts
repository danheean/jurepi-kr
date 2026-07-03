import { useState, useEffect, useCallback } from 'react';
import { calculateAge, type AgeResult } from '@/lib/age-calculator/age';
import type { DateKey } from '@/lib/age-calculator/date';
import { today, parseDateKey } from '@/lib/age-calculator/date';
import { parseBirthdateInput, parsePeopleStore, type Person, type PeopleStore } from '@/lib/age-calculator/schema';
import { addPerson, removePerson } from '@/lib/age-calculator/people';
import { pushRecent, serializeRecents, deserializeRecents, type RecentEntry } from '@/lib/age-calculator/recents';
import { resolveBirthdate, isResolveError, type CalendarType } from '@/lib/age-calculator/resolve';

export type AgeError = 'invalid' | 'future' | 'too-old' | 'no-leap';

export interface UseAgeLookupState {
  birthdate: string | null;
  calendarType: CalendarType;
  isLeapMonth: boolean;
  asOfDate: string;
  useAsOf: boolean;
  age: AgeResult | null;
  error: AgeError | null;
  people: Person[];
  recents: RecentEntry[];
  selectedPersonId: string | null;
}

export interface UseAgeLookupActions {
  setBirthdate(dateKey: DateKey | null, calendarType?: CalendarType, isLeapMonth?: boolean): void;
  setAsOfDate(dateKey: DateKey): void;
  setUseAsOf(use: boolean): void;
  addPerson(name: string, birthdate: DateKey, calendarType?: CalendarType, isLeapMonth?: boolean): void;
  removePerson(personId: string): void;
  selectRecent(entry: RecentEntry): void;
  clearRecents(): void;
  clearError(): void;
  copyResultToClipboard(): Promise<boolean>;
}

export type UseAgeLookupReturn = UseAgeLookupState & UseAgeLookupActions;

/** Delay before a settled birthdate is written to recents. */
const RECENTS_DEBOUNCE_MS = 600;

const emptyStore = (): PeopleStore => {
  const now = Date.now();
  return { version: 1, people: [], meta: { createdAt: now, updatedAt: now } };
};

/**
 * useAgeLookup: state management for the age calculator.
 * - Age/zodiac are computed by an async effect that resolves the entered date
 *   (solar OR lunar) to a canonical solar date via the lunar engine, so the
 *   Korean zodiac is accurate (lunar-year based) and 간지 is available.
 */
export function useAgeLookup(): UseAgeLookupReturn {
  const [birthdate, setBirthdateState] = useState<string | null>(null);
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [asOfDate, setAsOfDateState] = useState<string>('');
  const [useAsOf, setUseAsOf] = useState(false);
  const [age, setAge] = useState<AgeResult | null>(null);
  const [error, setError] = useState<AgeError | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleStore, setPeopleStore] = useState<PeopleStore | null>(null);
  const [recents, setRecents] = useState<RecentEntry[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // On mount: load people + recents from localStorage (graceful fail).
  useEffect(() => {
    setAsOfDateState(today());

    try {
      const peopleJson = localStorage.getItem('jurepi-age-calculator-people');
      if (peopleJson) {
        const store = parsePeopleStore(JSON.parse(peopleJson));
        setPeopleStore(store);
        setPeople(store.people);
      } else {
        setPeopleStore(emptyStore());
      }
    } catch {
      setPeopleStore(emptyStore());
    }

    try {
      const recentsJson = localStorage.getItem('jurepi-age-calculator-recents');
      if (recentsJson) setRecents(deserializeRecents(recentsJson));
    } catch {
      setRecents([]);
    }
  }, []);

  const setBirthdate = useCallback(
    (dateKey: DateKey | null, ct: CalendarType = 'solar', leap = false) => {
      setBirthdateState(dateKey);
      setCalendarType(ct);
      setIsLeapMonth(ct === 'solar' ? false : leap);
      setSelectedPersonId(null);
      setError(null);
      if (!dateKey) setAge(null);
      // Age is computed by the async effect below.
    },
    []
  );

  // Compute age from the entered date (solar or lunar). Async because the lunar
  // engine loads on demand; latest-wins via the cancelled guard.
  useEffect(() => {
    if (!birthdate) {
      setAge(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const resolved = await resolveBirthdate(birthdate, calendarType, isLeapMonth);
      if (cancelled) return;

      if (isResolveError(resolved)) {
        setAge(null);
        setError(resolved.error === 'no-leap' ? 'no-leap' : resolved.error === 'range' ? 'too-old' : 'invalid');
        return;
      }

      // Validate the resolved SOLAR date (future / too-old / invalid).
      if (!parseBirthdateInput({ birthdate: resolved.solarDate })) {
        const [y, m, d] = resolved.solarDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const now = new Date();
        if (dt > now) {
          setError('future');
        } else {
          const oldest = new Date();
          oldest.setFullYear(oldest.getFullYear() - 150);
          setError(dt < oldest ? 'too-old' : 'invalid');
        }
        setAge(null);
        return;
      }

      const asOf = useAsOf && asOfDate ? parseDateKey(asOfDate) : new Date();
      const result = calculateAge(parseDateKey(resolved.solarDate), asOf);
      result.zodiacKey = resolved.zodiacKey;
      result.sexagenary = resolved.sexagenary;
      setAge(result);
      setError(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [birthdate, calendarType, isLeapMonth, asOfDate, useAsOf]);

  // Record the settled, successfully-calculated lookup into recents (debounced,
  // so stepping year→month→day doesn't save intermediate dates).
  useEffect(() => {
    if (!birthdate || !age) return;
    const entry: RecentEntry = { date: birthdate, calendarType, isLeapMonth };
    const timer = setTimeout(() => {
      setRecents((prev) => pushRecent(prev, entry, 10));
    }, RECENTS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [birthdate, calendarType, isLeapMonth, age]);

  // Persist recents whenever they change (skip the first empty render).
  useEffect(() => {
    if (recents.length === 0 && birthdate === null) return;
    try {
      localStorage.setItem('jurepi-age-calculator-recents', serializeRecents(recents));
    } catch {
      /* quota — keep in-memory */
    }
  }, [recents, birthdate]);

  const setAsOfDate = useCallback((dateKey: DateKey) => setAsOfDateState(dateKey), []);
  const handleSetUseAsOf = useCallback((use: boolean) => setUseAsOf(use), []);

  const handleAddPerson = useCallback(
    (name: string, newBirthdate: DateKey, ct: CalendarType = 'solar', leap = false) => {
      if (!peopleStore) return;
      const updated = addPerson(peopleStore, name, newBirthdate, ct, leap);
      setPeopleStore(updated);
      setPeople(updated.people);
      try {
        localStorage.setItem('jurepi-age-calculator-people', JSON.stringify(updated));
      } catch {
        /* quota — keep in-memory */
      }
    },
    [peopleStore]
  );

  const handleRemovePerson = useCallback(
    (personId: string) => {
      if (!peopleStore) return;
      const updated = removePerson(peopleStore, personId);
      setPeopleStore(updated);
      setPeople(updated.people);
      try {
        localStorage.setItem('jurepi-age-calculator-people', JSON.stringify(updated));
      } catch {
        /* quota */
      }
      if (selectedPersonId === personId) setSelectedPersonId(null);
    },
    [peopleStore, selectedPersonId]
  );

  const selectRecent = useCallback(
    (entry: RecentEntry) => {
      setBirthdate(entry.date as DateKey, entry.calendarType, entry.isLeapMonth);
    },
    [setBirthdate]
  );

  const clearRecents = useCallback(() => {
    setRecents([]);
    try {
      localStorage.setItem('jurepi-age-calculator-recents', '[]');
    } catch {
      /* quota */
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const copyResultToClipboard = useCallback(async (): Promise<boolean> => {
    if (!age || !birthdate) return false;
    const lines = [
      `나이 계산기 결과`,
      `생년월일: ${birthdate}${calendarType === 'lunar' ? ' (음력)' : ''}`,
      `만 나이: ${age.manNai}세`,
      `연 나이: ${age.yeonNai}세`,
      `세는 나이: ${age.seeneunNai}세`,
      `살아온 날: ${age.daysLived}일`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      return true;
    } catch {
      return false;
    }
  }, [age, birthdate, calendarType]);

  return {
    birthdate,
    calendarType,
    isLeapMonth,
    asOfDate,
    useAsOf,
    age,
    error,
    people,
    recents,
    selectedPersonId,
    setBirthdate,
    setAsOfDate,
    setUseAsOf: handleSetUseAsOf,
    addPerson: handleAddPerson,
    removePerson: handleRemovePerson,
    selectRecent,
    clearRecents,
    clearError,
    copyResultToClipboard,
  };
}
