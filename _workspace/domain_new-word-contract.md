# New Word Domain Layer — Public API Contract

**Status**: Complete & tested (111 tests, 98.37% coverage)  
**Module**: `src/lib/new-word/*`  
**Owner**: domain-engineer

---

## Exported Types

```typescript
// Schema types
export const STORE_VERSION = 1;

export type TermFileFront = {
  term: string;                    // Required, non-empty
  definition: string;              // Required, non-empty
  examples: string[];              // Required, ≥1 non-empty
  slug?: string;                   // Optional, must match /^[a-z0-9-]+$/
  topic?: 'mz' | 'tech';          // Optional (defaults to 'mz' on merge)
  reading?: string;
  aliases?: string[];
  tags?: string[];
  origin?: string;
  coinedYear?: number;
  related?: string[];              // Slug references (validated at build-time)
};

export type MergedTerm = {
  slug: string;                    // Unique identifier
  topic: 'mz' | 'tech';
  tags: string[];
  coinedYear?: number;
  related: string[];               // Slugs of related terms
  ko: {
    term: string;
    definition: string;
    examples: string[];
    body: string;                  // Markdown content (optional in schema, required in merged)
    reading?: string;
    aliases?: string[];
    origin?: string;
  };
  en: {
    term: string;
    definition: string;
    examples: string[];
    body: string;
    reading?: string;
    aliases?: string[];
    origin?: string;
  };
};

export type GlossaryStore = {
  version: number;                 // Always STORE_VERSION
  favorites: string[];             // Term slugs
  recents: string[];               // Term slugs, MRU first, max 20, deduplicated
  meta: {
    lastTopic?: string;
    lastLang?: 'ko' | 'en' | 'both';
    createdAt: number;
  };
};
```

---

## Public Functions

### Schema & Validation

```typescript
// schema.ts

// Parse frontmatter with error collection (non-blocking)
export function safeJsonParse<T>(
  json: string,
  schema: z.ZodType<T>
): T | null;
// Returns null if parse or validation fails (never throws)
```

### Slug Resolution

```typescript
// slug.ts

export function slugify(name: string): string;
// Converts: "Vibe Coding" → "vibe-coding"
// Also removes diacritics, special chars

export function resolveSlug(front: TermFileFront, filename: string): string;
// If front.slug present: use it
// Else: derive from filename base ("vibe-coding_en.md" → "vibe-coding")
```

### Merging & Validation

```typescript
// merge.ts

export function mergePair(
  koFront: TermFileFront,
  enFront: TermFileFront,
  koBody?: string,
  enBody?: string
): MergedTerm;
// Canonical rule:
//   - Structural (topic, tags, slug, coinedYear, related) from KO
//   - EN inherits if absent, must match if present
//   - Locale content (term, definition, examples, etc.) independent
//   - body defaults to empty string if not provided

export function validatePair(
  koFilename: string,
  koFront: unknown,
  enFront: unknown
): { term: MergedTerm | null; errors: string[] };
// Validates both frontmatter + canonical rule
// Returns null term + error array if any violation
```

### Catalog Access

```typescript
// catalog.ts

export function allTerms(catalog: MergedTerm[]): MergedTerm[];
// Returns reference to input array

export function byId(
  catalog: MergedTerm[],
  slug: string
): MergedTerm | null;
// Find by slug

export function byTopic(
  catalog: MergedTerm[],
  topic: string
): MergedTerm[];
// Returns new filtered array

export function topics(catalog: MergedTerm[]): string[];
// Unique topic IDs, sorted order

export function validateRelatedIntegrity(catalog: MergedTerm[]): string[];
// Checks all related slug references exist
// Returns empty array if valid

export function validateUniqueSlugs(catalog: MergedTerm[]): string[];
// Checks no duplicate slugs
// Returns empty array if valid
```

### Search

```typescript
// search.ts

export function filterTerms(
  terms: MergedTerm[],
  query: string,
  locale?: 'ko' | 'en'
): MergedTerm[];
// Blank query → returns all terms
// Non-blank: matches term name, aliases, definition, tags (both locales)
// Case/diacritic insensitive
// Preserves original order

export function normalizeSearchText(text: string): string;
// Lowercase, NFC, remove spaces/hyphens/underscores
// Used internally by filterTerms
```

### Favorites & Recents

```typescript
// favorites.ts

export const RECENTS_MAX = 20;

export function toggleFavorite(slugs: string[], slug: string): string[];
// Add if absent, remove if present
// Returns new array (never mutates input)

export function pushRecent(
  slugs: string[],
  slug: string,
  max?: number  // default RECENTS_MAX=20
): string[];
// Move to front if exists, prepend if new
// Deduplicate, truncate to max
// MRU first order
// Returns new array (never mutates input)

export function pruneUnknown(
  slugs: string[],
  catalog: MergedTerm[]
): string[];
// Remove slugs not in catalog
// Used on load to clean stale favorites/recents
// Returns new array (never mutates input)
```

---

## Invariants (CRITICAL)

**Pair Integrity**:
- Every term MUST have both Korean + English frontmatter/body
- Missing pair → validation failure (error collected, term = null)

**Required Fields**:
- term: non-empty string (both locales)
- definition: non-empty string (both locales)
- examples: array with ≥1 non-empty strings (both locales)

**Slug Uniqueness**:
- No two terms with same slug
- Violation → validateUniqueSlugs() returns error

**Canonical Rule**:
- topic, tags, related, slug, coinedYear: canonical in KO
- EN can omit (inherits) or match exactly (error if mismatch)
- Locale content: independent per locale

**Related Integrity**:
- All related[i] slugs must exist in catalog
- Violation → validateRelatedIntegrity() returns error

**Immutability**:
- All functions return new arrays/objects, never mutate inputs
- Safe for concurrent access

---

## Usage Pattern (useGlossary will follow this)

```typescript
// 1. Load catalog (static terms.generated.json)
const catalog: MergedTerm[] = await import('./data/terms.generated.json');

// 2. Initialize store from localStorage
const stored = safeJsonParse(localStorage.getItem('jurepi-new-word') || '', GlossaryStoreSchema);
const store = stored || { version: STORE_VERSION, favorites: [], recents: [], meta: { createdAt: Date.now() } };

// 3. Prune stale references
store.recents = pruneUnknown(store.recents, catalog);
store.favorites = pruneUnknown(store.favorites, catalog);

// 4. Search & filter
const byTopicMz = byTopic(catalog, 'mz');
const searchResults = filterTerms(byTopicMz, 'query');

// 5. Select term (update recents)
const term = byId(catalog, 'god-saeng');
if (term) {
  store.recents = pushRecent(store.recents, term.slug);
}

// 6. Toggle favorite
store.favorites = toggleFavorite(store.favorites, 'god-saeng');

// 7. Persist
localStorage.setItem('jurepi-new-word', JSON.stringify(store));
```

---

## Error Handling

- **Corrupt localStorage**: safeJsonParse() → null → start fresh (no throw)
- **Unknown slugs in recents/favorites**: pruneUnknown() → remove them
- **Missing related reference**: validateRelatedIntegrity() → error string (generator fails build)
- **Schema violation**: safeParse() → error object (non-throwing)

**No exceptions thrown from domain layer.** All errors are collected + returned or safely degraded.

---

## Testing Coverage

- **111 tests** (Vitest, AAA pattern)
- **98.37% statement coverage** (merge.ts helpers at 94.66%)
- **95.16% branch coverage**
- **100% function coverage**

All tests: `pnpm test src/lib/new-word --run`  
Coverage: `pnpm test:coverage src/lib/new-word`
