# Unit Converter — Clean Architecture Blueprint

**Status:** FROZEN for parallel team execution (domain → hook → UI/platform → SEO → QA)  
**Registry order:** 28  
**Category accent:** `sky` (real token: `--accent-sky` #38bdf8)  
**Build reference:** base64-encoder, character-counter (same client-SPA pattern)  

---

## A. Layer Decomposition (Clean Architecture)

### **Layer 1: Domain (Pure, NO React/Next/DOM)**
**Location:** `src/lib/unit-converter/`  
**Owned:** All conversion math, temperature affine algebra, precision formatting, recents persistence schema.  
**Dependency rule:** NEVER import `react`, `next`, `lucide-react`, DOM APIs. Uses only `zod`, `Intl`, and native JS.

#### **Module Contracts**

##### **1. `types.ts`** — Shared type definitions (frozen)
```typescript
// Category enumeration
export type CategoryId = 'length' | 'mass' | 'temperature' | 'area' | 'volume' | 'speed' | 'digital_storage' | 'time';

// Single unit of measurement
export interface Unit {
  id: string;           // e.g., "meter", "foot", "kelvin"
  symbol: string;       // e.g., "m", "ft", "K"
  category: CategoryId;
  // EXACTLY ONE of the following (not both):
  factor?: number;      // for non-temperature: ratio to base unit (e.g., meter=1, km=1000)
  tempFormula?: { a: number; b: number }; // for temperature: T_target = T_source × a + b
}

export interface Category {
  id: CategoryId;
  label: string;        // localized from i18n tools.unit-converter.categories.<id>
  icon: string;         // lucide icon name (e.g., 'Ruler', 'Weight')
  units: Unit[];
  canonicalPair: { from: string; to: string }; // default from/to unit IDs on category select
}

export interface ConversionResult {
  fromValue: number;
  toValue: number;
  fromUnit: string;
  toUnit: string;
  category: CategoryId;
  precision: number;
  formatted: string;    // toValue formatted to precision decimals
}

export interface RecentsEntry {
  categoryId: CategoryId;
  fromUnit: string;
  toUnit: string;
  fromValue: number;
  toValue: number;
  timestamp: number;
}

export interface RecentsStore {
  version: number;      // STORE_VERSION = 1
  recents: RecentsEntry[];
  metadata: { createdAt: number };
}

export const RECENTS_MAX = 20;
export const CONVERSION_DEBOUNCE = 50; // ms
export const PRECISION_MIN = 0;
export const PRECISION_MAX = 6;
export const PRECISION_DEFAULT = 2;
```

##### **2. `constants.ts`** — Category + Unit definitions (frozen seed data)
```typescript
import { Category, Unit } from './types';

// CATEGORIES array with units (in declaration order matching category tab order)
export const CATEGORIES: Category[] = [
  {
    id: 'length',
    label: '', // i18n tools.unit-converter.categories.length
    icon: 'Ruler',
    units: [
      { id: 'meter', symbol: 'm', category: 'length', factor: 1 },
      { id: 'millimeter', symbol: 'mm', category: 'length', factor: 0.001 },
      { id: 'centimeter', symbol: 'cm', category: 'length', factor: 0.01 },
      { id: 'kilometer', symbol: 'km', category: 'length', factor: 1000 },
      { id: 'inch', symbol: 'in', category: 'length', factor: 0.0254 },
      { id: 'foot', symbol: 'ft', category: 'length', factor: 0.3048 },
      { id: 'yard', symbol: 'yd', category: 'length', factor: 0.9144 },
      { id: 'mile', symbol: 'mi', category: 'length', factor: 1609.34 },
    ],
    canonicalPair: { from: 'meter', to: 'kilometer' },
  },
  {
    id: 'mass',
    label: '', // i18n tools.unit-converter.categories.mass
    icon: 'Weight',
    units: [
      { id: 'kilogram', symbol: 'kg', category: 'mass', factor: 1 },
      { id: 'gram', symbol: 'g', category: 'mass', factor: 0.001 },
      { id: 'milligram', symbol: 'mg', category: 'mass', factor: 1e-6 },
      { id: 'ounce', symbol: 'oz', category: 'mass', factor: 0.0283495 },
      { id: 'pound', symbol: 'lb', category: 'mass', factor: 0.453592 },
    ],
    canonicalPair: { from: 'kilogram', to: 'pound' },
  },
  {
    id: 'temperature',
    label: '', // i18n tools.unit-converter.categories.temperature
    icon: 'Thermometer',
    units: [
      { id: 'celsius', symbol: '°C', category: 'temperature', tempFormula: { a: 1, b: 0 } }, // base
      { id: 'fahrenheit', symbol: '°F', category: 'temperature', tempFormula: { a: 9/5, b: 32 } }, // C→F
      { id: 'kelvin', symbol: 'K', category: 'temperature', tempFormula: { a: 1, b: 273.15 } }, // C→K
    ],
    canonicalPair: { from: 'celsius', to: 'fahrenheit' },
  },
  {
    id: 'area',
    label: '', // i18n tools.unit-converter.categories.area
    icon: 'Maximize2',
    units: [
      { id: 'square_meter', symbol: 'm²', category: 'area', factor: 1 },
      { id: 'square_millimeter', symbol: 'mm²', category: 'area', factor: 1e-6 },
      { id: 'square_centimeter', symbol: 'cm²', category: 'area', factor: 0.0001 },
      { id: 'square_kilometer', symbol: 'km²', category: 'area', factor: 1e6 },
      { id: 'square_inch', symbol: 'in²', category: 'area', factor: 0.00064516 },
      { id: 'square_foot', symbol: 'ft²', category: 'area', factor: 0.092903 },
      { id: 'square_yard', symbol: 'yd²', category: 'area', factor: 0.836127 },
      { id: 'square_mile', symbol: 'mi²', category: 'area', factor: 2.58999e6 },
    ],
    canonicalPair: { from: 'square_meter', to: 'square_foot' },
  },
  {
    id: 'volume',
    label: '', // i18n tools.unit-converter.categories.volume
    icon: 'Container',
    units: [
      { id: 'liter', symbol: 'L', category: 'volume', factor: 0.001 }, // base = m³
      { id: 'milliliter', symbol: 'mL', category: 'volume', factor: 1e-6 },
      { id: 'cubic_inch', symbol: 'in³', category: 'volume', factor: 1.63871e-5 },
      { id: 'cubic_foot', symbol: 'ft³', category: 'volume', factor: 0.0283168 },
      { id: 'gallon', symbol: 'gal', category: 'volume', factor: 0.00378541 }, // US gallon
    ],
    canonicalPair: { from: 'liter', to: 'gallon' },
  },
  {
    id: 'speed',
    label: '', // i18n tools.unit-converter.categories.speed
    icon: 'Zap',
    units: [
      { id: 'meter_per_second', symbol: 'm/s', category: 'speed', factor: 1 },
      { id: 'kilometer_per_hour', symbol: 'km/h', category: 'speed', factor: 1/3.6 },
      { id: 'mile_per_hour', symbol: 'mi/h', category: 'speed', factor: 0.44704 },
      { id: 'knot', symbol: 'knot', category: 'speed', factor: 0.51444 },
    ],
    canonicalPair: { from: 'meter_per_second', to: 'kilometer_per_hour' },
  },
  {
    id: 'digital_storage',
    label: '', // i18n tools.unit-converter.categories.digital_storage
    icon: 'Database',
    units: [
      { id: 'byte', symbol: 'B', category: 'digital_storage', factor: 1 },
      { id: 'kilobyte', symbol: 'KB', category: 'digital_storage', factor: 1000 }, // decimal
      { id: 'megabyte', symbol: 'MB', category: 'digital_storage', factor: 1e6 },
      { id: 'gigabyte', symbol: 'GB', category: 'digital_storage', factor: 1e9 },
      { id: 'terabyte', symbol: 'TB', category: 'digital_storage', factor: 1e12 },
      { id: 'kibibyte', symbol: 'KiB', category: 'digital_storage', factor: 1024 }, // binary
      { id: 'mebibyte', symbol: 'MiB', category: 'digital_storage', factor: 1048576 },
      { id: 'gibibyte', symbol: 'GiB', category: 'digital_storage', factor: 1073741824 },
      { id: 'tebibyte', symbol: 'TiB', category: 'digital_storage', factor: 1099511627776 },
    ],
    canonicalPair: { from: 'kilobyte', to: 'megabyte' },
  },
  {
    id: 'time',
    label: '', // i18n tools.unit-converter.categories.time
    icon: 'Clock',
    units: [
      { id: 'millisecond', symbol: 'ms', category: 'time', factor: 0.001 },
      { id: 'second', symbol: 's', category: 'time', factor: 1 },
      { id: 'minute', symbol: 'min', category: 'time', factor: 60 },
      { id: 'hour', symbol: 'h', category: 'time', factor: 3600 },
      { id: 'day', symbol: 'day', category: 'time', factor: 86400 },
    ],
    canonicalPair: { from: 'second', to: 'minute' },
  },
];

// Convenience lookup: { categoryId → { unitId → Unit } }
export const UNITS_BY_CATEGORY: Record<CategoryId, Record<string, Unit>> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.id] = Object.fromEntries(cat.units.map(u => [u.id, u]));
    return acc;
  },
  {} as Record<CategoryId, Record<string, Unit>>
);
```

##### **3. `converters/*.ts`** — Category-specific conversion logic (frozen)
Each converter exports a single function + unit constant. Example:

```typescript
// converters/length.ts
export const UNITS = {
  meter: 1,
  millimeter: 0.001,
  centimeter: 0.01,
  kilometer: 1000,
  inch: 0.0254,
  foot: 0.3048,
  yard: 0.9144,
  mile: 1609.34,
};

/**
 * Convert a length value from one unit to another.
 * @param value — numeric input (can be any magnitude)
 * @param fromUnit — unit symbol or id (e.g., "m", "meter", "ft", "foot")
 * @param toUnit — target unit symbol or id
 * @returns converted value (Float64)
 */
export function convert(value: number, fromUnit: string, toUnit: string): number {
  const fromFactor = UNITS[fromUnit] ?? UNITS[fromUnit.toLowerCase()];
  const toFactor = UNITS[toUnit] ?? UNITS[toUnit.toLowerCase()];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown unit: from=${fromUnit} to=${toUnit}`);
  }
  return (value * fromFactor) / toFactor;
}

