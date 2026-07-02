# Rankings (별별 랭킹) — Architecture Blueprint

**Status:** Ready for parallel team implementation  
**Canonical source:** `docs/services/news/rankings/SPEC.md`  
**Reference sibling:** `new-word` tool (same markdown-pair + generator + SPA pattern)  
**File written:** `_workspace/15_architect_rankings-blueprint.md`

---

## § A — DOMAIN LAYER CONTRACTS

### A.1 Schemas (Pure TypeScript, no React/Next)

**File:** `src/lib/rankings/schema.ts`

```typescript
import { z } from 'zod';

export const STORE_VERSION = 1;

/**
 * Individual markdown file frontmatter (parse unit).
 * Each ranking file (ko + en pair) has these top-level YAML fields.
 */
export const RankingFileFrontSchema = z.object({
  // REQUIRED: metadata that identifies the ranking
  title: z.string().min(1, 'title required'),
  field: z.enum(['ai', 'programming', 'tech', 'games', 'movies', 'music']),
  asOfDate: z.string().min(1, 'asOfDate required (ISO date: YYYY-MM or YYYY-MM-DD)'),
  sourceNote: z.string().min(1).max(200, 'sourceNote max 200 chars'),
  sourceUrl: z.string().url().optional(), // NEW: optional clickable source link

  // OPTIONAL: derivable fields
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),

  // REQUIRED: items array
  items: z.array(
    z.object({
      rank: z.number().int().positive(),
      name: z.string().min(1, 'item name required'),
      description: z.string().min(1).max(200, 'item description max 200 chars'),
      link: z.string().url().optional(),
      imageUrl: z.string().url().optional(),
      imageWidth: z.number().int().positive().optional(),
      imageHeight: z.number().int().positive().optional(),
    })
  ).min(3, '≥3 items per ranking'),
});

export type RankingFileFront = z.infer<typeof RankingFileFrontSchema>;

/**
 * Merged ko+en record (catalog item).
 * Result of merging koFront + enFront via canonical rule.
 * This is what gets emitted to rankings.generated.json.
 */
export const MergedRankingSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be alphanumeric+hyphen'),
  field: z.enum(['ai', 'programming', 'tech', 'games', 'movies', 'music']),
  asOfDate: z.string(), // ISO date
  sourceNote: z.string(),
  sourceUrl: z.string().url().optional(), // NEW: optional
  
  ko: z.object({
    title: z.string(),
    items: z.array(
      z.object({
        rank: z.number().int(),
        name: z.string(),
        description: z.string(),
        link: z.string().optional(),
        imageUrl: z.string().optional(),
        imageWidth: z.number().optional(),
        imageHeight: z.number().optional(),
      })
    ),
  }),
  en: z.object({
    title: z.string(),
    items: z.array(
      z.object({
        rank: z.number().int(),
        name: z.string(),
        description: z.string(),
        link: z.string().optional(),
        imageUrl: z.string().optional(),
        imageWidth: z.number().optional(),
        imageHeight: z.number().optional(),
      })
    ),
  }),
});

export type MergedRanking = z.infer<typeof MergedRankingSchema>;

/**
 * localStorage persistence blob.
 * Stores user preferences (favorites, recents).
 */
export const RankingsStoreSchema = z.object({
  version: z.number().int().min(1),
  favorites: z.array(z.string()), // ranking slugs
  recents: z.array(z.string()),   // ranking slugs, MRU first
  meta: z.object({
    lastField: z.string().optional(),
    createdAt: z.number().int(),
  }),
});

export type RankingsStore = z.infer<typeof RankingsStoreSchema>;

/**
 * Safe JSON parsing helper (never throws, returns null on failure).
 * Used for corrupt localStorage recovery.
 */
export function safeJsonParse<T>(json: string, schema: z.ZodType<T>): T | null {
  try {
    const parsed = JSON.parse(json);
    const result = schema.safeParse(parsed);
    return result.success ? parsed : null;
  } catch {
    return null;
  }
}
```

---

### A.2 Slug Resolution

**File:** `src/lib/rankings/slug.ts`

```typescript
import type { RankingFileFront } from './schema';

/**
 * Slugify a string: lowercase, remove diacritics, replace spaces/special with hyphens.
 * Used for deriving slug from filename.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except hyphens
    .replace(/\s+/g, '-') // Space → hyphen
    .replace(/-+/g, '-') // Collapse hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}

/**
 * Resolve slug: use frontmatter slug if present, else derive from filename.
 * Examples:
 *   resolveSlug({title: "...", ...}, "best-sushi.md") → "best-sushi"
 *   resolveSlug({title: "...", slug: "custom-id", ...}, "best-sushi.md") → "custom-id"
 */
export function resolveSlug(front: RankingFileFront, filename: string): string {
  if (front.slug) {
    return front.slug;
  }
  // Derive: "best-sushi.md" or "best-sushi_en.md" → "best-sushi"
  const base = filename.replace(/(_en)?\.md$/, '');
  return slugify(base);
}
```

---

### A.3 Merge & Validation

**File:** `src/lib/rankings/merge.ts`

