# Jurepi New Word — Clean Architecture Blueprint

**Deliverable**: Implementation specification for **New Word (신조어 용어사전)** tool + shared **Markdown rendering module**.  
**SPEC source**: `docs/services/text/new-word/SPEC.md`  
**Status**: Ready for domain-engineer → platform-engineer → ui-engineer parallel build.

---

## 1. Layer Decomposition (Clean Architecture 4-Tier)

### 1.1 Domain Layer — `src/lib/new-word/*` & `src/lib/markdown/*`

**NO React, NO Next, NO DOM imports.** Pure TS + zod.

| File | Responsibility | Owned Contracts |
|------|-----------------|-----------------|
| `schema.ts` | Zod schemas: frontmatter + merged record + store | `TermFileFront` (ko/en), `MergedTerm`, `GlossaryStore`, `STORE_VERSION`, `safeJsonParse()` |
| `merge.ts` | Apply canonical rule (ko structural + en inherit) | `mergePair(koFront, enFront): MergedTerm`, `validatePair(…): { term: MergedTerm, errors: string[] }` |
| `slug.ts` | Stable slugification + derivation | `slugify(name: string): string`, `resolveSlug(front: TermFileFront, filename: string): string` |
| `catalog.ts` | Typed immutable access layer | `allTerms(): MergedTerm[]`, `byId(slug: string): MergedTerm \| null`, `byTopic(topic: string): MergedTerm[]`, `topics(): string[]`, `validateRelatedIntegrity(terms): string[]` |
| `search.ts` | Filter + diacritic-insensitive match | `filterTerms(terms: MergedTerm[], query: string, locale: 'ko' \| 'en'): MergedTerm[]`, `normalizeSearchText(text: string): string` |
| `favorites.ts` | Immutable ops on localstorage lists | `toggleFavorite(slugs: string[], slug: string): string[]`, `pushRecent(slugs: string[], slug: string, max?: number): string[]`, `pruneUnknown(slugs: string[], catalog: MergedTerm[]): string[]` |
| `markdown/markdownToPlainText.ts` | Plain-text extraction for JSON-LD | `markdownToPlainText(mdBody: string): string`, `truncateToLength(text: string, maxChars: number): string` |

**Key invariants:**
- All functions are **immutable** (return new arrays, never mutate inputs).
- All schemas are **zod-backed** + have `safeparse()` helpers for 80% coverage unit tests.
- Domain NEVER imports React, Next, window, or any UI library.

### 1.2 Generator Layer — `scripts/generate-glossary.mjs`

**Node.js script, build-time only.** Imports domain layer zod schemas + merge/validation functions.

**Execution**: wired to `package.json` `"prebuild"` and `"predev"`.

**Contract**:
```javascript
// generate-glossary.mjs
async function generateGlossary() {
  // 1. Scan content/new-word/terms/ for .md files (exclude '_' prefix)
  // 2. Group by base filename (ko/en pairs)
  // 3. For each pair:
  //    - gray-matter parse frontmatter
  //    - zod TermFileFront.safeParse (collect errors)
  //    - mergePair (apply canonical rule)
  //    - resolveSlug
  // 4. Validate:
  //    - pair-integrity (both ko+en exist)
  //    - required-fields per locale (term, definition, ≥1 example)
  //    - slug-uniqueness
  //    - related references exist in catalog
  //    - collect all violations in `errors[]`
  // 5. If errors.length > 0: stderr each, process.exit(1)
  // 6. Else: sort (topic, coinedYear desc, term), emit terms.generated.json
  // 7. Output: terms.generated.json = [ MergedTerm, ... ]
  //
  // Exit: 0 on success, 1 on validation failure (no silent skips)
}
```

**Input files**:
- `content/new-word/_TEMPLATE.md`, `_TEMPLATE_en.md` — excluded by `_` check
- `content/new-word/README.md` — authoring guide (not scanned)
- `content/new-word/terms/*.md` — term pairs
  - Example: `vibe-coding.md` + `vibe-coding_en.md`

**Output artifact**:
- `src/components/tools/new-word/data/terms.generated.json`
- Format: `[ { slug, topic, tags, coinedYear?, related, ko: { term, definition, examples, … }, en: { … } }, … ]`
- **Decision: COMMIT to repo** (deterministic, enables CI "is artifact up-to-date?" check)

### 1.3 Usecase Layer — `src/components/tools/new-word/useGlossary.ts`

**React hook. Stateful adapter** between domain and UI.

**Contract**:
```typescript
interface UseGlossaryReturn {
  // Data
  catalog: MergedTerm[];
  filteredList: MergedTerm[];
  selectedSlug: string | null;
  selectedTerm: MergedTerm | null;
  
  // Mutable actions (return new state, hook handles setState)
  select: (slug: string | null) => void;
  setQuery: (q: string) => void;
  setTopic: (t: string) => void;
  setLang: (l: 'ko' | 'en' | 'both') => void;
  toggleFavorite: (slug: string) => void;
  
  // Read-only derived state
  favorites: string[];
  recents: string[];
  query: string;
  activeTopic: string; // "all" | "mz" | "tech" | "favorites" | "recent"
  displayLang: 'ko' | 'en' | 'both';
  
  // Action: copy to clipboard (string → navigator.clipboard.writeText)
  copy: (text: string) => Promise<void>;
  
  // Metadata
  resultCount: number;
}

export function useGlossary(): UseGlossaryReturn {
  // 1. Dynamic import terms.generated.json on mount
  //    - Wrap in try-catch; if parse fails, fallback to empty catalog + error toast
  // 2. Initialize localStorage 'jurepi-new-word' (zod parse + pruneUnknown if stale)
  //    - If corrupt: clear + start fresh (no throw, silent recovery)
  // 3. Debounced setQuery (120ms)
  // 4. Composite filter: filterTerms(topic-subset, query, locale)
  // 5. select() updates recents (pushRecent) + sets selectedSlug
  // 6. Save all state changes to localStorage (debounced JSON.stringify, catch quota/security errors)
  // 7. Expose all above via return object
}
```