export function validateUnit(unit: string): boolean {
  return unit in UNITS;
}
```

**Temperature is special** (affine, not factor-based):
```typescript
// converters/temperature.ts
export const FORMULAS: Record<string, { a: number; b: number }> = {
  celsius: { a: 1, b: 0 },      // base
  fahrenheit: { a: 9/5, b: 32 },  // C→F: (C × 9/5) + 32
  kelvin: { a: 1, b: 273.15 },    // C→K: C + 273.15
};

/**
 * Convert temperature from one unit to another.
 * All conversions go through Celsius as an intermediary.
 * @example convert(32, 'fahrenheit', 'celsius') → 0
 * @example convert(273.15, 'kelvin', 'celsius') → 0
 * @example convert(0, 'celsius', 'fahrenheit') → 32
 */
export function convert(value: number, fromUnit: string, toUnit: string): number {
  // Normalize unit names (celsius/°C, fahrenheit/°F, etc.)
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);
  
  if (!FORMULAS[normalizedFrom] || !FORMULAS[normalizedTo]) {
    throw new Error(`Unknown temperature unit: from=${fromUnit} to=${toUnit}`);
  }
  
  // Step 1: Convert fromUnit → Celsius
  const { a: a1, b: b1 } = FORMULAS[normalizedFrom];
  const celsius = (value - b1) / a1;
  
  // Step 2: Convert Celsius → toUnit
  const { a: a2, b: b2 } = FORMULAS[normalizedTo];
  const result = (celsius * a2) + b2;
  
  return result;
}

