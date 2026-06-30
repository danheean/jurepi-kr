# Domain Layer Contract — Dashboard Pure Functions

**Date:** 2026-06-29  
**Module Owner:** domain-engineer  
**Target Consumer:** ui-engineer (hooks), platform-engineer (registry wiring)  

---

## Public API Signatures

### `src/lib/tool-search.ts`

All functions are pure, deterministic, and immutable. No React/Next/DOM imports.

#### Types

```typescript
/**
 * A tool with localized name, description, and searchable metadata.
 * Used as the common contract between registry + UI layer.
 */
export interface SearchableTool {
  id: string;
  slug: string;
  category: ToolCategory; // imported from @/tools/types
  accent: AccentColor;    // imported from @/tools/types
  icon: string;
  status: 'live' | 'coming_soon';
  isNew?: boolean;
  isPopular?: boolean;
  order: number;
  keywords: string[];
  /** Localized at render time from messages */
  name: string;
  description: string;
}

/**
 * Options for filtering tools by query and/or category.
 */
export interface FilterOptions {
  query?: string;
  category?: ToolCategory | 'all';
}

/**
 * Category option for filter pills.
 * Naming: CategoryOption (not ToolCategory, which is the union type).
 */
export interface CategoryOption {
  id: ToolCategory | 'all';
  labelKey: string; // e.g. 'categories.all', 'categories.random'
}
```

#### Functions

```typescript
/**
 * Case-insensitive substring match over name, description, keywords.
 * Empty query returns true (matches all).
 * Trims query; handles ko/en seamlessly.
 *
 * @param tool The tool to match.
 * @param query The search query (user input).
 * @returns true if tool matches query, false otherwise.
 */
export function matchTool(tool: SearchableTool, query: string): boolean
```

**Guarantees:**
- Empty or whitespace-only query always returns `true`.
- Case-insensitive substring matching on name, description, and any keyword.
- Input query is trimmed before matching.

**Examples:**
```typescript
matchTool(ladderTool, '')           // → true
matchTool(ladderTool, '사다리')       // → true (ko)
matchTool(ladderTool, 'ladder')     // → true (en)
matchTool(ladderTool, 'LADDER')     // → true (case-insensitive)
matchTool(ladderTool, 'add')        // → true (substring mid-word)
matchTool(ladderTool, 'xyz')        // → false (no match)
```

---

```typescript
/**
 * Filter by query + optional category.
 * Returns new array (immutable).
 *
 * @param tools Array of tools to filter.
 * @param opts FilterOptions with query and/or category.
 * @returns New array of tools matching both criteria (AND logic).
 */
export function filterTools(
  tools: SearchableTool[],
  opts: FilterOptions
): SearchableTool[]
```

**Guarantees:**
- Returns a new array, never mutates input.
- Matches query AND (category unset OR category === 'all' OR tool.category === category).
- If query is unset, empty, or whitespace, all tools match (via matchTool).
- If category is unset or 'all', all categories match.

**Examples:**
```typescript
filterTools(tools, { query: 'ladder' })
  // → Only tools matching 'ladder'

filterTools(tools, { category: 'random' })
  // → Only tools in 'random' category

filterTools(tools, { query: 'ladder', category: 'random' })
  // → Only tools matching both criteria

filterTools(tools, { category: 'all' })
  // → All tools (no filter)

filterTools(tools, {})
  // → All tools (no criteria)
```

---

```typescript
/**
 * Sort: isPopular DESC → status (live before coming_soon) → order ASC.
 * Returns new array (immutable).
 *
 * @param tools Array of tools to sort.
 * @returns New array sorted by precedence: popular first, live before coming_soon, then by order.
 */
export function sortTools(tools: SearchableTool[]): SearchableTool[]
```

**Guarantees:**
- Returns a new array, never mutates input.
- Sort precedence:
  1. `isPopular` DESC (popular tools pinned first).
  2. `status` (live tools before coming_soon).
  3. `order` ASC (lowest order value first).

**Examples:**
```typescript
const tools = [
  { id: '1', isPopular: false, status: 'live', order: 2 },
  { id: '2', isPopular: true, status: 'live', order: 5 },
  { id: '3', isPopular: false, status: 'coming_soon', order: 0 },
];
sortTools(tools)
  // → [{ id: '2', ... }, { id: '1', ... }, { id: '3', ... }]
  // Explanation: 2 (popular) first, 1 (live, order=2), 3 (coming_soon) last
```

---

```typescript
/**
 * Derive unique categories present in the tool list.
 * Always includes "all" as the first pill.
 * Stable order: all → random → calculator → text → converter → fun.
 *
 * @param tools Array of tools to derive categories from.
 * @returns Array of CategoryOption, starting with 'all', then present categories in stable order.
 */
export function deriveCategories(tools: SearchableTool[]): CategoryOption[]
```

**Guarantees:**
- Always returns at least one entry: `{ id: 'all', labelKey: 'categories.all' }`.
- Includes only categories actually present in the tools array (no empty pills).
- Stable order regardless of input order: random, calculator, text, converter, fun.
- Deduplicates categories (each appears once).
- Each entry has labelKey = `categories.${id}` (or `categories.all`).