### 1.4 Adapter Layer — `src/components/tools/new-word/*`

**React components. Client-side SPA.**

All other components in this folder depend on `useGlossary` or accept props from orchestrator.

| Component | Props | Children | State Owner |
|-----------|-------|----------|------------|
| `NewWord.tsx` | none (root) | Intro, GlossaryLayout, HowTo, Faq | `useGlossary()` — all state lives here |
| `TopicTabs.tsx` | `activeTopic`, `setTopic`, `counts` | pills | Orchestrator |
| `TermSearch.tsx` | `query`, `setQuery`, `resultCount` | input | Orchestrator |
| `TermList.tsx` | `terms`, `selected`, `onSelect`, `favorites`, `onToggleFav` | TermCard × N, EmptyState | Orchestrator |
| `TermCard.tsx` | `term`, `isSelected`, `isFavorite`, `onSelect`, `onToggleFav` | — | None (pure) |
| `TermDetail.tsx` | `term`, `displayLang`, `setLang`, `onCopy` | RelatedChips | None (pure) |
| `RelatedChips.tsx` | `related`, `catalog`, `onSelect` | — | None (pure) |
| `NewWordIntro.tsx` | none | — | None (pure, server-render where possible) |
| `NewWordHowTo.tsx` | none | — | None (pure, SEO long-form) |
| `NewWordFaq.tsx` | none | — | None (pure, FAQPage JSON-LD) |

**Shared Markdown Component** (cross-cutting):
- `src/components/markdown/Markdown.tsx` — client-capable React wrapper around `markdown-to-jsx`
  - Props: `children: string` (markdown source), `inline?: boolean`, `className?: string`
  - Override map: h2/h3 → prose tokens, p, ul/ol/li, strong/em, code/pre, a (external + noopener), blockquote
  - Disables raw HTML (`disableParsingRawHTML: true`)
  - Optional `<MarkdownInline />` for definitions/examples (inline mode only)
  - Code-split: imported only on tool route

### 1.5 Framework Layer — `src/app/[locale]/tools/[slug]/page.tsx` (delta only)

**Next.js App Router. SSG + slug branching.**

**Additions**:
1. Dynamic import `NewWord` component (alongside Ladder, DailyQuestion)
2. `generateMetadata` branch for `slug === 'new-word'` — call `buildToolMetadata` + new `definedTermSetJsonLd()`
3. `ToolContent` branch for `slug === 'new-word'` — mount `<NewWord />`

---

## 2. Shared Markdown Renderer Contract

### 2.1 `src/components/markdown/Markdown.tsx`

**Single shared component ALL tools reuse** (never embed markdown-to-jsx directly in tools).

```typescript
interface MarkdownProps {
  /** Markdown source string */
  children: string;
  /** Render inline elements only (no block wrappers: p, h2, ul, blockquote) */
  inline?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Markdown → JSX React component using markdown-to-jsx.
 * Overrides elements to DESIGN.md prose tokens.
 * Disables raw HTML. External links: target="_blank" + rel="noopener noreferrer".
 */
export function Markdown({ children, inline = false, className }: MarkdownProps) {
  const overrides = inline ? INLINE_OVERRIDES : BLOCK_OVERRIDES;
  
  return (
    <MarkdownToJsx
      options={{
        overrides,
        disableParsingRawHTML: true,
        // ... other options
      }}
      className={className}
    >
      {children}
    </MarkdownToJsx>
  );
}

/**
 * Inline variant: renders only inline emphasis, code, links.
 * Use for definition snippets, example highlights.
 */
export function MarkdownInline({ children, className }: Omit<MarkdownProps, 'inline'>) {
  return <Markdown inline={true} children={children} className={className} />;
}
```

**Override strategy**:
- `h2, h3` → DESIGN.md prose heading (Gmarket Sans clamp 24px, tight line-height)
- `p` → body 16px, var(--text-secondary), 1.55 line-height
- `ul, ol` → list-item with left padding; `li` → body text
- `strong` → 600 weight, var(--accent-mint) for definition emphasis
- `em` → italic
- `code` → monospace, var(--surface-muted) background, var(--accent-mint) text
- `pre` → code block, scrollable, monospace, var(--surface-sunken)
- `a` → var(--brand-ink), underline; if external (href.startsWith('http')), add `target="_blank" rel="noopener noreferrer"`
- `blockquote` → left 4px var(--accent-mint) border, italic, var(--text-muted)

**Code-split**: dynamic import only on new-word route (never bundled into landing).

### 2.2 `src/lib/markdown/markdownToPlainText.ts` (pure, optional)