```typescript
import { RankingFileFrontSchema, type RankingFileFront, type MergedRanking } from './schema';
import { resolveSlug } from './slug';

/**
 * Merge ko + en pair following canonical rule:
 * - Structural fields (field, asOfDate, sourceNote, sourceUrl) from KO canonical
 * - EN inherits if absent; must match if present (error if conflict)
 * - Locale items (title, items[]) independent per locale
 *
 * INVARIANT: every merged record has both ko+en with ≥3 items each.
 */
export function mergePair(
  koFront: RankingFileFront,
  enFront: RankingFileFront,
  koFilename: string = 'unknown.md'
): MergedRanking {
  const slug = resolveSlug(koFront, koFilename);
  const field = koFront.field;
  const asOfDate = koFront.asOfDate;
  const sourceNote = koFront.sourceNote;
  const sourceUrl = koFront.sourceUrl; // NEW: optional

  return {
    slug,
    field,
    asOfDate,
    sourceNote,
    sourceUrl,
    ko: {
      title: koFront.title,
      items: koFront.items,
    },
    en: {
      title: enFront.title,
      items: enFront.items,
    },
  };
}

/**
 * Validate ko+en pair and return merged record + errors.
 * Errors are non-blocking (collect all before failing).
 * Returns { ranking: MergedRanking | null, errors: string[] }.
 */
export function validatePair(
  koFilename: string,
  koFront: unknown,
  enFront: unknown
): { ranking: MergedRanking | null; errors: string[] } {
  const errors: string[] = [];

  // Parse frontmatter
  const koResult = RankingFileFrontSchema.safeParse(koFront);
  const enResult = RankingFileFrontSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(`${koFilename}: KO parse error — ${koResult.error.message}`);
  }
  if (!enResult.success) {
    errors.push(`${koFilename}: EN parse error — ${enResult.error.message}`);
  }

  if (errors.length > 0) {
    return { ranking: null, errors };
  }

  const ko = koResult.data!;
  const en = enResult.data!;

  // Canonical rule check: EN field/asOfDate/sourceNote must not override KO
  if (en.field && en.field !== ko.field) {
    errors.push(
      `${koFilename}: EN field must match KO (KO="${ko.field}", EN="${en.field}")`
    );
  }
  if (en.asOfDate && en.asOfDate !== ko.asOfDate) {
    errors.push(
      `${koFilename}: EN asOfDate must match KO (KO="${ko.asOfDate}", EN="${en.asOfDate}")`
    );
  }
  if (en.sourceNote && en.sourceNote !== ko.sourceNote) {
    errors.push(
      `${koFilename}: EN sourceNote must match KO`
    );
  }
  if (en.sourceUrl && en.sourceUrl !== ko.sourceUrl) {
    errors.push(
      `${koFilename}: EN sourceUrl must match KO`
    );
  }

  const ranking = mergePair(ko, en, koFilename);

  return { ranking: errors.length === 0 ? ranking : null, errors };
}
```

---

### A.4 Search

**File:** `src/lib/rankings/search.ts`

```typescript
import type { MergedRanking } from './schema';

/**
 * Normalize search text: lowercase, NFC, remove spaces/hyphens/underscores.
 * Makes search case/diacritic insensitive and space-insensitive.
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\s\-_]/g, ''); // Remove spaces, hyphens, underscores
}

/**
 * Filter rankings by query, across both locales.
 * Match if any of: ranking title (ko+en), field, item names, descriptions (both locales).
 * Returns filtered list in stable order.
 */
export function filterRankings(
  rankings: MergedRanking[],
  query: string,
  locale?: 'ko' | 'en'
): MergedRanking[] {
  if (!query.trim()) {
    return rankings;
  }

  const normalized = normalizeSearchText(query);

  return rankings.filter((ranking) => {
    const koSearchText = normalizeSearchText(
      [
        ranking.ko.title,
        ranking.field,
        ...ranking.ko.items.map(item => `${item.name} ${item.description}`),
      ].join(' ')
    );
    const enSearchText = normalizeSearchText(
      [
        ranking.en.title,
        ranking.field,
        ...ranking.en.items.map(item => `${item.name} ${item.description}`),
      ].join(' ')
    );

    return koSearchText.includes(normalized) || enSearchText.includes(normalized);
  });
}
```

---

### A.5 Catalog Access

**File:** `src/lib/rankings/catalog.ts`

```typescript
import type { MergedRanking } from './schema';

/**
 * Return all rankings (immutable reference)
 */
export function allRankings(catalog: MergedRanking[]): MergedRanking[] {
  return catalog;
}

/**
 * Find ranking by slug
 */
export function byId(catalog: MergedRanking[], slug: string): MergedRanking | null {
  return catalog.find((r) => r.slug === slug) || null;
}

/**
 * Filter rankings by field
 */
export function byField(catalog: MergedRanking[], field: string): MergedRanking[] {
  return catalog.filter((r) => r.field === field);
}

/**
 * Get unique field ids in canonical order (not sorted — order is as defined in enum).
 * Only return fields that exist in the catalog.
 */
export function fields(catalog: MergedRanking[]): string[] {
  const unique = new Set(catalog.map((r) => r.field));
  const fieldOrder = ['ai', 'programming', 'tech', 'games', 'movies', 'music'];
  return fieldOrder.filter(f => unique.has(f));
}

/**
 * Validate all slugs are unique within their field.
 * Returns array of errors; empty = all valid.
 */
export function validateUniqueSlugPerField(catalog: MergedRanking[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, Set<string>>(); // field → {slugs}

  catalog.forEach((ranking) => {
    if (!seen.has(ranking.field)) {
      seen.set(ranking.field, new Set());
    }
    const fieldSlugs = seen.get(ranking.field)!;
    if (fieldSlugs.has(ranking.slug)) {
      errors.push(`Duplicate slug "${ranking.slug}" in field "${ranking.field}"`);
    } else {
      fieldSlugs.add(ranking.slug);
    }
  });

  return errors;
}

/**
 * Validate all items have consecutive ranks (1, 2, 3, ..., N).
 * Returns array of errors; empty = all valid.
 */
export function validateRanksConsecutive(catalog: MergedRanking[]): string[] {
  const errors: string[] = [];

  catalog.forEach((ranking) => {
    const koRanks = ranking.ko.items.map(i => i.rank).sort((a, b) => a - b);
    const enRanks = ranking.en.items.map(i => i.rank).sort((a, b) => a - b);

    const validateSequence = (ranks: number[], locale: string) => {
      for (let i = 0; i < ranks.length; i++) {
        if (ranks[i] !== i + 1) {
          errors.push(
            `${ranking.slug} (${locale}): ranks must be consecutive 1..N, got gap at position ${i + 1}`
          );
          break;
        }
      }
    };

    validateSequence(koRanks, 'ko');
    validateSequence(enRanks, 'en');
  });

  return errors;
}
```