function normalizeUnit(unit: string): string {
  const map: Record<string, string> = {
    'c': 'celsius', '°c': 'celsius', '℃': 'celsius',
    'f': 'fahrenheit', '°f': 'fahrenheit', '℉': 'fahrenheit',
    'k': 'kelvin',
  };
  return map[unit.toLowerCase()] ?? unit.toLowerCase();
}

export function validateUnit(unit: string): boolean {
  return normalizeUnit(unit) in FORMULAS;
}
```

**All other converters follow the `length.ts` pattern** (mass, area, volume, speed, digital-storage, time).

##### **4. `convert.ts`** — Router by category + unit (frozen)
```typescript
import { CategoryId, ConversionResult } from './types';
import * as length from './converters/length';
import * as mass from './converters/mass';
import * as temperature from './converters/temperature';
import * as area from './converters/area';
import * as volume from './converters/volume';
import * as speed from './converters/speed';
import * as digitalStorage from './converters/digital-storage';
import * as time from './converters/time';

const convertersByCategory = {
  length, mass, temperature, area, volume, speed, digital_storage: digitalStorage, time,
};

/**
 * Dispatch to the appropriate category converter.
 * @param category — one of the 8 CategoryId values
 * @param value — numeric input
 * @param fromUnit — unit string
 * @param toUnit — unit string
 * @returns converted numeric value
 */
export function convert(
  category: CategoryId,
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const converter = convertersByCategory[category];
  if (!converter) {
    throw new Error(`Unknown category: ${category}`);
  }
  return converter.convert(value, fromUnit, toUnit);
}

/**
 * Validate that a unit exists in a category.
 */
export function validateUnit(category: CategoryId, unit: string): boolean {
  const converter = convertersByCategory[category];
  if (!converter) return false;
  return converter.validateUnit(unit);
}
```

##### **5. `precision.ts`** — Formatting via Intl (frozen)
```typescript
/**
 * Format a number to a given number of decimal places using Intl.NumberFormat.
 * @param value — numeric value to format
 * @param decimals — number of decimal places (0–6)
 * @param locale — BCP 47 locale (e.g., 'ko', 'en')
 * @returns formatted string (e.g., "1,234.56" for en, "1234,56" for de)
 */
export function formatNumber(value: number, decimals: number, locale: string = 'en'): string {
  // Clamp decimals to [0, 6]
  const clampedDecimals = Math.min(6, Math.max(0, decimals));
  
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: clampedDecimals,
    maximumFractionDigits: clampedDecimals,
    // Do NOT use `notation: 'scientific'` — display as decimal
  });
  
  return formatter.format(value);
}
```

##### **6. `schema.ts`** — Zod validation (frozen)
```typescript
import { z } from 'zod';
import { CategoryId, RecentsStore } from './types';

const UnitSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  category: z.enum(['length', 'mass', 'temperature', 'area', 'volume', 'speed', 'digital_storage', 'time']),
  factor: z.number().optional(),
  tempFormula: z.object({ a: z.number(), b: z.number() }).optional(),
});

const RecentsEntrySchema = z.object({
  categoryId: z.enum(['length', 'mass', 'temperature', 'area', 'volume', 'speed', 'digital_storage', 'time']),
  fromUnit: z.string(),
  toUnit: z.string(),
  fromValue: z.number(),
  toValue: z.number(),
  timestamp: z.number(),
});

export const RecentsStoreSchema = z.object({
  version: z.number(),
  recents: z.array(RecentsEntrySchema),
  metadata: z.object({
    createdAt: z.number(),
  }),
});

export type RecentsStoreType = z.infer<typeof RecentsStoreSchema>;
```

##### **7. `recents.ts`** — Immutable localStorage ops (frozen)
```typescript
import { RecentsEntry, RecentsStore, RECENTS_MAX } from './types';
import { RecentsStoreSchema } from './schema';
import { UNITS_BY_CATEGORY } from './constants';

const STORE_VERSION = 1;

/**
 * Add a new entry to the recents list (immutable).
 * @param list — current RecentsEntry[]
 * @param entry — new entry to add
 * @param maxEntries — max size (default RECENTS_MAX=20)
 * @returns new list with entry prepended, duplicates removed, trimmed to max
 */
export function addRecent(
  list: RecentsEntry[],
  entry: Omit<RecentsEntry, 'timestamp'>,
  maxEntries: number = RECENTS_MAX
): RecentsEntry[] {
  const entryWithTs: RecentsEntry = { ...entry, timestamp: Date.now() };
  // Remove any existing entry with the same category + from/to (MRU deduplication)
  const filtered = list.filter(
    r => !(r.categoryId === entry.categoryId && r.fromUnit === entry.fromUnit && r.toUnit === entry.toUnit)
  );
  // Prepend new entry, trim to max
  return [entryWithTs, ...filtered].slice(0, maxEntries);
}

/**
 * Remove entries with unknown units (category evolution safeguard).
 */
export function pruneUnknown(list: RecentsEntry[]): RecentsEntry[] {
  return list.filter(entry => {
    const unitsInCategory = UNITS_BY_CATEGORY[entry.categoryId];
    if (!unitsInCategory) return false;
    return entry.fromUnit in unitsInCategory && entry.toUnit in unitsInCategory;
  });
}

/**
 * Deserialize localStorage blob to RecentsStore (safe).
 * @param blob — JSON string from localStorage
 * @returns RecentsStore if valid, else fresh { version, recents: [], metadata: { createdAt: now } }
 */
export function deserialize(blob: string | null): RecentsStore {
  if (!blob) {
    return { version: STORE_VERSION, recents: [], metadata: { createdAt: Date.now() } };
  }
  try {
    const parsed = JSON.parse(blob);
    const validated = RecentsStoreSchema.parse(parsed);
    return validated;
  } catch (e) {
    // Zod validation or JSON parse error → start fresh
    return { version: STORE_VERSION, recents: [], metadata: { createdAt: Date.now() } };
  }
}

