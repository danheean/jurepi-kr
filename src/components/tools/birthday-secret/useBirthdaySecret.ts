'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BirthdayCatalog, BirthProfile } from '@/lib/birthday-secret/schema';
import { RECENTS_MAX } from '@/lib/birthday-secret/schema';
import { buildProfile } from '@/lib/birthday-secret/profile';
import { buildCoupleView, type CoupleView } from '@/lib/birthday-secret/couple';
import {
  isValidMonthDay,
  monthDayKey,
  parseMonthDay,
  todayKey,
} from '@/lib/birthday-secret/date';

const STORAGE_KEY = 'jurepi-birthday-secret';

/** Read a valid ?date=MM-DD from the current URL, or null. */
function readDateFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('date');
  if (!raw) return null;
  return parseMonthDay(raw) ? raw : null;
}

function loadRecents(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((k) => typeof k === 'string' && parseMonthDay(k)).slice(0, RECENTS_MAX);
  } catch {
    return [];
  }
}

export interface UseBirthdaySecret {
  catalog: BirthdayCatalog | null;
  dateKey: string | null;
  profile: BirthProfile | null;
  todayProfile: BirthProfile | null;
  recents: string[];
  selectDate: (month: number, day: number) => void;
  selectKey: (key: string) => void;
  clearDate: () => void;
  coupleMode: boolean;
  setCoupleMode: (v: boolean) => void;
  partnerKey: string | null;
  selectPartner: (month: number, day: number) => void;
  coupleView: CoupleView | null;
}

export function useBirthdaySecret(): UseBirthdaySecret {
  const [catalog, setCatalog] = useState<BirthdayCatalog | null>(null);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [todayK, setTodayK] = useState<string | null>(null);
  const [recents, setRecents] = useState<string[]>([]);
  const [coupleMode, setCoupleMode] = useState(false);
  const [partnerKey, setPartnerKey] = useState<string | null>(null);

  // Load catalog (code-split) once.
  useEffect(() => {
    let alive = true;
    import('@/components/tools/birthday-secret/data/birthday-secret.generated.json')
      .then((mod) => {
        if (alive) setCatalog(mod.default as unknown as BirthdayCatalog);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Hydration-safe: read URL date + today + recents only after mount.
  useEffect(() => {
    setTodayK(todayKey(new Date()));
    setRecents(loadRecents());
    const fromUrl = readDateFromUrl();
    if (fromUrl) setDateKey(fromUrl);
  }, []);

  const persistRecent = useCallback((key: string) => {
    setRecents((prev) => {
      const next = [key, ...prev.filter((k) => k !== key)].slice(0, RECENTS_MAX);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* private mode → in-memory only */
      }
      return next;
    });
  }, []);

  const selectKey = useCallback(
    (key: string) => {
      if (!parseMonthDay(key)) return;
      setDateKey(key);
      persistRecent(key);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('date', key);
        window.history.replaceState(null, '', url.toString());
      } catch {
        /* ignore */
      }
    },
    [persistRecent]
  );

  const selectDate = useCallback(
    (month: number, day: number) => {
      if (!isValidMonthDay(month, day)) return;
      selectKey(monthDayKey(month, day));
    },
    [selectKey]
  );

  const clearDate = useCallback(() => {
    setDateKey(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('date');
      window.history.replaceState(null, '', url.toString());
    } catch {
      /* ignore */
    }
  }, []);

  const selectPartner = useCallback((month: number, day: number) => {
    if (!isValidMonthDay(month, day)) return;
    setPartnerKey(monthDayKey(month, day));
  }, []);

  const profile = useMemo(
    () => (catalog && dateKey ? buildProfile(catalog, dateKey) : null),
    [catalog, dateKey]
  );
  const todayProfile = useMemo(
    () => (catalog && todayK ? buildProfile(catalog, todayK) : null),
    [catalog, todayK]
  );
  const partnerProfile = useMemo(
    () => (catalog && partnerKey ? buildProfile(catalog, partnerKey) : null),
    [catalog, partnerKey]
  );
  const coupleView = useMemo(
    () => (profile && partnerProfile ? buildCoupleView(profile, partnerProfile) : null),
    [profile, partnerProfile]
  );

  return {
    catalog,
    dateKey,
    profile,
    todayProfile,
    recents,
    selectDate,
    selectKey,
    clearDate,
    coupleMode,
    setCoupleMode,
    partnerKey,
    selectPartner,
    coupleView,
  };
}