```typescript
/**
 * Extract plain text from markdown (for JSON-LD descriptions, search indexing).
 * Strips code blocks, links → link text, bold/italic markers.
 */
export function markdownToPlainText(mdBody: string): string {
  // Remove code blocks: ```...```
  // Replace [link](url) → "link"
  // Remove **bold** → "bold"
  // Remove *italic* → "italic"
  // Join lines with space
  // Return trimmed result
}

/**
 * Truncate plain text to max chars, break at word boundary, add "…"
 */
export function truncateToLength(text: string, maxChars: number = 160): string {
  // Implements truncation with word-break logic
}
```

**When needed**: JSON-LD `description` (schema.org DefinedTerm), sitemap meta, full-text search indexing.  
**When NOT needed**: UI rendering (use `<Markdown>` component).

---

## 3. Domain Layer Contracts (Zod + TS signatures)

### 3.1 `src/lib/new-word/schema.ts`

```typescript
import { z } from 'zod';

export const STORE_VERSION = 1;

/** Individual markdown file frontmatter */
export const TermFileFrontSchema = z.object({
  term: z.string().min(1, 'term required'),
  definition: z.string().min(1, 'definition required'),
  examples: z.array(z.string().min(1)).min(1, '≥1 example required'),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  topic: z.enum(['mz', 'tech']).optional(),
  reading: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  origin: z.string().optional(),
  coinedYear: z.number().int().optional(),
  related: z.array(z.string()).optional(),
});

export type TermFileFront = z.infer<typeof TermFileFrontSchema>;

/** Merged ko+en record (catalog item) */
export const MergedTermSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  topic: z.enum(['mz', 'tech']),
  tags: z.array(z.string()),
  coinedYear: z.number().int().optional(),
  related: z.array(z.string()),
  ko: z.object({
    term: z.string(),
    definition: z.string(),
    examples: z.array(z.string()),
    body: z.string(), // Optional markdown body (beyond examples)
    reading: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    origin: z.string().optional(),
  }),
  en: z.object({
    term: z.string(),
    definition: z.string(),
    examples: z.array(z.string()),
    body: z.string(),
    reading: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    origin: z.string().optional(),
  }),
});

export type MergedTerm = z.infer<typeof MergedTermSchema>;

/** localStorage blob */
export const GlossaryStoreSchema = z.object({
  version: z.number().int().min(1),
  favorites: z.array(z.string()),
  recents: z.array(z.string()),
  meta: z.object({
    lastTopic: z.string().optional(),
    lastLang: z.enum(['ko', 'en', 'both']).optional(),
    createdAt: z.number().int(),
  }),
});

export type GlossaryStore = z.infer<typeof GlossaryStoreSchema>;

/** Safe JSON parsing (for corrupt localStorage recovery) */
export function safeJsonParse<T>(json: string, schema: z.ZodType<T>): T | null {
  try {
    const parsed = JSON.parse(json);
    return schema.safeParse(parsed).success ? parsed : null;
  } catch {
    return null;
  }
}
```

### 3.2 `src/lib/new-word/merge.ts`

```typescript
/**
 * Merge ko + en pair following canonical rule:
 * - Structural metadata (topic, tags, slug, coinedYear, related) from KO
 * - EN inherits if absent; must match if present (error if conflict)
 * - Locale content (term, definition, examples, reading, aliases, origin) independent
 */
export function mergePair(
  koFront: TermFileFront,
  enFront: TermFileFront
): MergedTerm {
  const slug = resolveSlug(koFront, 'unknown.md');
  const topic = koFront.topic || 'mz';
  const tags = koFront.tags || [];
  const related = koFront.related || [];

  return {
    slug,
    topic,
    tags,
    coinedYear: koFront.coinedYear,
    related,
    ko: {
      term: koFront.term,
      definition: koFront.definition,
      examples: koFront.examples,
      body: koFront.body || '',
      reading: koFront.reading,
      aliases: koFront.aliases,
      origin: koFront.origin,
    },
    en: {
      term: enFront.term,
      definition: enFront.definition,
      examples: enFront.examples,
      body: enFront.body || '',
      reading: enFront.reading,
      aliases: enFront.aliases,
      origin: enFront.origin,
    },
  };
}

/**
 * Validate pair + merged record; collect all errors (non-blocking).
 * Returns { term: MergedTerm | null, errors: string[] }
 */
export function validatePair(
  koFilename: string,
  koFront: unknown,
  enFront: unknown
): { term: MergedTerm | null; errors: string[] } {
  const errors: string[] = [];

  // Parse frontmatter
  const koResult = TermFileFrontSchema.safeParse(koFront);
  const enResult = TermFileFrontSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(`${koFilename}: KO parse error — ${koResult.error.message}`);
  }
  if (!enResult.success) {
    errors.push(`${koFilename}: EN parse error — ${enResult.error.message}`);
  }

  if (errors.length > 0) {
    return { term: null, errors };
  }

  // Canonical rule check: EN must not override structural metadata
  const ko = koResult.data!;
  const en = enResult.data!;
  
  if (en.topic && en.topic !== ko.topic) {
    errors.push(`${koFilename}: EN topic must match KO (KO="${ko.topic}", EN="${en.topic}")`);
  }
  if (en.tags && en.tags.length > 0 && !arraysEqual(en.tags, ko.tags || [])) {
    errors.push(`${koFilename}: EN tags must match KO`);
  }

  const term = mergePair(ko, en);

  return { term: errors.length === 0 ? term : null, errors };
}
```

### 3.3 `src/lib/new-word/slug.ts`