/**
 * Serialize RecentsStore to JSON string.
 */
export function serialize(store: RecentsStore): string {
  return JSON.stringify(store);
}
```

##### **8. `index.ts`** — Barrel export (frozen)
```typescript
export * from './types';
export * from './constants';
export * from './convert';
export * from './precision';
export * from './recents';
export * from './schema';
```

---

### **Layer 2: Use Case (Hook Adapter)**
**Location:** `src/components/tools/unit-converter/useUnitConverter.ts`  
**Owned:** State management, localStorage persistence, derived conversions, error handling.  
**Consumed by:** UnitConverter.tsx orchestrator component.

#### **Hook Contract (frozen)**
```typescript
/**
 * useUnitConverter() — Single-source-of-truth for all tool state.
 * Mount loads localStorage; changes persist with rules:
 * - Discrete state (category, units, precision) persist IMMEDIATELY.
 * - Value/recents persist with DEBOUNCE (100ms value, addRecent after conversion).
 * - Callbacks avoid stale-closure anti-pattern: values passed as args, not captured.
 */
export function useUnitConverter() {
  // State (all frozen after initialization, changed via action callbacks)
  const [category, setCategory] = useState<CategoryId>('length');
  const [fromUnit, setFromUnit] = useState<string>('meter');
  const [toUnit, setToUnit] = useState<string>('kilometer');
  const [fromValue, setFromValue] = useState<string>('');
  const [precision, setPrecision] = useState<number>(PRECISION_DEFAULT);
  const [recents, setRecents] = useState<RecentsEntry[]>([]);
  const [error, setError] = useState<string>('');

  // Derived (computed on every render)
  const toValue: number | null = useMemo(() => {
    if (!fromValue || isNaN(Number(fromValue))) return null;
    try {
      const num = Number(fromValue);
      // Validate range for non-temperature
      if (category !== 'temperature' && num < 0) {
        setError('Negative values only allowed for temperature');
        return null;
      }
      const result = convert(category, num, fromUnit, toUnit);
      if (!isFinite(result)) {
        setError('Conversion result out of range');
        return null;
      }
      setError('');
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion error');
      return null;
    }
  }, [fromValue, fromUnit, toUnit, category]);

  const formattedToValue: string = useMemo(() => {
    if (toValue === null) return '';
    return formatNumber(toValue, precision, locale);
  }, [toValue, precision, locale]);

  // Lifecycle: mount + cleanup
  useEffect(() => {
    // Read localStorage on mount
    const stored = deserialize(localStorage.getItem('jurepi-unit-converter'));
    const pruned = pruneUnknown(stored.recents);
    setRecents(pruned);
    // Category to canonical pair (from CATEGORIES constant)
    const cat = CATEGORIES.find(c => c.id === category);
    if (cat) {
      setFromUnit(cat.canonicalPair.from);
      setToUnit(cat.canonicalPair.to);
    }
    setFromValue('');
  }, []);

  // Debounced value + recents persistence (100ms)
  const addRecentRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    // Clear prior timeout
    if (addRecentRef.current) clearTimeout(addRecentRef.current);
    
    // Debounce: if user stops typing for 100ms, save recents + value
    addRecentRef.current = setTimeout(() => {
      const store: RecentsStore = {
        version: 1,
        recents: fromValue && toValue ? addRecent(recents, {
          categoryId: category,
          fromUnit,
          toUnit,
          fromValue: Number(fromValue),
          toValue,
        }) : recents,
        metadata: { createdAt: Date.now() },
      };
      try {
        localStorage.setItem('jurepi-unit-converter', serialize(store));
      } catch (e) {
        // Quota exceeded or disabled → keep in-memory, silent
      }
    }, 100);

    return () => {
      if (addRecentRef.current) clearTimeout(addRecentRef.current);
    };
  }, [fromValue, toValue, fromUnit, toUnit, category, recents]);

  // Discrete state persistence (IMMEDIATE, no debounce)
  useEffect(() => {
    const store = deserialize(localStorage.getItem('jurepi-unit-converter'));
    try {
      localStorage.setItem('jurepi-unit-converter', serialize({
        ...store,
        recents,
      }));
    } catch (e) {
      // Silent
    }
  }, [category, fromUnit, toUnit, precision]);

  // Action callbacks (avoid captured state via functional setState)
  const handleSetCategory = useCallback((catId: CategoryId) => {
    setCategory(catId);
    const cat = CATEGORIES.find(c => c.id === catId);
    if (cat) {
      setFromUnit(cat.canonicalPair.from);
      setToUnit(cat.canonicalPair.to);
    }
    setFromValue(''); // Reset input on category change
    setError('');
  }, []);

  const handleSwap = useCallback(() => {
    setFromUnit(prev => {
      const temp = toUnit;
      setToUnit(prev);
      return temp;
    });
  }, [fromUnit, toUnit]);

  const handleClearRecents = useCallback(() => {
    setRecents([]);
    try {
      const store = deserialize(localStorage.getItem('jurepi-unit-converter'));
      localStorage.setItem('jurepi-unit-converter', serialize({
        ...store,
        recents: [],
      }));
    } catch (e) {
      // Silent
    }
  }, []);

  const handleRestoreRecent = useCallback((entry: RecentsEntry) => {
    handleSetCategory(entry.categoryId);
    setFromUnit(entry.fromUnit);
    setToUnit(entry.toUnit);
    setFromValue(String(entry.fromValue));
  }, [handleSetCategory]);

  return {
    // State
    category,
    fromUnit,
    toUnit,
    fromValue,
    toValue,
    formattedToValue,
    precision,
    recents,
    error,
    // Actions
    setCategory: handleSetCategory,
    setFromUnit,
    setToUnit,
    setFromValue,
    setPrecision,
    swap: handleSwap,
    clearRecents: handleClearRecents,
    restoreRecent: handleRestoreRecent,
  };
}

