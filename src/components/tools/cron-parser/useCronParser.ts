'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import {
  parseCron,
  toDescriptionModel,
  computeNextRuns,
  parseQuartz,
  describeQuartz,
  computeNextRunsQuartz,
  TIMEZONE_NAMES,
  DEBOUNCE_MS,
  NEXT_RUNS_LIMIT,
  MAX_LOOKAHEAD_YEARS,
  ParsedFields,
  DescriptionModel,
  QuartzFields,
  QuartzDescriptionModel,
  NextRun,
} from '@/lib/cron-parser';

const STORAGE_KEY = 'jurepi-cron-parser-state';

const StorageSchema = z.object({
  lastExpression: z.string().default(''),
  timezone: z.string().default('Local'),
  recents: z.array(z.string()).max(20).default([]),
  mode: z.enum(['unix', 'quartz']).default('unix'),
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
  const [mode, setModeState] = useState<'unix' | 'quartz'>('unix');

  // Parse results (unix)
  const [parsedFields, setParsedFields] = useState<ParsedFields | null>(null);
  const [description, setDescription] = useState<DescriptionModel | null>(null);

  // Parse results (quartz)
  const [quartzFields, setQuartzFields] = useState<QuartzFields | null>(null);
  const [quartzDescription, setQuartzDescription] = useState<QuartzDescriptionModel | null>(null);

  // Common parse result
  const [parseError, setParseError] = useState<ParseErrorInfo | null>(null);
  const [nextRuns, setNextRuns] = useState<NextRun[] | null>(null);

  // Refs for stable callbacks and debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expressionRefRef = useRef(expression);
  const timezoneRefRef = useRef(timezone);
  const modeRefRef = useRef(mode);

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
          setModeState(data.mode);
          expressionRefRef.current = data.lastExpression;
          timezoneRefRef.current = data.timezone;
          modeRefRef.current = data.mode;
        }
      } catch {
        // Silently fail, use defaults
      }
    }
  }, []);

  // Persist state to localStorage
  const persistState = useCallback(
    (expr: string, tz: string, recs: string[], m: 'unix' | 'quartz') => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            lastExpression: expr,
            timezone: tz,
            recents: recs,
            mode: m,
          })
        );
      } catch {
        // Silently fail (quota exceeded, etc.)
      }
    },
    []
  );

  // Parse expression (called after debounce)
  const performParse = useCallback((expr: string, tz: string, m: 'unix' | 'quartz') => {
    if (!expr.trim()) {
      setParsedFields(null);
      setQuartzFields(null);
      setParseError(null);
      setDescription(null);
      setQuartzDescription(null);
      setNextRuns(null);
      return;
    }

    if (m === 'quartz') {
      // Parse as Quartz
      const fields = parseQuartz(expr);
      if (!fields.isValid && fields.error) {
        setParseError(fields.error);
        setQuartzFields(null);
        setQuartzDescription(null);
        setNextRuns(null);
        setParsedFields(null);
        setDescription(null);
      } else {
        setQuartzFields(fields);
        setParseError(null);
        setParsedFields(null);
        setDescription(null);

        const desc = describeQuartz(fields);
        setQuartzDescription(desc);

        const runs = computeNextRunsQuartz(fields, {
          now: new Date(),
          timezone: tz,
          limit: NEXT_RUNS_LIMIT,
          maxYears: MAX_LOOKAHEAD_YEARS,
        });
        setNextRuns(runs);

        // Add to recents if valid
        setRecentsState((prev) => {
          const updated = [expr, ...prev.filter((e) => e !== expr)].slice(0, 20);
          persistState(expr, tz, updated, m);
          return updated;
        });
      }
    } else {
      // Parse as Unix cron
      const fields = parseCron(expr);
      if (!fields.isValid && fields.error) {
        setParseError(fields.error);
        setParsedFields(null);
        setDescription(null);
        setNextRuns(null);
        setQuartzFields(null);
        setQuartzDescription(null);
      } else {
        setParsedFields(fields);
        setParseError(null);
        setQuartzFields(null);
        setQuartzDescription(null);

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
          persistState(expr, tz, updated, m);
          return updated;
        });
      }
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
        performParse(expr, timezoneRefRef.current, modeRefRef.current);
      }, DEBOUNCE_MS);

      // Persist expression immediately
      persistState(expr, timezoneRefRef.current, recents, modeRefRef.current);
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
      persistState(expression, tz, recents, mode);

      // Recompute nextRuns with new timezone (don't re-parse)
      if (mode === 'quartz' && quartzFields && !parseError) {
        const runs = computeNextRunsQuartz(quartzFields, {
          now: new Date(),
          timezone: tz,
          limit: NEXT_RUNS_LIMIT,
          maxYears: MAX_LOOKAHEAD_YEARS,
        });
        setNextRuns(runs);
      } else if (mode === 'unix' && parsedFields && !parseError) {
        const runs = computeNextRuns(parsedFields, {
          now: new Date(),
          timezone: tz,
          limit: NEXT_RUNS_LIMIT,
          maxYears: MAX_LOOKAHEAD_YEARS,
        });
        setNextRuns(runs);
      }
    },
    [expression, recents, mode, parsedFields, quartzFields, parseError, persistState]
  );

  // Remove recent expression
  const removeRecent = useCallback(
    (expr: string) => {
      const updated = recents.filter((r) => r !== expr);
      setRecentsState(updated);
      persistState(expression, timezone, updated, mode);
    },
    [recents, expression, timezone, mode, persistState]
  );

  // setMode (immediate, with re-parse)
  const setMode = useCallback(
    (newMode: 'unix' | 'quartz') => {
      if (newMode === mode) return;

      setModeState(newMode);
      modeRefRef.current = newMode;

      // Persist immediately
      persistState(expression, timezone, recents, newMode);

      // Re-parse with new mode
      performParse(expression, timezone, newMode);
    },
    [mode, expression, timezone, recents, persistState, performParse]
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
    mode,
    setMode,
    parsedFields,
    parseError,
    description,
    quartzFields,
    quartzDescription,
    nextRuns,
  };
}