---

### A.6 Favorites & Recents

**File:** `src/lib/rankings/favorites.ts`

```typescript
import type { MergedRanking } from './schema';

export const RECENTS_MAX = 20;

/**
 * Toggle favorite: add if absent, remove if present. Preserve order.
 * Immutable: returns new array, never mutates input.
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
 * Immutable: returns new array.
 */
export function pushRecent(
  slugs: string[],
  slug: string,
  max: number = RECENTS_MAX
): string[] {
  // Move to front if exists, else prepend
  const filtered = slugs.filter((s) => s !== slug);
  const updated = [slug, ...filtered];
  return updated.slice(0, max);
}

/**
 * Remove slugs not in catalog (e.g., after ranking removal).
 * Immutable: returns new array.
 */
export function pruneUnknown(slugs: string[], catalog: MergedRanking[]): string[] {
  const known = new Set(catalog.map((r) => r.slug));
  return slugs.filter((s) => known.has(s));
}
```

---

### A.7 Domain Tests

**Red tests to write (TDD order):**

File: `src/lib/rankings/schema.test.ts`
- RankingFileFrontSchema: valid ko/en pairs parse
- RankingFileFrontSchema: missing required fields (title, field, asOfDate, sourceNote, items) fail parse
- RankingFileFrontSchema: <3 items fails parse
- RankingFileFrontSchema: imageUrl requires imageWidth+imageHeight

File: `src/lib/rankings/merge.test.ts`
- mergePair: ko structural fields canonical (field, asOfDate, sourceNote)
- mergePair: en inherits if absent, matches if present
- mergePair: ko/en items independent
- validatePair: ko parse error → error list, ranking=null
- validatePair: field mismatch → error, ranking=null
- validatePair: sourceUrl mismatch → error, ranking=null

File: `src/lib/rankings/slug.test.ts`
- slugify: "Best Sushi Worldwide" → "best-sushi-worldwide"
- slugify: "Top Restaurants 2024!" → "top-restaurants-2024"
- resolveSlug: front.slug present → use it
- resolveSlug: front.slug absent → derive from filename

File: `src/lib/rankings/search.test.ts`
- normalizeSearchText: case/diacritic/space insensitive
- filterRankings: empty query → all rankings
- filterRankings: match title (ko + en)
- filterRankings: match field
- filterRankings: match item name/description (ko + en)

File: `src/lib/rankings/catalog.test.ts`
- byId: returns matching ranking or null
- byField: filters by field
- fields: unique fields in order (only present fields)
- validateUniqueSlugPerField: detects dupe slug per field
- validateRanksConsecutive: detects gaps/invalid ranks

File: `src/lib/rankings/favorites.test.ts`
- toggleFavorite: immutable add/remove
- pushRecent: immutable MRU order, dedupe, truncate
- pruneUnknown: removes unknown slugs

---

## § B — PLATFORM LAYER CONTRACTS

### B.1 Platform Registry & Category

**File:** `src/tools/types.ts` — Update ToolCategory union:

```typescript
export type ToolCategory = 'random' | 'calculator' | 'text' | 'converter' | 'fun' | 'mindset' | 'dev' | 'news';
```

**File:** `src/tools/registry.ts` — Add entry:

```typescript
{
  id: 'rankings',
  slug: 'rankings',
  category: 'news',
  icon: 'Trophy',
  accent: 'rose',
  status: 'live',
  isNew: true,
  order: 15,
  keywords: [
    '별별랭킹', '별별', '랭킹', '순위', '영화', '음식', '여행', '게임', '음악', '책', '앱',
    'rankings', 'top', 'best', 'curator', 'movies', 'restaurants', 'travel', 'games'
  ],
},
```

**File:** `src/lib/tool-search.ts` — Update CATEGORY_ORDER:

```typescript
export const CATEGORY_ORDER = ['all', 'random', 'calculator', 'text', 'converter', 'fun', 'mindset', 'dev', 'news'];
```

---

### B.2 Generator Specification

**File:** `scripts/generate-rankings.mjs`

```javascript
#!/usr/bin/env node

/**
 * Build-time generator: scan content/rankings/, parse markdown,
 * validate, merge ko+en pairs, and emit rankings.generated.json.
 *
 * Deterministic: no Date/random, exit 0 on success, 1 on any validation failure.
 * Wire to package.json: "predev": "...", "prebuild": "..."
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

// Re-declare schemas (keep in sync with src/lib/rankings/schema.ts)
const RankingFileFrontSchema = z.object({
  title: z.string().min(1),
  field: z.enum(['ai', 'programming', 'tech', 'games', 'movies', 'music']),
  asOfDate: z.string().min(1),
  sourceNote: z.string().min(1).max(200),
  sourceUrl: z.string().url().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  items: z.array(
    z.object({
      rank: z.number().int().positive(),
      name: z.string().min(1),
      description: z.string().min(1).max(200),
      link: z.string().url().optional(),
      imageUrl: z.string().url().optional(),
      imageWidth: z.number().int().positive().optional(),
      imageHeight: z.number().int().positive().optional(),
    })
  ).min(3),
});

// ... (full generator implementation follows new-word pattern)
// 1. Scan content/rankings/, exclude '_' prefix, group by base filename
// 2. matter() parse each file → zod validate
// 3. mergePair: canonical rule, resolveSlug
// 4. validatePair: field/asOfDate/sourceNote canonical, items independent
// 5. Collect errors (non-blocking validation)
// 6. Check: unique slug per field, consecutive ranks
// 7. Sort by field order → asOfDate desc → title ko locale
// 8. Write rankings.generated.json
// 9. Exit 0 on success, 1 with stderr on ANY error
```