// Return type (frozen contract)
export type UseUnitConverterReturn = ReturnType<typeof useUnitConverter>;
```

---

### **Layer 3: Presentation (React Components)**
**Location:** `src/components/tools/unit-converter/`  
**Owned:** All React + UI rendering, keyboard a11y, interaction.  
**Consumes:** hook state + actions, exported as isolated, testable components.

#### **Component List & Props (frozen)**

| Component | Props | Role |
|-----------|-------|------|
| **CategoryTabs** | `categories: Category[]`, `active: CategoryId`, `onChange: (id: CategoryId) => void` | 8 horizontal pills; ArrowLeft/Right keyboard nav; role="tablist" |
| **ConversionInput** | `value: string`, `onChange: (v: string) => void`, `error?: string` | Number input; validation on blur; aria-label, placeholder i18n |
| **UnitPicker** | `category: CategoryId`, `selectedId: string`, `onChange: (id: string) => void`, `placeholder?: string` | Dropdown/combobox; open on click/focus; searchable (debounced 100ms); ArrowUp/Down/Home/End/Enter/Esc |
| **SwapButton** | `fromUnit: string`, `toUnit: string`, `onClick: () => void` | Icon button (ArrowRightLeft); rotate 180° on click 200ms; aria-label i18n |
| **PrecisionSlider** | `value: number`, `onChange: (v: number) => void` | Range [0–6]; aria-valuetext = "N decimal places"; live display |
| **ConversionTable** | `category: CategoryId`, `fromValue?: number`, `precision: number` | Read-only matrix: all unit pairs × conversions (responsive 4-col / 2-col / 1-col) |
| **RecentsPanel** | `recents: RecentsEntry[]`, `onRestore: (e: RecentsEntry) => void`, `onClear: () => void` | MRU history + clear button; empty state message; relative timestamps |
| **UnitConverterIntro** | (none) | H1 + lead (server-render where possible, gate outside mounted) |
| **UnitConverterHowTo** | (none) | "How unit conversions work?" long-form (gate outside mounted) |
| **UnitConverterFaq** | (none) | Q&A list + emits FAQPage JSON-LD (gate outside mounted) |
| **UnitConverterStructuredData** | (none) | SoftwareApplication JSON-LD (emitted by route) |

**Note:** Intro/HowTo/Faq/StructuredData are **gate-outside** (SSR rendered by route, NOT by UnitConverter orchestrator). The orchestrator (`UnitConverter.tsx`) only renders interactive components.

#### **Keyboard + A11y Requirements**
- **CategoryTabs:** roving tabindex (one tab tabbable at a time); ArrowLeft/Right to move; ArrowLeft at first → wrap to last.
- **UnitPicker:** `<select>` element OR accessible combobox with `role="combobox"`, `aria-expanded`, `aria-controls`. ArrowUp/Down navigate list; Home/End jump; Enter selects; Esc closes.
- **ConversionInput:** `<input type="number">` with associated `<label>` (or aria-label); focused = 2px `--focus-ring` border, live aria-live="polite" error messages.
- **PrecisionSlider:** `<input type="range">` with aria-valuetext = "N decimal places".
- **RecentsPanel:** each entry is a button (aria-label = conversion description); clear button aria-label.
- **Error messages:** aria-live="polite" + role="alert" for validation errors.
- **Contrast:** All text ≥4.5:1 on white/surface background. Error red 0xef4444 on white = ✓ WCAG AA.

---

### **Layer 4: Platform (Next.js Integration)**
**Location:** Route at `src/app/[locale]/tools/[slug]/page.tsx` (platform-owned)  
**This blueprint specifies the wiring:**

```typescript
// Branch for unit-converter (part of the dynamic tool route)
import dynamic from 'next/dynamic';
import { buildToolMetadata } from '@/lib/seo';

const UnitConverterIntro = dynamic(() => import('@/components/tools/unit-converter/UnitConverterIntro'));
const UnitConverterComponent = dynamic(() => import('@/components/tools/unit-converter/UnitConverter'), { ssr: false });
const UnitConverterHowTo = dynamic(() => import('@/components/tools/unit-converter/UnitConverterHowTo'));
const UnitConverterFaq = dynamic(() => import('@/components/tools/unit-converter/UnitConverterFaq'));
const UnitConverterStructuredData = dynamic(() => import('@/components/tools/unit-converter/UnitConverterStructuredData'));

if (slug === 'unit-converter') {
  return (
    <>
      <StructuredData data={UnitConverterStructuredData} />
      <UnitConverterIntro />
      <UnitConverterComponent />
      <UnitConverterHowTo />
      <UnitConverterFaq />
      {/* ShareButtons rendered by template, NOT by tool */}
    </>
  );
}
```

**Registry entry** (in `src/tools/registry.ts`):
```typescript
{
  id: 'unit-converter',
  slug: 'unit-converter',
  category: 'converter',
  icon: 'Ruler',
  accent: 'sky',
  status: 'live',
  order: 28,
  keywords: ['단위변환','길이','무게','온도','시간','변환','unit','conversion','length','weight','temperature','time'],
},
```

**Metadata generation** (in route `generateMetadata` branch):
```typescript
case 'unit-converter':
  return buildToolMetadata({
    title: t('tools.unit-converter.meta.title'),
    description: t('tools.unit-converter.meta.description'),
    url: absoluteToolUrl(locale, 'unit-converter'),
    canonical: absoluteToolUrl('en', 'unit-converter'), // or locale-specific
    hreflang: { ko: absoluteToolUrl('ko', 'unit-converter'), en: absoluteToolUrl('en', 'unit-converter') },
  });
```

---

## B. Public API Contracts (FROZEN)

### **Domain exports** (from `lib/unit-converter/index.ts`)
```typescript
// Types
export type CategoryId, Unit, Category, ConversionResult, RecentsEntry, RecentsStore;