```typescript
/**
 * Slugify a term: lowercase, remove diacritics, replace spaces/special with hyphens.
 * Example: "바이브 코딩" → "vibe-coding" (if user provides Korean term + slug field)
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove non-word
    .replace(/\s+/g, '-') // Space → hyphen
    .replace(/-+/g, '-') // Collapse hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}

/**
 * Resolve slug: use frontmatter slug if present, else derive from filename.
 */
export function resolveSlug(front: TermFileFront, filename: string): string {
  if (front.slug) {
    return front.slug;
  }
  // Derive from filename: "vibe-coding.md" → "vibe-coding"
  const base = filename.replace(/(_en)?\.md$/, '');
  return slugify(base);
}
```

### 3.4 `src/lib/new-word/catalog.ts`

```typescript
/**
 * Immutable catalog access (operates on static terms.generated.json).
 * Note: In runtime, catalog is passed in (not stored in this module — purity).
 */

export function allTerms(catalog: MergedTerm[]): MergedTerm[] {
  return catalog;
}

export function byId(catalog: MergedTerm[], slug: string): MergedTerm | null {
  return catalog.find((t) => t.slug === slug) || null;
}

export function byTopic(catalog: MergedTerm[], topic: string): MergedTerm[] {
  return catalog.filter((t) => t.topic === topic);
}

export function topics(catalog: MergedTerm[]): string[] {
  const unique = new Set(catalog.map((t) => t.topic));
  return Array.from(unique).sort();
}

/**
 * Validate all `related` references exist in catalog.
 * Returns array of errors; empty = all valid.
 */
export function validateRelatedIntegrity(catalog: MergedTerm[]): string[] {
  const slugSet = new Set(catalog.map((t) => t.slug));
  const errors: string[] = [];

  catalog.forEach((term) => {
    term.related.forEach((ref) => {
      if (!slugSet.has(ref)) {
        errors.push(`${term.slug}: related references missing slug "${ref}"`);
      }
    });
  });

  return errors;
}
```

### 3.5 `src/lib/new-word/search.ts`

```typescript
/**
 * Filter terms by query, across both locales, case/diacritic insensitive.
 * Match if any of: term (ko+en), aliases (ko+en), definition (ko+en), tags.
 */
export function filterTerms(
  terms: MergedTerm[],
  query: string,
  locale?: 'ko' | 'en'
): MergedTerm[] {
  if (!query.trim()) {
    return terms;
  }

  const normalized = normalizeSearchText(query);

  return terms.filter((term) => {
    const ko = normalizeSearchText(
      [term.ko.term, ...(term.ko.aliases || []), term.ko.definition, ...term.tags].join(' ')
    );
    const en = normalizeSearchText(
      [term.en.term, ...(term.en.aliases || []), term.en.definition, ...term.tags].join(' ')
    );

    const match = ko.includes(normalized) || en.includes(normalized);
    return locale ? match && (locale === 'ko' ? true : true) : match;
  });
}

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\s\-_]/g, ''); // Remove spaces, hyphens, underscores for better matching
}
```

### 3.6 `src/lib/new-word/favorites.ts`

```typescript
/**
 * Immutable operations on favorites/recents lists.
 */

/**
 * Toggle favorite: add if absent, remove if present. Preserve order.
 */
export function toggleFavorite(slugs: string[], slug: string): string[] {
  const idx = slugs.indexOf(slug);
  if (idx >= 0) {
    return slugs.filter((_, i) => i !== idx);
  }
  return [...slugs, slug];
}

/**
 * Add to recents (most-recent-first), de-duplicate, truncate to max.
 */
export function pushRecent(slugs: string[], slug: string, max: number = 20): string[] {
  // Move to front if exists, else prepend
  const filtered = slugs.filter((s) => s !== slug);
  const updated = [slug, ...filtered];
  return updated.slice(0, max);
}

/**
 * Remove slugs not in catalog (e.g., after content update).
 */
export function pruneUnknown(slugs: string[], catalog: MergedTerm[]): string[] {
  const known = new Set(catalog.map((t) => t.slug));
  return slugs.filter((s) => known.has(s));
}

export const RECENTS_MAX = 20;
```

---

## 4. Generator Contract

### 4.1 `scripts/generate-glossary.mjs` (outline)