**Package.json wiring** (append to existing glossary generators):

```json
{
  "predev": "node scripts/generate-glossary.mjs && node scripts/generate-rankings.mjs",
  "prebuild": "node scripts/generate-glossary.mjs && node scripts/generate-rankings.mjs"
}
```

---

### B.3 Route & Metadata

**File:** `src/app/[locale]/tools/[slug]/page.tsx` — Add slug branch:

```typescript
// Inside ToolContent component, after existing new-word branch:
if (slug === 'rankings') {
  return (
    <Suspense fallback={<ToolLoadingShell />}>
      <dynamic(() => import('@/components/tools/rankings/Rankings'), {
        loading: () => <ToolLoadingShell />,
        ssr: true, // SSR for intro/FAQ/JSON-LD
      }) />
    </Suspense>
  );
}

// In generateMetadata:
if (slug === 'rankings') {
  const t = await getTranslations({ locale, namespace: 'tools.rankings' });
  const title = t('meta.title') || 'Various Rankings';
  const description = t('meta.description') || 'Curated ranked lists...';
  return buildToolMetadata({ locale, slug: 'rankings', title, description });
}
```

---

### B.4 I18N Message Contract

**File:** `src/i18n/messages/ko.json` and `en.json` — Add full `tools.rankings` namespace:

```json
{
  "tools": {
    "rankings": {
      "meta": {
        "title": "별별 랭킹 · 신뢰할 수 있는 추천 순위",
        "description": "영화, 음식, 여행, 게임 등 다양한 분야의 신뢰할 수 있는 순위 목록을 찾아보세요. 편집자가 엄선한 Top N 리스트."
      },
      "intro": {
        "eyebrow": "순위 도구",
        "title": "별별 랭킹",
        "lead": "영화·음식·여행·게임 등 다양한 분야의 신뢰할 수 있는 순위 목록을 찾아보세요."
      },
      "fields": {
        "ai": "AI·LLM",
        "programming": "프로그래밍",
        "tech": "기술",
        "games": "게임",
        "movies": "영화",
        "music": "음악"
      },
      "tabs": {
        "all": "전체",
        "favorites": "즐겨찾기",
        "recent": "최근 본 순위"
      },
      "search": {
        "placeholder": "순위·영화·레스토랑으로 검색…",
        "aria": "순위 검색",
        "resultCount": "결과 {count}개"
      },
      "list": {
        "itemCount": "{count}개 항목",
        "toggleFavorite": "즐겨찾기 토글",
        "emptyState": "'{query}'에 해당하는 순위가 없어요",
        "emptyFavorites": "즐겨찾기를 별 버튼으로 저장하세요"
      },
      "detail": {
        "selectHint": "순위를 선택하면 상세 정보가 여기에 표시됩니다",
        "provenance": {
          "aria": "순위 출처 및 기준일",
          "asOfLabel": "기준일",
          "sourceLabel": "출처"
        },
        "table": {
          "caption": "{title} — {count}개 항목 순위표",
          "rank": "순위",
          "name": "이름",
          "description": "설명",
          "link": "링크",
          "medal": ["🥇", "🥈", "🥉"]
        }
      },
      "toast": {
        "favoriteAdded": "즐겨찾기에 추가되었습니다",
        "favoriteRemoved": "즐겨찾기에서 제거되었습니다",
        "copied": "복사되었습니다"
      },
      "howTo": {
        "heading": "순위 보는 방법",
        "whatIsTitle": "별별 랭킹이란?",
        "whatIsBody": "편집자가 엄선한 각 분야의 Top N 리스트입니다...",
        "howToTitle": "사용 방법",
        "howToBody": "검색창에 키워드를 입력하거나...",
        "featuresTitle": "주요 기능",
        "featuresBody": "즐겨찾기로 자주 본 순위 저장..."
      },
      "faq": {
        "heading": "자주 묻는 질문",
        "items": [
          { "q": "순위는 실시간으로 업데이트되나요?", "a": "아니요, 각 순위는..." },
          { "q": "순위에 투표할 수 있나요?", "a": "불가능합니다. 모든 순위는..." }
        ]
      }
    }
  }
}
```

**EN equivalent** (mirror structure, English text).

---

## § C — UI LAYER CONTRACTS

### C.1 Hook Specification

**File:** `src/components/tools/rankings/useRankingsCatalog.ts`