// Constants
export const CATEGORIES: Category[];
export const UNITS_BY_CATEGORY: Record<CategoryId, Record<string, Unit>>;
export const RECENTS_MAX = 20;
export const PRECISION_MIN = 0, PRECISION_MAX = 6, PRECISION_DEFAULT = 2;

// Functions
export function convert(category: CategoryId, value: number, from: string, to: string): number;
export function validateUnit(category: CategoryId, unit: string): boolean;
export function formatNumber(value: number, decimals: number, locale?: string): string;
export function addRecent(list: RecentsEntry[], entry: Omit<RecentsEntry, 'timestamp'>, maxEntries?: number): RecentsEntry[];
export function pruneUnknown(list: RecentsEntry[]): RecentsEntry[];
export function deserialize(blob: string | null): RecentsStore;
export function serialize(store: RecentsStore): string;
```

### **Hook returns** (from `useUnitConverter()`)
```typescript
{
  category: CategoryId;
  fromUnit: string;
  toUnit: string;
  fromValue: string;
  toValue: number | null;
  formattedToValue: string;
  precision: number;
  recents: RecentsEntry[];
  error: string;
  setCategory: (id: CategoryId) => void;
  setFromUnit: (id: string) => void;
  setToUnit: (id: string) => void;
  setFromValue: (v: string) => void;
  setPrecision: (n: number) => void;
  swap: () => void;
  clearRecents: () => void;
  restoreRecent: (e: RecentsEntry) => void;
}
```

---

## C. i18n Key Contract (CRITICAL — separate ko / en columns)

**Namespace:** `tools.unit-converter.*`

| key | ko | en |
|-----|----|----|
| `tools.unit-converter.meta.title` | 단위 변환기 | Unit Converter |
| `tools.unit-converter.meta.description` | 길이, 무게, 온도 등 일상의 측정값을 즉시 변환하세요 | Convert everyday measurements instantly |
| `tools.unit-converter.eyebrow` | 변환 도구 | CONVERTER TOOL |
| `tools.unit-converter.title` | 단위 변환기 | Unit Converter |
| `tools.unit-converter.lead` | 길이·무게·온도·시간 등 일상의 측정값을 즉시 변환하세요. | Convert lengths, weights, temperatures, times, and more in real time. |
| `tools.unit-converter.categories.length` | 길이 | Length |
| `tools.unit-converter.categories.mass` | 무게 | Weight |
| `tools.unit-converter.categories.temperature` | 온도 | Temperature |
| `tools.unit-converter.categories.area` | 넓이 | Area |
| `tools.unit-converter.categories.volume` | 부피 | Volume |
| `tools.unit-converter.categories.speed` | 속도 | Speed |
| `tools.unit-converter.categories.digital_storage` | 용량 | Digital Storage |
| `tools.unit-converter.categories.time` | 시간 | Time |
| `tools.unit-converter.conversionInput.placeholder` | 값을 입력하세요 | Enter value |
| `tools.unit-converter.buttons.swap` | 단위 맞바꾸기 | Swap units |
| `tools.unit-converter.buttons.clear` | 기록 삭제 | Clear history |
| `tools.unit-converter.precision.label` | 소수점 자리수 | Decimal places |
| `tools.unit-converter.precision.caption` | {count}자리 | {count} places |
| `tools.unit-converter.recents.heading` | 최근 변환 | Recent Conversions |
| `tools.unit-converter.recents.empty` | 변환 기록이 없습니다 | No conversions yet |
| `tools.unit-converter.table.heading` | 변환표 | Conversion Table |
| `tools.unit-converter.table.empty` | 이 카테고리의 단위가 없습니다 | No units in this category |
| `tools.unit-converter.errors.invalidNumber` | 숫자를 입력해주세요 | Please enter a number |
| `tools.unit-converter.errors.negativeNonTemp` | 온도를 제외한 음수는 허용되지 않습니다 | Negative values only allowed for temperature |
| `tools.unit-converter.errors.outOfRange` | 입력 범위를 초과했습니다 | Number out of range |
| `tools.unit-converter.intro.copy` | 일상의 측정값은 순간에 변환됩니다 | Everyday conversions, instant results |
| `tools.unit-converter.howTo.answer` | (long-form how-to text, HTML allowed) | (English equivalent) |
| `tools.unit-converter.faq.items[0].q` | 온도는 어떻게 변환되나요? | How is temperature converted? |
| `tools.unit-converter.faq.items[0].a` | 온도는 선형 함수로 변환됩니다. 예: °C = (°F - 32) × 5/9 | Temperature uses affine transformation. Example: °C = (°F - 32) × 5/9 |
| `tools.unit-converter.faq.items[1].q` | 단위가 정확한가요? | Are the conversion factors accurate? |
| `tools.unit-converter.faq.items[1].a` | 모든 단위는 국제 표준(SI)을 따릅니다 | All factors follow international SI standards |
| (add more FAQ items as needed) | ... | ... |

---

## D. Design Token Usage (Real tokens from DESIGN.md)

### **Color Identity**
- **Accent:** `--accent-sky` (#38bdf8) for active tabs, slider thumb, focus highlights
- **Accent Soft:** `--accent-sky-soft` (#ddf2fe) for inactive tab backgrounds, hover states
- **Primary Action:** `--brand` (honey-gold #f5a623) for primary buttons only — **never swap with accent**
- **Text on Brand:** `--on-brand` (dark honey #3a2a05) for text inside brand-filled surfaces
- **Brand Ink:** `--brand-ink` (honey-ink #9a6400) for links, wordmark, ghost buttons
- **Surfaces:** `--surface` (white), `--surface-muted` (cream #faf6ee), `--surface-sunken` (deeper cream)
- **Text:** `--text` (warm near-black #2a2411), `--text-secondary` (#6b6042), `--text-muted` (#7a6f52)
- **Focus Ring:** `--focus-ring` (equals `--brand-ink`) for 2px visible outline on inputs/buttons
- **Hairline:** `--hairline` (#f0e9da) for 1px borders, dividers
- **Semantic Error:** `--semantic-danger` (#ef4444, but actual implementation uses `danger` with opacity e.g. `bg-danger/10` for banner)

### **Forbidden Phantom Tokens** (explicit list of errors seen in project history)
❌ `--semantic-*` (use real danger/warning/success)  
❌ `--surface-hover` (doesn't exist)  
❌ `--surface-secondary` (doesn't exist; use `--surface-muted`)  
❌ `--brand-dark` (doesn't exist)  
❌ `--danger-50/200` (doesn't exist; use `bg-danger/10`, not opacity names in class)  
❌ `text-white` / `bg-white` (use `--text` / `--surface`)  
❌ `max-w-{sm,md,lg}` on floating layers (use `max-w-[NNrem]` explicit width)  
❌ Custom spacing overrides (stick to `--spacing-*` 4px grid)

### **Typography**
- **H1 (Intro):** Gmarket Sans, clamp(28px, 5vw, 40px), weight 700, line-height 1.2, `--text`
- **Eyebrow:** Pretendard 12px, weight 700, 0.6px tracking, `--brand-ink`
- **Body (lead, descriptions):** Pretendard 16px (body) or 18px (body-lg), weight 500, line-height 1.55–1.6, `--text-secondary`
- **Button labels:** Pretendard 15px, weight 600, `--text` or `--on-brand`
- **Category labels:** Pretendard 15px, weight 600, `--text`
- **Caption (metadata, placeholders):** Pretendard 13px, weight 500, line-height 1.4, `--text-muted`

### **Shadows & Elevation**
- **Card at rest:** `0 2px 8px rgba(146, 100, 0, 0.08)` (soft honey-tinted, 8% alpha)
- **Card hover:** `0 10px 28px rgba(146, 100, 0, 0.18)` + `translateY(-4px)` (18% alpha)
- **Modal/popup:** `0 16px 40px rgba(146, 100, 0, 0.22)` (22% alpha)

### **Rounding**
- Buttons, pills: `--rounded-lg` (16px)
- Cards, hero search: `--rounded-xl` (20px)
- Icon tiles, inputs: `--rounded-md` (12px)
- Modals: `--rounded-xxl` (28px)

### **Spacing**
- Section vertical rhythm: 64px (section) between major bands
- Card grid gap + padding: 20px (`--spacing-ml`)
- Button padding: 12px (vertical) × 20px (horizontal)
- Input padding: 10px × 14px

---

## E. Build Order & Parallelization

**Inside-out: domain → hook → UI ∥ platform → SEO → QA**

### **Phase 1: Domain (TDD, ≥90%)**
1. `types.ts` — type definitions only (no logic)
2. `constants.ts` — CATEGORIES + UNITS seed data
3. `converters/{length,mass,area,volume,speed,digital-storage,time}.ts` — factor-based converters + unit tests
4. **🔴 converters/temperature.ts** — affine transform + **round-trip tests (±0.0001 accuracy gate)**
5. `precision.ts` + tests — Intl.NumberFormat formatting
6. `schema.ts` + tests — zod validation
7. `recents.ts` + tests — immutable localStorage ops
8. `convert.ts` + tests — router dispatch
9. `index.ts` — barrel export

**Temperature round-trip test (CRITICAL GATE):**
```typescript
// Test: 0°C → 32°F → 0°C = original (±0.0001)
const test_C_to_F_to_C = () => {
  const c1 = 0;
  const f = convert(c1, 'celsius', 'fahrenheit'); // expect 32
  const c2 = convert(f, 'fahrenheit', 'celsius'); // expect 0
  expect(Math.abs(c1 - c2)).toBeLessThan(0.0001);
};