**Examples:**
```typescript
deriveCategories([
  { id: '1', category: 'fun' },
  { id: '2', category: 'random' },
  { id: '3', category: 'random' },
])
  // → [
  //     { id: 'all', labelKey: 'categories.all' },
  //     { id: 'random', labelKey: 'categories.random' },
  //     { id: 'fun', labelKey: 'categories.fun' },
  //   ]

deriveCategories([])
  // → [{ id: 'all', labelKey: 'categories.all' }]
```

---

### `src/lib/theme.ts`

Pure theme preference resolution. No React/Next/DOM imports.

#### Types

```typescript
export type ThemePref = 'light' | 'dark' | 'system';
```

#### Functions

```typescript
/**
 * Resolve a theme preference to a concrete value.
 *
 * @param pref User preference from localStorage or default.
 * @param systemPrefersDark Result of matchMedia('(prefers-color-scheme:dark)').matches.
 * @returns Concrete 'light' or 'dark'.
 */
export function resolveTheme(
  pref: ThemePref,
  systemPrefersDark: boolean
): 'light' | 'dark'
```

**Guarantees:**
- 'light' preference always resolves to 'light'.
- 'dark' preference always resolves to 'dark'.
- 'system' preference resolves based on systemPrefersDark:
  - true → 'dark'
  - false → 'light'

**Examples:**
```typescript
resolveTheme('light', false) // → 'light'
resolveTheme('light', true)  // → 'light'
resolveTheme('dark', false)  // → 'dark'
resolveTheme('dark', true)   // → 'dark'
resolveTheme('system', false) // → 'light'
resolveTheme('system', true)  // → 'dark'
```

---

```typescript
/**
 * Type guard: is unknown value a valid ThemePref?
 *
 * @param v Unknown value to check.
 * @returns true if v is 'light', 'dark', or 'system'.
 */
export function isThemePref(v: unknown): v is ThemePref
```

**Guarantees:**
- Validates v is one of the three valid strings.
- Returns false for null, undefined, 'auto', or any other value.

**Examples:**
```typescript
isThemePref('light')   // → true
isThemePref('dark')    // → true
isThemePref('system')  // → true
isThemePref('auto')    // → false
isThemePref(null)      // → false
isThemePref(42)        // → false
```

---

```typescript
export const DEFAULT_THEME_PREF: ThemePref = 'light';
```

**Guarantee:** Default preference is 'light' (light-first design).

---

## Test Coverage

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| `tool-search.ts` | 97.95% | 97.05% | 100% | 97.95% |
| `theme.ts` | 100% | 100% | 100% | 100% |

**Test Count:**
- `tool-search.test.ts`: 30 tests (all passing)
- `theme.test.ts`: 15 tests (all passing)
- **Total:** 45 tests, 0 failures

---

## Invariants (Boundary Checks)

### Immutability
- `filterTools()` and `sortTools()` **always return a new array**, never mutate input.
- Tests verify input arrays remain unchanged after calls.

### Determinism
- Same tools + same query + same category → same result order every time.
- No randomness or side effects in any function.

### Input Validation
- Null safety: all `tool` fields are defined at registry time (no surprises).
- Empty queries and categories are handled gracefully.
- Unknown values are safely rejected (e.g., `isThemePref`).

### Category Stability
- Category order is fixed in `CATEGORY_ORDER` constant.
- Derivation is deterministic and deduplicates.

---

## Consumer Integration Notes

### For ui-engineer (Hooks)

**`useToolSearch` hook should:**
1. Call `filterTools(initialTools, { query, category })` on state change.
2. Call `sortTools(...)` on the result.
3. Reflect in URL via next-intl router: `?q=<query>&cat=<category>`.

**`deriveCategories` usage:**
- Call once on mount with initial tools.
- Pass result to `CategoryFilter` pill component.

### For platform-engineer (Registry)

**Registry tools must populate:**
- `name`: Will be replaced by i18n value `tools.<id>.title`.
- `description`: Will be replaced by i18n value `tools.<id>.description`.
- `keywords`: Array of search keywords (ko + en strings).
- `category`: One of `ToolCategory` union values.
- `status`: 'live' for clickable tools, 'coming_soon' for placeholders.
- `order`: Sort weight (lower first, within same popularity/status).
- `accent`: One of `AccentColor` values (coral, mint, sky, sun, grape, rose).

**Localization:**
- At page render time, server resolves tools to `SearchableTool` by replacing `name` + `description` with i18n keys.
- Example: `tools.ladder.title` → "사다리 타기" (ko) or "Ladder Game" (en).

---

## Exports Summary

**From `src/lib/tool-search.ts`:**
- ✓ `SearchableTool` interface
- ✓ `matchTool(tool, query)` function
- ✓ `FilterOptions` interface
- ✓ `filterTools(tools, opts)` function
- ✓ `sortTools(tools)` function
- ✓ `CategoryOption` interface ← **naming fix from blueprint**
- ✓ `deriveCategories(tools)` function

**From `src/lib/theme.ts`:**
- ✓ `ThemePref` type
- ✓ `resolveTheme(pref, systemPrefersDark)` function
- ✓ `isThemePref(v)` function
- ✓ `DEFAULT_THEME_PREF` constant

**Imported types (from `@/tools/types`):**
- ✓ `ToolCategory` (union: 'random' | 'calculator' | 'text' | 'converter' | 'fun' | 'dev')
- ✓ `AccentColor` (union: 'coral' | 'mint' | 'sky' | 'sun' | 'grape' | 'rose')

---

**Status:** ✓ COMPLETE — All 45 tests passing, coverage ≥90%, zero TypeScript errors.