```typescript
'use client';

import { useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
  STORE_VERSION,
  RankingsStoreSchema,
  type RankingsStore,
  type MergedRanking,
} from '@/lib/rankings/schema';
import { byId, byField, fields as getFields } from '@/lib/rankings/catalog';
import { filterRankings } from '@/lib/rankings/search';
import {
  toggleFavorite,
  pushRecent,
  pruneUnknown,
  RECENTS_MAX,
} from '@/lib/rankings/favorites';

const STORAGE_KEY = 'jurepi-rankings';
const SEARCH_DEBOUNCE = 120;

export interface UseRankingsCatalogReturn {
  catalog: MergedRanking[];
  filtered: MergedRanking[];
  selectedSlug: string | null;
  selectedRanking: MergedRanking | null;
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
  activeField: 'all' | string | 'favorites' | 'recent';
  setActiveField: (f: 'all' | string | 'favorites' | 'recent') => void;
  favorites: string[];
  recents: string[];
  toggleFavorite: (slug: string) => void;
  select: (slug: string | null) => void;
  copy: (text: string) => Promise<boolean>;
  fieldsAvailable: string[];
}

// Reducer + hook implementation (pattern identical to useGlossary)
// - Dynamic catalog import on mount
// - localStorage read/write with zod validation
// - Draft query + debounced commit (stale closure fix)
// - Immutable updates (favorites, recents, store)
// - Persist immediately on store change
```

---

### C.2 Component Tree & Spec

**Main orchestrator:** `src/components/tools/rankings/Rankings.tsx` (Client Component)
- Owns: catalog, query, selectedSlug, activeField state (via useRankingsCatalog)
- Layout: Intro(SSR above mounted gate) → mounted gate → [List | Detail] (SPA)
- Renders: RankingsIntro, RankingsLayout, RankingsHowTo, RankingsFaq, StructuredData

**RankingsIntro.tsx** (SSR, above mounted gate)
- H1: "별별 랭킹" / "Various Rankings"
- Lead: 1–2 sentences
- No interaction (static for SEO)

**RankingSearch.tsx** (gated)
- Input with "/" focus
- Clear (×) on non-empty
- Live filter, debounced 120ms
- Result count caption
- aria-controls the list

**FieldTabs.tsx** (gated)
- Horizontal pill row: All → fields (per FIELD_ORDER) → Favorites → Recent
- Active = brand honey-gold / on-brand text
- Inactive = surface-muted / text-secondary
- role="tablist", ArrowLeft/Right navigation, aria-selected

**RankingsList.tsx** (gated)
- Responsive grid: 1-col <768px, 2-col ≥768px
- Roving tabindex keyboard nav
- Each card: RankingCard component
- Empty state with clear button

**RankingCard.tsx** (gated)
- Title (18–20px/700), field badge (rose-tinted pill)
- Item count ("N개 항목")
- Star toggle (favorite, with aria-pressed)
- COMPACT SOURCE+DATE line (always visible): Calendar icon + asOfDate + sourceNote (truncated), rose-secondary text
- States: hover translateY(-2px) + shadow; focus visible ring; selected 2px rose ring
- Click/Enter/Space → select
- "f" key → toggle favorite (with aria-pressed + toast)

**RankingDetail.tsx** (gated, desktop sticky right / mobile bottom-sheet)
- Title + field badge (top)
- **ProvenanceBanner (CRITICAL, emphasized above all else)**
- RankingTable (below banner)
- Empty hint if no selection

**ProvenanceBanner.tsx** (CRITICAL trust surface)
- Surface: var(--accent-rose-soft) bg, 1px var(--accent-rose) border, radius lg, padding 12–16px
- Layout: 2 rows (as-of date | source note), left-aligned icons (Calendar | Info), labels in eyebrow weight, values in var(--text)/600 high contrast
- Calendar icon + "기준일" label + asOfDate value
- Info/BookMarked icon + "출처" label + sourceNote value
- sourceUrl present? → sourceNote renders as clickable link (rel=noopener target=_blank, rose text)
- aria-label="출처 및 기준일" (groups both lines semantically)
- MUST be visually above table (second-most-prominent after title)

**RankingTable.tsx** (semantic table, responsive)
- `<table>` with `<caption class="sr-only">` for screen readers
- `<thead>` with column headers (scope="col"): 순위/Rank, (썸네일), 이름/Name, 설명/Description, 링크/Link
- `<tbody>` rows (RankingRow × N)
- Responsive: ≥768px full table; <768px horizontal scroll wrapper (role="region" aria-label, focusable)
- Never overflow at 320px
- Zebra via var(--surface-muted), hover effect
- Caption: "{ranking title} — {N}개 항목 순위표"

**RankingRow.tsx** (one `<tr>`)
- Rank cell: medal emoji (🥇🥈🥉 top 3, plain "4." rest), rose accent text for top 3, tabular-nums
- Thumbnail cell (if imageUrl): small img (explicit width/height, lazy, rounded)
- Name cell: bold 15–16px var(--text)
- Description cell: 14px var(--text-secondary), plain text (NOT markdown)
- Link cell (if present): small rose-tinted link text + external icon (rel=noopener target=_blank)

**RankingsHowTo.tsx** (gated, SEO long-form)
- Section with h2, body text, faq items
- Explains what rankings are, how to use

**RankingsFaq.tsx** (gated, SEO long-form)
- FAQPage JSON-LD generated from i18n keys
- Q&A list with `<details>` (native collapsible)