```javascript
/**
 * Build-time generator: Markdown → JSON catalog.
 * Entry: package.json "prebuild" and "predev".
 * Exit: 0 (success) or 1 (validation failure).
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import {
  TermFileFrontSchema,
  MergedTermSchema,
  mergePair,
  validatePair,
  resolveSlug,
  validateRelatedIntegrity,
} from '../src/lib/new-word/schema.js';

async function main() {
  const termsDir = join(process.cwd(), 'content/new-word/terms');
  const outputPath = join(
    process.cwd(),
    'src/components/tools/new-word/data/terms.generated.json'
  );

  // 1. Scan and group pairs
  const files = readdirSync(termsDir).filter(
    (f) => f.endsWith('.md') && !f.startsWith('_')
  );
  
  const pairs = new Map(); // base → { ko?: { filename, data }, en?: { filename, data } }
  const allErrors = [];

  files.forEach((file) => {
    const content = readFileSync(join(termsDir, file), 'utf8');
    const { data } = matter(content);
    
    let base = file.replace(/(_en)?\.md$/, '');
    const isEn = file.endsWith('_en.md');
    
    if (!pairs.has(base)) pairs.set(base, {});
    pairs.get(base)[isEn ? 'en' : 'ko'] = { filename: file, data };
  });

  // 2. Merge and validate
  const terms = [];
  pairs.forEach(({ ko, en }, base) => {
    if (!ko || !en) {
      allErrors.push(`${base}: missing ${!ko ? 'Korean' : 'English'} file`);
      return;
    }

    const { term, errors } = validatePair(base, ko.data, en.data);
    if (errors.length > 0) {
      allErrors.push(...errors);
    }
    if (term) {
      term.body = matter(readFileSync(join(termsDir, ko.filename), 'utf8')).content.trim();
      term.en.body = matter(
        readFileSync(join(termsDir, en.filename), 'utf8')
      ).content.trim();
      terms.push(term);
    }
  });

  // 3. Check uniqueness + related integrity
  const slugSet = new Set(terms.map((t) => t.slug));
  terms.forEach((term) => {
    if ([...slugSet].filter((s) => s === term.slug).length > 1) {
      allErrors.push(`Duplicate slug: ${term.slug}`);
    }
    term.related.forEach((ref) => {
      if (!slugSet.has(ref)) {
        allErrors.push(`${term.slug}: related references missing slug "${ref}"`);
      }
    });
  });

  // 4. Exit if errors
  if (allErrors.length > 0) {
    console.error('Build errors:');
    allErrors.forEach((e) => console.error(`  ${e}`));
    process.exit(1);
  }

  // 5. Sort: topic → coinedYear desc → term
  terms.sort((a, b) => {
    if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
    if ((b.coinedYear || 0) !== (a.coinedYear || 0)) return (b.coinedYear || 0) - (a.coinedYear || 0);
    return a.ko.term.localeCompare(b.ko.term, 'ko');
  });

  // 6. Write
  writeFileSync(outputPath, JSON.stringify(terms, null, 2), 'utf8');
  console.log(`✓ Generated ${terms.length} terms → ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

## 5. UI Layer Contracts

### 5.1 `src/components/tools/new-word/useGlossary.ts`

```typescript
interface UseGlossaryReturn {
  // Catalog
  catalog: MergedTerm[];
  filteredList: MergedTerm[];
  
  // Selection
  selectedSlug: string | null;
  selectedTerm: MergedTerm | null;
  select: (slug: string | null) => void;
  
  // Search
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
  
  // Topic filter
  activeTopic: string; // "all" | "mz" | "tech" | "favorites" | "recent"
  setTopic: (t: string) => void;
  
  // Language display
  displayLang: 'ko' | 'en' | 'both';
  setLang: (l: 'ko' | 'en' | 'both') => void;
  
  // Favorites + Recents
  favorites: string[];
  recents: string[];
  toggleFavorite: (slug: string) => void;
  
  // Actions
  copy: (text: string) => Promise<void>; // clipboard.writeText with fallback + silent fail
}

export function useGlossary(): UseGlossaryReturn {
  // 1. Dynamic import catalog
  const [catalog, setCatalog] = useState<MergedTerm[]>([]);
  
  // 2. Initialize localStorage
  const [store, setStore] = useState<GlossaryStore>({
    version: STORE_VERSION,
    favorites: [],
    recents: [],
    meta: { createdAt: Date.now() },
  });

  useEffect(() => {
    (async () => {
      try {
        const module = await import('./data/terms.generated.json');
        const terms = module.default || module;
        const pruned = pruneUnknown(store.recents, terms);
        setStore((s) => ({ ...s, recents: pruned }));
        setCatalog(terms);
      } catch (e) {
        console.error('Failed to load catalog', e);
      }
    })();
  }, []);

  // 3. Compute filtered list
  const filtered = useMemo(() => {
    let result = catalog;
    
    if (activeTopic === 'mz') result = byTopic(result, 'mz');
    else if (activeTopic === 'tech') result = byTopic(result, 'tech');
    else if (activeTopic === 'favorites') result = result.filter((t) => store.favorites.includes(t.slug));
    else if (activeTopic === 'recent') result = store.recents.map((s) => byId(catalog, s)).filter(Boolean);
    
    return filterTerms(result, query);
  }, [catalog, activeTopic, query, store.favorites, store.recents]);

  // Other implementation details...
  
  return {
    catalog,
    filteredList: filtered,
    selectedSlug,
    selectedTerm: selectedSlug ? byId(catalog, selectedSlug) : null,
    select: (slug) => {
      setSelectedSlug(slug);
      if (slug) {
        setStore((s) => ({
          ...s,
          recents: pushRecent(s.recents, slug),
        }));
      }
    },
    query,
    setQuery,
    resultCount: filtered.length,
    activeTopic,
    setTopic,
    displayLang,
    setLang,
    favorites: store.favorites,
    recents: store.recents,
    toggleFavorite: (slug) => {
      setStore((s) => ({
        ...s,
        favorites: toggleFavorite(s.favorites, slug),
      }));
    },
    copy: async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        // Success toast (handled by parent toast system)
      } catch {
        // Silent fail per SPEC
      }
    },
  };
}
```

---

## 6. Platform Integration Delta

### 6.1 `src/tools/registry.ts` (add entry)

```typescript
{
  id: 'new-word',
  slug: 'new-word',
  category: 'text',
  icon: 'BookA',
  accent: 'mint',
  status: 'coming_soon', // → 'live' when ready
  isNew: true,
  order: 3,
  keywords: [
    '신조어', '유행어', 'MZ', '밈', '용어', '용어사전', '트렌드',
    '바이브코딩', '갓생', '억까', 'new word', 'slang', 'glossary',
    'trending', 'mz slang', 'vibe coding',
  ],
}
```