// Test: 212°F (boiling) → 100°C
const test_boiling = () => {
  expect(convert(212, 'fahrenheit', 'celsius')).toBeCloseTo(100, 1);
};

// Test: 273.15 K = 0°C
const test_kelvin = () => {
  expect(convert(273.15, 'kelvin', 'celsius')).toBeCloseTo(0, 1);
};
```

### **Phase 2: Hook (TDD)**
1. `useUnitConverter.ts` — state, localStorage, actions
   - Mount reads localStorage (zod validated, pruned)
   - Category change resets to canonical pair
   - Value debounced 100ms for addRecent
   - Discrete state (category/unit/precision) persists immediately
   - All actions avoid stale closures (values passed as args, not captured)

### **Phase 3: UI Components (parallel ∥ Platform)**
**UI Team:**
1. CategoryTabs, ConversionInput, UnitPicker (with search 100ms debounce), SwapButton, PrecisionSlider
2. ConversionTable (responsive 4-col / 2-col / 1-col)
3. RecentsPanel (MRU history, clear, restore)
4. Keyboard a11y: roving tabs, combobox ARIA, error aria-live

**Platform Team:**
1. Update registry (ONE entry, order 28)
2. Add slug→component branch in tool route
3. Add generateMetadata branch
4. Update sitemap generator (auto-include unit-converter)

### **Phase 4: SEO Sections (TDD)**
1. `UnitConverterIntro.tsx` — H1 + lead (server-render where possible)
2. `UnitConverterHowTo.tsx` — long-form "How do unit conversions work?"
3. `UnitConverterFaq.tsx` — Q&A list, emits FAQPage JSON-LD
4. `UnitConverterStructuredData.tsx` — SoftwareApplication JSON-LD (platform builds/owns)

### **Phase 5: QA Integration**
1. Vitest: ≥80% coverage on domain (target 90%+)
2. E2E (Playwright): 5 scenarios:
   - **Scenario 1:** Category tabs + canonical pairs
   - **Scenario 2:** Live conversion (type in input, see result instantly <50ms, precision slider)
   - **Scenario 3:** Temperature edge cases (0°C, 212°F, 273.15K, -40 special case)
   - **Scenario 4:** Recents + localStorage persistence + keyboard (Tab, Arrow, Enter, Esc)
   - **Scenario 5:** i18n (ko/en page title, unit labels, placeholders in both locales)
3. Visual regression: 320px, 768px, 1024px both light + dark (if dark mode ready)
4. Keyboard: roving tabs (ArrowLeft/Right), unit picker (ArrowUp/Down/Home/End/Enter/Esc), focus-visible rings
5. a11y (axe): no violations, aria-live errors, input labeled, precision aria-valuetext
6. Performance: LCP <2.5s (single route, SSG), CLS <0.1 (no layout shift)

---

## F. File Structure (Source of Truth)

```
src/
├── lib/unit-converter/
│   ├── types.ts                  # CategoryId, Unit, Category, RecentsEntry, RecentsStore
│   ├── constants.ts              # CATEGORIES[] (8 categories × 8–12 units each)
│   ├── converters/
│   │   ├── length.ts             # convert(value, from, to): number; UNITS; validateUnit
│   │   ├── mass.ts
│   │   ├── temperature.ts        # affine: T_target = T_source × a + b
│   │   ├── area.ts
│   │   ├── volume.ts
│   │   ├── speed.ts
│   │   ├── digital-storage.ts    # KB=1000, KiB=1024 distinction
│   │   └── time.ts
│   ├── convert.ts                # Router: convert(category, value, from, to)
│   ├── precision.ts              # formatNumber(value, decimals, locale): string
│   ├── recents.ts                # addRecent, pruneUnknown, deserialize, serialize
│   ├── schema.ts                 # zod: RecentsStore validation
│   ├── __tests__/
│   │   ├── converters.test.ts    # Round-trip, edge cases, temperature ±0.0001
│   │   ├── precision.test.ts
│   │   ├── recents.test.ts
│   │   └── convert.test.ts
│   └── index.ts                  # Barrel export
├── components/tools/unit-converter/
│   ├── UnitConverter.tsx          # "use client"; orchestrator; owns useUnitConverter
│   ├── useUnitConverter.ts        # Hook: state + actions (frozen contract)
│   ├── CategoryTabs.tsx           # 8 pills; roving tabindex; ArrowLeft/Right nav
│   ├── ConversionInput.tsx        # Number input; validation; aria-label
│   ├── UnitPicker.tsx             # Dropdown/combobox; searchable 100ms debounce
│   ├── SwapButton.tsx             # Icon (ArrowRightLeft); rotate 180° on click
│   ├── PrecisionSlider.tsx        # Range [0–6]; aria-valuetext
│   ├── ConversionTable.tsx        # Read-only matrix; responsive 4-col / 2-col / 1-col
│   ├── RecentsPanel.tsx           # MRU history; clear button; empty state
│   ├── UnitConverterIntro.tsx     # H1 + lead (SSR, gate outside mounted)
│   ├── UnitConverterHowTo.tsx     # Long-form "How do unit conversions work?"
│   ├── UnitConverterFaq.tsx       # Q&A + FAQPage JSON-LD
│   ├── UnitConverterStructuredData.tsx # SoftwareApplication JSON-LD
│   ├── __tests__/
│   │   ├── UnitConverter.test.tsx
│   │   ├── useUnitConverter.test.tsx
│   │   ├── CategoryTabs.test.tsx
│   │   ├── ConversionInput.test.tsx
│   │   ├── UnitPicker.test.tsx
│   │   ├── RecentsPanel.test.tsx
│   │   └── [component].test.tsx
│   └── unit-converter.css         # Tool-specific animations (focus expand, swap rotate, grid flow)
└── i18n/messages/
    ├── ko.json                    # tools.unit-converter.* (ko only!)
    └── en.json                    # tools.unit-converter.* (en only!)