**RankingsStructuredData.tsx** (SSR outside mounted gate)
- SoftwareApplication JSON-LD
- FAQPage JSON-LD
- ItemList JSON-LD (each ranking's items as ListItem with position, name, description, url)
- All via platform seo.ts helpers (NEW: itemListJsonLd, faqPageJsonLd)

---

### C.3 Accessibility & Motion

- Roving tabindex on RankingsList/RankingCard
- Keyboard: "/" search focus, Arrow navigate, Enter/Space open, "f" favorite, Esc clear
- All buttons ≥44px
- Visible focus-visible ring var(--focus-ring)
- aria-live="polite" for toast/status
- aria-pressed on favorite star
- Motion: transform/opacity only, gated by prefers-reduced-motion
- Table: real semantic HTML, not div fakes
- ProvenanceBanner: aria-label groups both fields

---

## § D — SEED CONTENT

### D.1 Content Directory Structure

```
content/rankings/
├── _TEMPLATE.md
├── _TEMPLATE_en.md
├── README.md
└── items/
    ├── llm-agent-leaderboard.md
    ├── llm-agent-leaderboard_en.md
    ├── tiobe-programming-languages.md
    └── tiobe-programming-languages_en.md
```

### D.2 Seed Ranking A: LLM Agent Leaderboard

**File:** `content/rankings/items/llm-agent-leaderboard.md`

```yaml
---
title: LLM 에이전트 순위
slug: llm-agent-leaderboard
field: ai
asOfDate: "2026-06"
sourceNote: "Agent Arena 리더보드 기준 · 2026년 6월 29일"
sourceUrl: "https://arena.ai/leaderboard/agent"
items:
  - rank: 1
    name: Claude Fable 5 (High)
    description: "제공: Anthropic · 순개선도 13.34%"
    link: ""
  - rank: 2
    name: Claude Opus 4.8 (Thinking)
    description: "제공: Anthropic · 순개선도 9.37%"
  - rank: 3
    name: GPT 5.5 (xHigh)
    description: "제공: OpenAI · 순개선도 8.21%"
  - rank: 4
    name: Claude Opus 4.7
    description: "제공: Anthropic · 순개선도 8.16%"
  - rank: 5
    name: Claude Opus 4.7 (Thinking)
    description: "제공: Anthropic · 순개선도 8.07%"
  - rank: 6
    name: GPT 5.5 (High)
    description: "제공: OpenAI · 순개선도 7.13%"
  - rank: 7
    name: GLM 5.2 (Max)
    description: "제공: Zhipu AI · 순개선도 6.93%"
  - rank: 8
    name: GPT 5.4 (High)
    description: "제공: OpenAI · 순개선도 6.65%"
  - rank: 9
    name: Claude Opus 4.6
    description: "제공: Anthropic · 순개선도 6.47%"
  - rank: 10
    name: GPT 5.5
    description: "제공: OpenAI · 순개선도 6.22%"
---
```

**File:** `content/rankings/items/llm-agent-leaderboard_en.md`

```yaml
---
title: LLM Agent Leaderboard
field: ai
asOfDate: "2026-06"
sourceNote: "Based on the Agent Arena leaderboard · June 29, 2026"
sourceUrl: "https://arena.ai/leaderboard/agent"
items:
  - rank: 1
    name: Claude Fable 5 (High)
    description: "By Anthropic · net improvement 13.34%"
  - rank: 2
    name: Claude Opus 4.8 (Thinking)
    description: "By Anthropic · net improvement 9.37%"
  # ... (same structure, EN items)
---
```

### D.3 Seed Ranking B: TIOBE Programming Languages

**File:** `content/rankings/items/tiobe-programming-languages.md`

```yaml
---
title: 프로그래밍 언어 인기 순위
slug: tiobe-programming-languages
field: programming
asOfDate: "2026-06"
sourceNote: "TIOBE 인덱스 기준 · 2026년 6월"
sourceUrl: "https://www.tiobe.com/tiobe-index/"
items:
  - rank: 1
    name: Python
    description: "TIOBE 레이팅 18.96% (전년 대비 -6.91%p)"
  - rank: 2
    name: C
    description: "TIOBE 레이팅 10.77% (전년 대비 +1.30%p)"
  - rank: 3
    name: C++
    description: "TIOBE 레이팅 8.03% (전년 대비 -2.65%p)"
  - rank: 4
    name: Java
    description: "TIOBE 레이팅 7.90% (전년 대비 -0.94%p)"
  - rank: 5
    name: C#
    description: "TIOBE 레이팅 4.85% (전년 대비 +0.17%p)"
  - rank: 6
    name: JavaScript
    description: "TIOBE 레이팅 3.04% (전년 대비 -0.17%p)"
  - rank: 7
    name: Visual Basic
    description: "TIOBE 레이팅 2.80% (전년 대비 +0.59%p)"
  - rank: 8
    name: SQL
    description: "TIOBE 레이팅 1.77% (전년 대비 +0.23%p)"
  - rank: 9
    name: R
    description: "TIOBE 레이팅 1.69% (전년 대비 +0.30%p)"
  - rank: 10
    name: Delphi/Object Pascal
    description: "TIOBE 레이팅 1.54% (전년 대비 -0.60%p)"
  - rank: 11
    name: Scratch
    description: "TIOBE 레이팅 1.46% (전년 대비 +0.27%p)"
  - rank: 12
    name: Rust
    description: "TIOBE 레이팅 1.26% (전년 대비 +0.30%p)"
---
```

**File:** `content/rankings/items/tiobe-programming-languages_en.md`

```yaml
---
title: Programming Language Popularity
field: programming
asOfDate: "2026-06"
sourceNote: "Based on the TIOBE Index · June 2026"
sourceUrl: "https://www.tiobe.com/tiobe-index/"
items:
  - rank: 1
    name: Python
    description: "TIOBE rating 18.96% (18.96% YoY)"
  # ... (same structure, EN items)
---
```

### D.4 Template Files

**File:** `content/rankings/_TEMPLATE.md`

```yaml
---
# Required: English-friendly title for this ranking
title: [제목 또는 "Best X" 형식]

# Required: Stable slug for URL/references
slug: [optional, auto-derived from filename if omitted]

# Required: Category of this ranking (choose one)
field: ai | programming | tech | games | movies | music

# Required: As-of date (ISO: YYYY-MM or YYYY-MM-DD)
asOfDate: "2026-06"

# Required: Provenance note (≤200 chars)
# Format: "[Source name] · [date description]"
sourceNote: "[기준이 되는 리스트/조사 이름] · [날짜]"

# Optional: Clickable source URL (valid http(s) URL)
sourceUrl: "https://..."

# Required: ≥3 items, each with rank/name/description
items:
  - rank: 1
    name: "[항목 이름]"
    description: "[plain text, ≤200 chars]"
    link: "https://..." # optional, external link
    imageUrl: "https://..." # optional, requires imageWidth+imageHeight
    imageWidth: 100 # required if imageUrl
    imageHeight: 100 # required if imageUrl
  - rank: 2
    # ... more items
---

# Body (optional, currently unused)
# Markdown body content reserved for future use.
```

**File:** `content/rankings/README.md`

```markdown
# 별별 랭킹 콘텐츠 작성 가이드

## 새 순위 추가 방법

1. `_TEMPLATE.md` + `_TEMPLATE_en.md` 복사
2. `content/rankings/items/` 에 저장 (파일명은 slug와 동일, 예: `best-pizza.md`)
3. Frontmatter 작성:
   - title: 순위의 제목
   - field: 분류 (ai, programming, tech, games, movies, music 중 택 1)
   - asOfDate: 기준일 (ISO 날짜)
   - sourceNote: 출처 설명 (≤200자)
   - sourceUrl: 링크 (선택)
   - items: 3개 이상의 항목 (rank, name, description 필수)
4. `pnpm build` 실행 → 자동 검증 후 rankings.generated.json 생성

## 필수 규칙

- 한국어/영어 쌍 필수 (`.md` + `_en.md`)
- 필드(field)는 KO 파일에서 정의, EN은 일치해야 함
- 항목은 ≥3개, 순위(rank)는 1부터 N까지 연속
- 설명은 평문(마크다운 X), ≤200자
- 출처 URL은 유효한 http(s) URL
```

---

## § E — BUILD ORDER & DEPENDENCY GRAPH

### Inside-Out (Domain → Platform → UI → SEO → QA)

```
Phase 1: Domain TDD (parallel, 7 files, 80%+ coverage)
├─ schema.ts
├─ slug.ts
├─ merge.ts
├─ search.ts
├─ catalog.ts
├─ favorites.ts
└─ *test.ts files (RED → GREEN)
      ↓
Phase 2: Generator + Content (platform-engineer)
├─ scripts/generate-rankings.mjs
├─ package.json wiring (predev/prebuild)
├─ content/rankings/{_TEMPLATE, _TEMPLATE_en, README}
├─ content/rankings/items/{seed A+B ko/en}
└─ pnpm build → rankings.generated.json (validation pass/fail)
      ↓
Phase 3: I18N + Route (platform-engineer)
├─ src/i18n/messages/{ko,en}.json (tools.rankings.* full tree)
├─ src/tools/types.ts (add 'news' category)
├─ src/tools/registry.ts (add rankings entry)
├─ src/lib/tool-search.ts (CATEGORY_ORDER += 'news')
└─ src/app/[locale]/tools/[slug]/page.tsx (slug branch + generateMetadata)
      ↓
Phase 4: UI Layer (ui-engineer × 3 parallel)
├─ useRankingsCatalog.ts (hook)
├─ Rankings.tsx + RankingsIntro/HowTo/Faq (orchestrator + SSR)
├─ RankingSearch + FieldTabs + RankingsList/Card (interactive)
├─ RankingDetail + ProvenanceBanner + RankingTable/Row (detail + semantic table)
└─ Motion, a11y (keyboard, aria), reduced-motion gates
      ↓
Phase 5: SEO + JSON-LD (platform-engineer)
├─ lib/seo.ts → itemListJsonLd(ranking[]) + faqPageJsonLd(items)
├─ RankingsStructuredData.tsx (SoftwareApplication + FAQ + ItemList)
├─ public/llms.txt (add rankings entry)
└─ Canonical URLs via absoluteToolUrl(locale, 'rankings')
      ↓
Phase 6: Integration QA (platform-engineer + qa-engineer)
├─ Test Scenarios 1–5 (SPEC final_integration_test)
├─ Visual regression (320/768/1024 both themes, ProvenanceBanner emphasis check)
├─ E2E: search, filter, favorites, detail table, mobile sheet, keyboard
├─ Accessibility: axe, keyboard nav, aria-live, contrast (ProvenanceBanner must PASS WCAG AA)
├─ Locale swap (ko/en unique titles/canonical/hreflang)
├─ LiveTools check (registry status=live + route 200 both locales)
└─ Sitemaps/robots (auto via platform)
      ↓
Phase 7: Verification Gates (leader/reader)
├─ ProvenanceBanner visual verification (rose-soft, high contrast, above table)
├─ Table scrolls at 320px without overflow
├─ Seed rankings render (LLM Agent + TIOBE)
├─ Source links open correctly (sourceUrl clickable if present)
├─ JSON-LD valid (via schema.org validator, canonical matches)
├─ All i18n keys present (tools.rankings.* complete)
└─ Deployment readiness (CF Pages static export, no errors)
```

---

## § F — KEY DIVERGENCES FROM NEW-WORD

| Aspect | new-word | rankings |
|--------|----------|----------|
| **Content** | Terms (single unit: term + def + examples) | Rankings (group unit: title + items array) |
| **Frontmatter** | term, definition, examples, topic, tone, related | title, field, asOfDate, sourceNote, sourceUrl, items |
| **Canonical rule** | topic, tone, tags, related from KO | field, asOfDate, sourceNote, sourceUrl from KO |
| **Render** | Card detail = markdown-rendered body | Card detail = semantic HTML table (no markdown) |
| **Trust surface** | None (terms are factual) | **ProvenanceBanner (emphasized, CRITICAL)** |
| **Grouping** | Topic (mz/tech) | Field (ai/programming/tech/games/movies/music) |
| **Recents trigger** | Detail open (select) | Detail open (select) |
| **Favorites** | Star toggle on detail | Star toggle on card |
| **Table** | None (detail is card layout) | **Full semantic `<table>` with medals, links, images** |
| **SEO JSON-LD** | DefinedTermSet + related | **ItemList (position, name, description, url each item)** |

---

## § G — FIELD ENUM & CONSTANTS

```typescript
// src/lib/rankings/schema.ts or catalog.ts
export const FIELD_ENUM = ['ai', 'programming', 'tech', 'games', 'movies', 'music'] as const;
export const FIELD_ORDER = ['all', ...FIELD_ENUM, 'favorites', 'recent'] as const;

export const RECENTS_MAX = 20;
export const SEARCH_DEBOUNCE = 120; // ms
export const MEDAL_EMOJI = ['🥇', '🥈', '🥉'] as const;

export const STORAGE_KEY = 'jurepi-rankings';
export const STORE_VERSION = 1;
```

---

## § H — SPEC DEVIATIONS & EXTENSIONS

1. **ADD sourceUrl (optional):** SPEC defined sourceNote as required; we add optional sourceUrl that, when present, renders sourceNote as a clickable link in ProvenanceBanner. This extension does NOT break schema validation (zod .optional()).

2. **ProvenanceBanner emphasis:** SPEC says "prominent, high-contrast provenance banner"; we explicitly spec rose-soft surface + rose border + var(--text)/600 values + aria-label grouping to ensure it's never muted.

3. **Descriptions are plain text:** SPEC says "plain text", but does NOT forbid the Markdown renderer like new-word does. We explicitly forbid Markdown for descriptions and render as text nodes only (no HTML risk).

4. **Semantic table mandatory:** SPEC says "`<table>`"; we mandate `<thead>`, `<tbody>`, `<caption>`, `scope="col"` on headers, and `role="region"` on scroll wrapper (not div-grid fakes).

5. **Canonical merge rule:** SPEC does NOT explicitly state sourceUrl is canonical KO. We specify: sourceUrl (like sourceNote, asOfDate, field) is canonical from KO, EN inherits/must match.

---

## SUCCESS CRITERIA MAPPED TO BLUEPRINT

| Criterion (from SPEC) | Blueprint § | Checkmark |
|----------------------|-----------|----------|
| Drop markdown pair → auto-rebuild | B.2 Generator | ✓ |
| Generator validates + fails build | B.2 Generator | ✓ |
| Searchable card list both locales | C.1–C.2 (search+filter) | ✓ |
| Detail renders items as semantic table | C.2 (RankingTable) | ✓ |
| Medals 🥇🥈🥉 for top 3 | C.2 (RankingRow) | ✓ |
| localStorage favorites + recents | A.6 + C.1 (hook) | ✓ |
| **Emphasized provenance banner** | C.2 (ProvenanceBanner CRITICAL) | ✓ |
| sourceNote + asOfDate required | A.1 (schema) | ✓ |
| sourceUrl optional + clickable | A.1 (schema EXTENSION) | ✓ |
| Seed 2 rankings (AI + programming) | D.2–D.3 | ✓ |
| Field tabs (ai/programming/tech/games/movies/music) | C.2 (FieldTabs), A.5 (fields()) | ✓ |
| Keyboard + aria + reduced-motion | C.3 + C.2 | ✓ |
| JSON-LD ItemList (GEO/AI citation) | C.2 (StructuredData) + B.3 (seo.ts NEW) | ✓ |
| Code-split catalog (no bundle bloat) | B.2 (rankings.generated.json) | ✓ |
| <800 lines per file | A.1–A.6 + C.1–C.2 | ✓ |
| Domain 80%+ coverage (vitest) | A.7 (RED tests) | ✓ |
| TS 0 errors | Architecture enforced | ✓ |
| E2E 5 scenarios (SPEC) | E, Phase 6 | ✓ |
| 'news' category wired | B.1 | ✓ |
| Registry entry (Trophy, rose accent) | B.1 | ✓ |
| i18n complete (tools.rankings.*) | B.4 | ✓ |
| No overflow at 320px | C.2 (RankingTable responsive) | ✓ |
| WCAG 2.1 AA (ProvenanceBanner contrast ≥4.5:1) | C.3 + C.2 (ProvenanceBanner) | ✓ |

---

## BLUEPRINT HANDOFF SUMMARY

| Role | Starts with | Outputs | Blockers |
|------|-------------|---------|----------|
| **domain-engineer** | § A (schema + contracts) | lib/rankings/* + *.test.ts (RED→GREEN) | None (pure TS) |
| **platform-engineer** | § A (done) + § B | generator script + i18n + registry + route | Needs domain green |
| **ui-engineer** | § B (i18n done) + § C | components/* + useRankingsCatalog | Needs platform i18n/route |
| **qa-engineer** | §§ A–C (all green) | E2E scenarios 1–5 + axe + visual regression | Needs all UI green |
| **leader** | Full blueprint | Verify ProvenanceBanner + seed + JSON-LD | Dependency complete |

---

**Approved fields:** `ai`, `programming`, `tech`, `games`, `movies`, `music`  
**Added category:** `news` (8th, rose accent)  
**Key extension:** Optional `sourceUrl` with clickable rendering in ProvenanceBanner  
**No SPEC conflicts:** All changes additive or clarifying.