### 6.2 `src/app/[locale]/tools/[slug]/page.tsx` (add branches)

```typescript
const NewWord = dynamic(() =>
  import('@/components/tools/new-word/NewWord').then((m) => ({
    default: m.NewWord,
  }))
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.status !== 'live') {
    return {};
  }

  const t = await getTranslations({ locale, namespace: `tools.${slug}` });

  let title: string;
  let description: string;
  
  // ... existing branches ...
  
  if (slug === 'new-word') {
    title = t('intro.title'); // or t('meta.title')
    description = t('intro.lead');
  } else {
    return {};
  }

  return buildToolMetadata({ locale, slug, title, description });
}

async function ToolContent({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);

  if (!tool || tool.status !== 'live') {
    notFound();
  }

  // ... existing branches ...

  if (slug === 'new-word') {
    return <NewWord />;
  }

  notFound();
}
```

### 6.3 `src/lib/seo.ts` (add helper)

```typescript
/**
 * Build schema.org DefinedTermSet + DefinedTerm JSON-LD for glossary.
 */
export function definedTermSetJsonLd({
  locale,
  terms,
}: {
  locale: string;
  terms: MergedTerm[];
}): unknown {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';
  const toolUrl = `${siteUrl}/${locale}/tools/new-word`;

  const definingWork = locale === 'ko' ? '신조어 용어사전' : 'New Word Glossary';

  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': toolUrl,
    url: toolUrl,
    name: definingWork,
    hasDefinedTerm: terms.map((term) => ({
      '@type': 'DefinedTerm',
      term: locale === 'ko' ? term.ko.term : term.en.term,
      definition: locale === 'ko' ? term.ko.definition : term.en.definition,
      inDefinedTermSet: { '@id': toolUrl },
      url: `${toolUrl}#${term.slug}`, // Phase 2: deep-link to per-term route
    })),
  };
}
```

### 6.4 `src/i18n/messages/{ko,en}.json` (add keys)

```json
{
  "tools": {
    "new-word": {
      "intro": {
        "eyebrow": "텍스트 도구" / "TEXT TOOL",
        "title": "신조어 용어사전" / "New Word Glossary",
        "lead": "요즘 유행하는 MZ 용어와 최신 기술 용어를 뜻·예문과 함께 한국어·영어로 찾아보세요. / …"
      },
      "search": {
        "placeholder": "용어·뜻·태그로 검색 (예: 갓생, 바이브 코딩, AI) / …",
        "resultCount": "{count}개 결과 / {count} results"
      },
      "topics": {
        "all": "전체 / All",
        "mz": "MZ 용어 / MZ Slang",
        "tech": "기술 용어 / Tech Terms",
        "favorites": "즐겨찾기 / Favorites",
        "recent": "최근 본 / Recent"
      },
      "emptyStates": {
        "noResults": "'{query}'에 해당하는 용어가 없어요. / No terms match '{query}'.",
        "emptyFavorites": "별을 눌러 자주 보는 용어를 저장하세요. / Star terms to save them.",
        "emptyRecent": "최근 본 용어가 여기에 모여요. / Your recent terms appear here."
      },
      "detail": {
        "examples": "예시 / Examples",
        "origin": "유래 / Origin",
        "tags": "태그 / Tags",
        "copyTerm": "용어 복사 / Copy term",
        "copyDefinition": "뜻 복사 / Copy definition",
        "copied": "복사되었습니다 / Copied!",
        "relatedTerms": "관련 용어 / Related Terms"
      },
      "lang": {
        "ko": "한국어 / Korean",
        "en": "English",
        "both": "한영혼용 / Both"
      },
      "howTo": {
        "title": "신조어 용어사전이란? / What is New Word?",
        "content": "…"
      },
      "faq": {
        "title": "자주 묻는 질문 / FAQ",
        "qa": [ /* … */ ]
      }
    }
  }
}
```

---

## 7. Build Order & Parallelization

### Phases (sequential blocks; within each, parallel where possible)

**Phase 1 — Domain Foundation (NO parallel needed; blocks all others)**
1. `src/lib/new-word/schema.ts` → zod schemas + safeparse helpers
2. `src/lib/new-word/slug.ts` → slugify + resolveSlug
3. `src/lib/new-word/merge.ts` → mergePair + validatePair (depends on schema)
4. `src/lib/new-word/catalog.ts` → allTerms, byId, byTopic, validateRelatedIntegrity
5. `src/lib/new-word/search.ts` → filterTerms, normalizeSearchText
6. `src/lib/new-word/favorites.ts` → toggleFavorite, pushRecent, pruneUnknown
7. **TDD first:** RED → GREEN → REFACTOR cycle per function; ≥80% coverage per rule

**Phase 2 — Shared Markdown Module (independent; can start in parallel with Phase 1)**
1. `src/components/markdown/Markdown.tsx` → React wrapper, overrides map, code-split
2. `src/lib/markdown/markdownToPlainText.ts` → pure extraction helper (optional)
3. Smoke tests: verify overrides render, external links work, raw HTML blocked

**Phase 3 — Generator + Content (depends on Phase 1 schema; independent of Phase 2 UI)**
1. `content/new-word/_TEMPLATE.md`, `_TEMPLATE_en.md` — annotated authoring templates
2. `content/new-word/README.md` — naming, required fields, seed topics guide
3. `content/new-word/terms/` — seed 12 terms (6 MZ, 6 Tech)
   - MZ: god-saeng, eok-kka, aljaldakkkalsen, sbuljae, wannaes, king-batda
   - Tech: vibe-coding, loop-engineering, prompt-engineering, ai-agent, context-window, rag
4. `scripts/generate-glossary.mjs` → implements generator contract (uses Phase 1 domain)
5. `package.json` → add `"prebuild": "node scripts/generate-glossary.mjs"`, `"predev": "node scripts/generate-glossary.mjs"`
6. **Validation tests:** pair-missing, dupe-slug, dangling-related, empty-field → fail generator
7. `src/components/tools/new-word/data/terms.generated.json` — auto-generated (gitignore OR commit; recommend commit for CI)

**Phase 4 — Usecase Layer (depends on Phase 1 schema + Phase 3 generated artifact)**
1. `src/components/tools/new-word/useGlossary.ts` → dynamic import catalog, localStorage, derived state
   - Also depends on Phase 2 Markdown module (for JSX rendering of body fields if used)

**Phase 5 — UI Layer (depends on Phase 4 useGlossary + Phase 2 Markdown + Phase 3 catalog)**
1. In parallel:
   - `TopicTabs.tsx`, `TermSearch.tsx`, `TermList.tsx`, `TermCard.tsx`, `TermDetail.tsx`, `RelatedChips.tsx`
   - `NewWordIntro.tsx`, `NewWordHowTo.tsx`, `NewWordFaq.tsx`
2. `NewWord.tsx` (orchestrator; glues all above + useGlossary)
3. Keyboard shortcuts + a11y (roving tabindex, aria-live, focus management)

**Phase 6 — Platform Integration (depends on Phase 5 NewWord component)**
1. Update `src/tools/registry.ts` (add entry)
2. Update `src/app/[locale]/tools/[slug]/page.tsx` (add slug branch)
3. Add `definedTermSetJsonLd()` to `src/lib/seo.ts`
4. Add i18n keys to `src/i18n/messages/{ko,en}.json`

**Phase 7 — QA + Finalization**
1. **Unit tests:** domain ≥80%, generator validation fixtures, useGlossary mock catalog
2. **E2E tests:** 5 SPEC scenarios (folder→list, search/filter, detail+lang-toggle, favorites/recents, JSON-LD)
3. **Visual regression:** 320/768/1024 both themes, no overflow
4. **Accessibility:** axe pass, keyboard nav, aria-live, focus rings
5. **Performance:** bundle size (markdown-to-jsx dynamic import), CLS (stable layout), LCP

---

## 8. Risk & Invariants

### CRITICAL Invariants (gates = build fails if violated)

1. **Pair integrity:** Every term MUST have both `<term>.md` + `<term>_en.md`. Missing pair → generator exit(1) with file path + reason.
2. **Required fields per locale:** term, definition, ≥1 example. Missing → zod parse fail → generator exit(1).
3. **Slug uniqueness:** No two terms with same slug. Duplication → generator exit(1).
4. **Related reference integrity:** All `related` slugs exist in catalog. Dangling → generator exit(1).
5. **No React in domain:** `src/lib/new-word/*` NEVER imports react, next, window, DOM. Enforced by linter.
6. **Prerender SEO outside `mounted` gate:** Intro + HowTo + FAQ + DefinedTermSet JSON-LD rendered SSR (not hidden by React conditional). AI crawlers never execute JS (no `mounted` gate).
7. **Bundle integrity:** Markdown-to-jsx imported only on new-word route (dynamic import). Landing bundle < 150kb gzip.
8. **localStorage safety:** Corrupt blob → zod safeParse fail → fallback to in-memory (no throw). recents/favorites never precious.

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Content author adds orphan file (missing pair) | Generator pre-build scan catches, blocks build with path+reason. README guide emphasizes pair rule. |
| Circular `related` references or self-reference | Generator validates all related exist; cycle detection not required (not harmful). |
| `terms.generated.json` becomes stale (author forgets predev) | Commit artifact to repo + CI checks "is artifact up-to-date?". Or auto-generate via predev. |
| Markdown body in field contains HTML/script | markdown-to-jsx `disableParsingRawHTML: true` blocks it. Zod validates string only (no object/array). |
| localStorage full (quota error) | setItem catches error, keeps data in-memory, no user error toast (silent graceful degradation). |
| Deep-link phase 2 (per-term routes) conflicts with current SPA design | Current scope: single route + client state. Phase 2 candidate documented out-of-scope. |

---

## 9. Testing Strategy

### Unit Tests (domain layer ≥80% coverage)

| Module | Test Cases | Coverage |
|--------|-----------|----------|
| `schema.ts` | TermFileFront parse: valid/invalid, required fields, optional fields | 90%+ |
| `slug.ts` | slugify: Korean, Latin, special chars, edge cases; resolveSlug: with/without slug field | 100% |
| `merge.ts` | mergePair: ko/en inherit rule; validatePair: errors collect non-blocking | 100% |
| `catalog.ts` | allTerms, byId, byTopic, topics; validateRelatedIntegrity: dangling detection | 100% |
| `search.ts` | filterTerms: empty/nonempty query, both locales, diacritics, case; normalizeSearchText | 100% |
| `favorites.ts` | toggleFavorite: add/remove; pushRecent: MRU, de-dup, truncate; pruneUnknown | 100% |

### Generator Validation Tests

| Case | Expected | Verified |
|------|----------|----------|
| Pair-missing (Ko only or En only) | exit(1) + file path in stderr | CI script |
| Dupe slug | exit(1) + slug value in stderr | CI script |
| Dangling related | exit(1) + slug+related-ref in stderr | CI script |
| Empty required field | exit(1) + file+field in stderr | CI script |
| Valid catalog | exit(0) + terms.generated.json written | CI script |

### E2E Scenarios (Playwright)

1. **Folder → List**: Add vibe-coding(.md/_en.md), pnpm dev, visit /ko/tools/new-word → see card, pnpm build → static 200 OK
2. **Search/Filter**: Type "갓생", see MZ-only filter, tab "기술" → tech only, search "AI" → matches both locales
3. **Detail + Lang**: Click card → detail panel, click [Both] → Ko+En side-by-side, click related chip → term switches
4. **Favorites + Recents**: Star card → "즐겨찾기" tab shows it, reload → persists, unknown slugs pruned on load
5. **JSON-LD + SEO**: Build prod → /ko and /en have unique title/description/canonical/hreflang, DefinedTermSet valid schema.org

### Component Tests (Vitest + React Testing Library)

- `useGlossary`: mock catalog, test state, localStorage sync
- `NewWord`: integration with useGlossary, keyboard shortcuts, a11y (aria-live, focus)
- Visual regression: 320/768/1024, both themes (light only Phase 1), no overflow, bottom-sheet mobile

---

## 10. File Structure Summary

```
content/new-word/
├── _TEMPLATE.md              # Korean template (excluded by generator)
├── _TEMPLATE_en.md           # English template
├── README.md                 # Authoring guide
└── terms/
    ├── vibe-coding.md        # Seed terms (12 total)
    ├── vibe-coding_en.md
    ├── god-saeng.md
    ├── god-saeng_en.md
    └── …

scripts/
└── generate-glossary.mjs     # Build-time generator

src/lib/
├── new-word/
│   ├── schema.ts             # Zod schemas
│   ├── merge.ts              # mergePair, validatePair
│   ├── slug.ts               # slugify, resolveSlug
│   ├── catalog.ts            # allTerms, byId, byTopic, validateRelatedIntegrity
│   ├── search.ts             # filterTerms, normalizeSearchText
│   └── favorites.ts          # toggleFavorite, pushRecent, pruneUnknown
└── markdown/
    └── markdownToPlainText.ts  # Plain-text extractor (optional pure helper)

src/components/
├── markdown/
│   └── Markdown.tsx          # Shared renderer (markdown-to-jsx wrapper)
└── tools/new-word/
    ├── NewWord.tsx           # Orchestrator (use client)
    ├── useGlossary.ts        # Hook (catalog + localStorage + copy)
    ├── TopicTabs.tsx
    ├── TermSearch.tsx
    ├── TermList.tsx
    ├── TermCard.tsx
    ├── TermDetail.tsx
    ├── RelatedChips.tsx
    ├── NewWordIntro.tsx      # SEO intro (server-render where possible)
    ├── NewWordHowTo.tsx      # SEO long-form
    ├── NewWordFaq.tsx        # FAQPage JSON-LD
    └── data/
        └── terms.generated.json  # Generated artifact (commit or gitignore)
```

---

## 11. Key Decisions & Rationale

1. **Markdown-to-jsx, not custom parser:** Already in repo, battle-tested, markdown-safe (disallow raw HTML).
2. **terms.generated.json committed (not gitignored):** Deterministic, enables CI "is artifact up-to-date?" check, reviewable diff shows content changes.
3. **`body` field optional, not core:** MVP uses structured frontmatter (term, definition, examples, origin). Body is extensible markdown for future Phase 2 rich content; MVP ignores it in UI.
4. **localStorage-only persistence:** No network, no backend. Favorites/recents fully local. Unknown slugs auto-pruned on load.
5. **Single route SPA (no per-term deep-links):** Phase 1 MVP. Phase 2 candidate (deep-links + route + generateStaticParams).
6. **Shared `<Markdown>` component:** Prevents markdown-to-jsx code-split duplication. All tools reuse. Safety (no raw HTML) enforced once.
7. **Domain layer (src/lib/new-word/) pure TS:** Enables fast unit testing, reuse in Node.js (generator script), framework independence.
8. **Generator exit(1) on validation failure:** No silent omission. CI catches bad content immediately.

---

## 12. Success Criteria Checklist

- [ ] Domain layer ≥80% unit coverage (schema, merge, slug, search, favorites, catalog)
- [ ] Generator validation tests pass (pair-missing, dupe, dangling, empty → fail)
- [ ] `terms.generated.json` auto-generated on prebuild + predev
- [ ] useGlossary hook integrates catalog + localStorage + copy without error
- [ ] UI components render, keyboard nav works, a11y pass (axe)
- [ ] E2E 5 scenarios green (folder→list, search/filter, detail+lang, favorites+recents, JSON-LD)
- [ ] Visual regression 320/768/1024, no overflow, bottom-sheet mobile
- [ ] Registry entry added + slug branch mounted + generateMetadata wired
- [ ] i18n keys complete (ko/en)
- [ ] Shared `<Markdown>` component tested, code-split on tool route only
- [ ] Build green (tsc 0, bundle size < 150kb landing, CLS stable)
- [ ] Seed 12 terms (6 MZ + 6 Tech) written + generator validates + catalog renders