tests/e2e/
└── unit-converter.spec.ts         # 5 scenarios (category, live conversion, temp edges, recents, i18n)
```

---

## G. Summary & Sign-Off

| Aspect | Value |
|--------|-------|
| **Layers** | Domain (pure) → Hook (state) → UI (React) → Platform (routing) → SEO (JSON-LD) → QA |
| **Key Contracts** | Domain: `convert(cat, val, from, to)`, `formatNumber(val, decimals, locale)`. Hook: returned object with state + 8 action callbacks. UI: props-only, no side effects. |
| **i18n Format** | Table with **separate ko / en columns** (NOT `"KO | EN"` pipes — 49-string pollution risk). |
| **Design Tokens** | Real: `--accent-sky`, `--brand`, `--surface`, `--text`, `--focus-ring`, `--hairline`. Forbidden: `--semantic-*`, `--surface-hover`, `--surface-secondary`, `--brand-dark`, phantom opacity names. |
| **Temperature** | Affine formula `a×T + b` (NOT lookup table). Round-trip test: ±0.0001 gate. |
| **Build Order** | Domain (≥90% cov, temp round-trip gate) → Hook → UI ∥ Platform → SEO → E2E (5 scenarios) |
| **Registry Order** | 28 |
| **Parallelization** | Domain serial (TDD) → Hook serial → UI ∥ Platform (independent teams) → SEO (serial on final UI) → QA (full integration) |
| **SPEC Ambiguities Resolved** | ① Category enum explicit: `'length' | 'mass' | … | 'time'`. ② Temperature base = Celsius (formulas relative to C). ③ Recents MRU deduplication by (categoryId, fromUnit, toUnit) tuple. ④ Value persistence 100ms debounce, but discrete state immediate. ⑤ Temperature Kelvin allows invalid K (< absolute zero) — calculated but not rejected (educational). ⑥ Error messages from i18n (not hardcoded). ⑦ All 8 converters use factor-based except temperature (affine). |

---

**Path:** `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-unit-converter/_workspace/01_architect_unit-converter-blueprint.md`

**Next step:** Domain engineer begins with `types.ts` → `constants.ts` → `converters/*.ts` (TDD). Platform engineer updates registry + route branches in parallel. All teams await domain API freeze before full parallelization.
