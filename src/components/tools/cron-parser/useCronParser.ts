'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import {
  parseCron,
  toDescriptionModel,
  computeNextRuns,
  TIMEZONE_NAMES,
  DEBOUNCE_MS,
  NEXT_RUNS_LIMIT,
  MAX_LOOKAHEAD_YEARS,
  ParsedFields,
  DescriptionModel,
  NextRun,
} from '@/lib/cron-parser';

const STORAGE_KEY = 'jurepi-cron-parser-state';

const StorageSchema = z.object({
  lastExpression: z.string().default(''),
  timezone: z.string().default('Local'),
  recents: z.array(z.string()).max(20).default([]),
});

type StorageState = z.infer<typeof StorageSchema>;

interface ParseErrorInfo {
  field: string;
  message: string;
}

export function useCronParser() {
  // State
  const [expression, setExpressionState] = useState('');
  const [timezone, setTimezoneState] = useState('Local');
  const [recents, setRecentsState] = useState<string[]>([]);

  // Parse results
  const [parsedFields, setParsedFields] = useState<ParsedFields | null>(null);
  const [parseError, setParseError] = useState<ParseErrorInfo | null>(null);
  const [description, setDescription] = useState<DescriptionModel | null>(null);
  const [nextRuns, setNextRuns] = useState<NextRun[] | null>(null);

  // Refs for stable callbacks and debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expressionRefRef = useRef(expression);
  const timezoneRefRef = useRef(timezone);

  // Load from localStorage on mount (hydration-safe)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Coerce and filter recents before validation
        if (parsed.recents && Array.isArray(parsed.recents)) {
          parsed.recents = parsed.recents.filter(
            (r: unknown) => typeof r === 'string' && r.length > 0
          );
        }

        const validated = StorageSchema.safeParse(parsed);
        if (validated.success) {
          const data = validated.data;
          setExpressionState(data.lastExpression);
          if (TIMEZONE_NAMES.includes(data.timezone)) {
            setTimezoneState(data.timezone);
          }
          setRecentsState(data.recents);
          expressionRefRef.current = data.lastExpression;
          timezoneRefRef.current = data.timezone;
        }
      } catch {
        // Silently fail, use defaults
      }
    }
  }, []);

  // Persist state to localStorage
  const persistState = useCallback(
    (expr: string, tz: string, recs: string[]) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            lastExpression: expr,
            timezone: tz,
            recents: recs,
          })
        );
      } catch {
        // Silently fail (quota exceeded, etc.)
      }
    },
    []
  );

  // Parse expression (called after debounce)
  const performParse = useCallback((expr: string, tz: string) => {
    if (!expr.trim()) {
      setParsedFields(null);
      setParseError(null);
      setDescription(null);
      setNextRuns(null);
      return;
    }

    const fields = parseCron(expr);
    if (!fields.isValid && fields.error) {
      setParseError(fields.error);
      setParsedFields(null);
      setDescription(null);
      setNextRuns(null);
    } else {
      setParsedFields(fields);
      setParseError(null);

      const desc = toDescriptionModel(fields);
      setDescription(desc);

      const runs = computeNextRuns(fields, {
        now: new Date(),
        timezone: tz,
        limit: NEXT_RUNS_LIMIT,
        maxYears: MAX_LOOKAHEAD_YEARS,
      });
      setNextRuns(runs);

      // Add to recents if valid
      setRecentsState((prev) => {
        const updated = [expr, ...prev.filter((e) => e !== expr)].slice(0, 20);
        persistState(expr, tz, updated);
        return updated;
      });
    }
  }, [persistState]);

  // setExpression with debounce
  const setExpression = useCallback(
    (expr: string) => {
      setExpressionState(expr);
      expressionRefRef.current = expr;

      // Clear existing debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        performParse(expr, timezoneRefRef.current);
      }, DEBOUNCE_MS);

      // Persist expression immediately
      persistState(expr, timezoneRefRef.current, recents);
    },
    [performParse, recents, persistState]
  );

  // setTimezone (immediate, no debounce)
  const setTimezone = useCallback(
    (tz: string) => {
      if (!TIMEZONE_NAMES.includes(tz)) {
        return; // Ignore invalid timezones
      }
      setTimezoneState(tz);
      timezoneRefRef.current = tz;

      // Persist immediately
      persistState(expression, tz, recents);

      // Recompute nextRuns with new timezone (don't re-parse)
      if (parsedFields && !parseError) {
        const runs = computeNextRuns(parsedFields, {
          now: new Date(),
          timezone: tz,
          limit: NEXT_RUNS_LIMIT,
          maxYears: MAX_LOOKAHEAD_YEARS,
        });
        setNextRuns(runs);
      }
    },
    [expression, recents, parsedFields, parseError, persistState]
  );

  // Remove recent expression
  const removeRecent = useCallback(
    (expr: string) => {
      const updated = recents.filter((r) => r !== expr);
      setRecentsState(updated);
      persistState(expression, timezone, updated);
    },
    [recents, expression, timezone, persistState]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    expression,
    setExpression,
    timezone,
    setTimezone,
    recents,
    removeRecent,
    parsedFields,
    parseError,
    description,
    nextRuns,
  };
}
