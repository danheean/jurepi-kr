# Developer People Dictionary — Clean Architecture Blueprint

**Author Role:** Architect  
**Date:** 2026-07-04  
**Status:** READY FOR IMPLEMENTATION  
**Pattern Reference:** `bookmarks` + `new-word` tools (structural mirror; content pipeline + hub/spoke)

---

## 1. Layer Decomposition

### Dependency Flow
```
┌─────────────────────────────────────────────┐
│  FRAMEWORK                                  │
│  (Next.js App Router, tool route branch)    │
│  src/app/[locale]/tools/dev-people/*        │
└─────────┬───────────────────────────────────┘
          │ (orchestrates)
┌─────────▼───────────────────────────────────┐
│  ADAPTERS / UI LAYER                        │
│  src/components/tools/dev-people/           │
│  (React components, next-intl, localStorage)│
└─────────┬───────────────────────────────────┘
          │ (consumes)
┌─────────▼───────────────────────────────────┐
│  USE-CASE / HOOK LAYER                      │
│  src/components/tools/dev-people/           │
│  useDevPeopleCatalog.ts (state machine)     │
└─────────┬───────────────────────────────────┘
          │ (calls)
┌─────────▼───────────────────────────────────┐
│  DOMAIN LAYER (PURE, NO REACT/NEXT)         │
│  src/lib/dev-people/                        │
│  (schema, merge, slug, catalog, search,     │
│   favorites — all immutable, fully tested)  │
└─────────────────────────────────────────────┘
```

### File Structure (Exact Path Mapping)

#### Domain Layer — Pure TypeScript (no React, no Next.js)
```
src/lib/dev-people/
├── schema.ts              # zod schemas: PersonFileFront(ko/en), MergedPerson, DevPeopleStore constants
├── schema.test.ts         # Frontmatter validation: required fields, birth/death sanity
├── slug.ts                # slugify(name), resolveSlug(front, filename)
├── slug.test.ts           # Slug derivation, uniqueness, ASCII safety
├── merge.ts               # mergePair(koFront, enFront): canonical ko metadata, en inherit
├── merge.test.ts          # Pair integrity, locale completeness, metadata matching
├── catalog.ts             # Typed read-only accessor: allPeople(), byId(slug), byTag(tag), byEra(era)
├── catalog.test.ts        # Uniqueness, completeness (ko+en), referential integrity
├── search.ts              # filterPeople(people, query, locale): name+aliases+knownFor+tags
├── search.test.ts         # Case/diacritic insensitivity, both locales, stable sort
├── favorites.ts           # Immutable ops: toggleFavorite, pushRecent, pruneUnknown
├── favorites.test.ts      # MRU order, dedup, maxing, unknown slug removal
├── birthdate.ts           # calculateAge(birthYear?, deathYear?) → "만 N세" | "향년 N세" | undefined
└── birthdate.test.ts      # Age display correctness: alive, deceased, missing year cases
```

#### Generator Layer (Build-time, Node.js script)
```
scripts/
└── generate-dev-people.mjs     # Scan content/dev-people/people/* → parse → validate pairs → 
                               # emit src/components/tools/dev-people/data/dev-people.generated.json
                               # Exit non-zero on first violation (pair-missing, tag-invalid, etc)
```

#### Hook Layer — State Machine (UI orchestration, no component render)
```
src/components/tools/dev-people/
├── useDevPeopleCatalog.ts    # SINGLE hook: dynamic catalog import, favorites/recents localStorage,
                              # exposes filtered list, select(slug), toggleFavorite
├── (no .test.ts directly — tested via component integration + E2E)
```

#### UI Components Layer (React, Client Components)
```
src/components/tools/dev-people/
├── DevPeople.tsx             # "use client"; owns tag + era + query + selectedSlug state; mounts useDevPeopleCatalog()
├── PeopleSearch.tsx          # Search input: "/" focus, clear, aria-controls, result count
├── TagTabs.tsx               # Pill tabs: All / Tags / Favorites (when pinned) / Recent (when viewed)
├── EraTabs.tsx               # 1940–1960 / 1960–1980 / 1980–2000 / 2000–present (tablist)
├── PeopleList.tsx            # Responsive card grid (1-col <768, 2-col 768–1023, 3-col ≥1024); roving tabindex
├── PersonCard.tsx            # One card: name, knownFor, tag+era badges, photo/avatar, star, link to spoke
├── DevPeopleIntro.tsx        # H1 + lead (SEO; server-render where possible)
├── DevPeopleHowTo.tsx        # "Who shaped software?" / long-form SEO section
├── DevPeopleFaq.tsx          # FAQPage + ItemList JSON-LD (server-render prerender)
├── Disclaimer.tsx            # Disclaimer footer (reusable for hub + spoke)
├── data/
│   └── dev-people.generated.json  # GENERATED ARTIFACT: [MergedPerson...] (code-split dynamic import)
└── index.ts                  # Barrel: export { DevPeople }
```

#### Content Layer (Markdown source)
```
content/dev-people/
├── _TEMPLATE.md
├── _TEMPLATE_en.md
├── README.md                 # Authoring guide: markdown format, required fields, photo guidelines
└── people/
    └── *.md + *_en.md        # Person pairs: grace-hopper.md/.md_en, andrej-karpathy.md/.md_en, etc. (13 seed pairs)
```

#### Spoke Page Route (Server Component)
```
src/app/[locale]/tools/dev-people/
├── page.tsx                           # Hub route (wraps DevPeople SPA)
└── [person]/
    └── page.tsx                       # Spoke route
                                       # - exports generateStaticParams() → { person: slug, locale }[] (26 params)
                                       # - exports generateMetadata(props) → Person JSON-LD, canonical, hreflang
                                       # - renders <PersonSpoke> server component
                                       # - biography SSR'd outside mounted gate
```

#### Platform Integration (Existing files, ONE entry + branches added)
```
src/tools/
├── registry.ts               # ADD ONE ToolMeta entry (dev-people, id dev-people, category dev, accent sky, status live)

src/app/[locale]/tools/
└── [slug]/page.tsx           # ADD slug→component branch (DevPeople) + generateMetadata branch (hub + spoke)

src/i18n/messages/
├── ko.json                   # ADD nested tools.dev-people.* keys
└── en.json                   # ADD nested tools.dev-people.* keys (English translations)

app/sitemap.ts               # UPDATE: import dev-people.generated.json, append 26 spoke URLs (hub + people)
```

---

## 2. Public API Contract — Domain Layer

### `schema.ts`

```typescript
/**
 * Constants
 */
export const STORE_VERSION = 1;
export const RECENTS_MAX = 20;
export const SEARCH_DEBOUNCE = 120;
export const BIRTH_YEAR_MIN = 1800;
export const BIO_MIN_LENGTH = 50;

/**
 * Individual markdown file frontmatter (parser unit).
 * Each person file (ko + en pair) carries these YAML fields.
 */
export const PersonFileFromSchema = z.object({
  // REQUIRED: name (per locale, non-empty, display name)
  name: z.string().min(1, 'name required'),

  // REQUIRED: knownFor (achievment summary, ≥50 chars)
  knownFor: z.string().min(BIO_MIN_LENGTH, `knownFor must be ≥ ${BIO_MIN_LENGTH} chars`),

  // REQUIRED (Korean) / OPTIONAL (English): tags from controlled vocabulary
  tags: z.array(z.string()).optional(),

  // REQUIRED (Korean) / OPTIONAL (English): era grouping
  era: z.enum(['1940-1960', '1960-1980', '1980-2000', '2000-present']).optional(),

  // REQUIRED (Korean) / OPTIONAL (English): country/nationality
  nationality: z.string().optional(),

  // OPTIONAL: birth year (if present, ≥ 1800, ≤ current year)
  birthYear: z.number().min(BIRTH_YEAR_MIN).max(new Date().getFullYear()).optional(),

  // OPTIONAL: death year (if present, > birthYear, ≤ current year)
  deathYear: z.number().optional(),

  // OPTIONAL (Korean canonical): slug derivable from name
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),

  // OPTIONAL (Korean canonical): local photo filename in public/images/dev-people/
  photo: z.string().optional(),

  // REQUIRED if photo present: attribution/license text
  photoCredit: z.string().optional(),

  // OPTIONAL (Korean canonical): timeline of achievements
  achievements: z.array(z.object({
    year: z.number().int(),
    title: z.string(),
  })).optional(),

  // OPTIONAL (Korean canonical): published works
  books: z.array(z.object({
    title: z.string(),
    year: z.number().int().optional(),
    url: z.string().url().optional(),
  })).optional(),

  // OPTIONAL: search aliases
  aliases: z.array(z.string()).optional(),

  // OPTIONAL (Korean canonical): related person slugs
  related: z.array(z.string()).optional(),

  // OPTIONAL (Korean canonical): external links
  links: z.array(z.object({
    label: z.string(),
    url: z.string().url(),
  })).optional(),
});
export type PersonFileFront = z.infer<typeof PersonFileFromSchema>;

/**
 * Merged person record (ko + en merged, catalog item)
 */
export const MergedPersonSchema = z.object({
  slug: z.string(), // Unique identifier (referenced in favorites, recents, related, spoke URL)
  tags: z.array(z.string()), // Korean canonical (controlled vocab)
  era: z.enum(['1940-1960', '1960-1980', '1980-2000', '2000-present']),
  nationality: z.string(),
  achievements: z.array(z.object({ year: z.number(), title: z.object({
    ko: z.string(),
    en: z.string(),
  }) })).optional(),
  books: z.array(z.object({
    title: z.object({ ko: z.string(), en: z.string() }),
    year: z.number().optional(),
    url: z.string().url().optional(),
  })).optional(),
  related: z.array(z.string()), // Validated to exist in catalog
  links: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
  photo: z.string().optional(), // Local filename; validated to exist
  photoCredit: z.string().optional(), // Required if photo present
  ko: z.object({
    name: z.string(),
    knownFor: z.string(),
    aliases: z.array(z.string()).optional(),
    biography_body: z.string(), // Markdown from file body
  }),
  en: z.object({
    name: z.string(),
    knownFor: z.string(),
    aliases: z.array(z.string()).optional(),
    biography_body: z.string(),
  }),
  birthYear: z.number().optional(),
  deathYear: z.number().optional(),
});
export type MergedPerson = z.infer<typeof MergedPersonSchema>;

/**
 * localStorage store for dev-people hub
 */
export const DevPeopleStoreSchema = z.object({
  version: z.literal(STORE_VERSION),
  favorites: z.array(z.string()), // Person slugs, insertion order
  recents: z.array(z.string()),   // Person slugs, most-recent-first, max RECENTS_MAX
  meta: z.object({
    lastQuery: z.string().optional(),
    lastTag: z.string().optional(),
    lastEra: z.string().optional(),
    createdAt: z.number(),
  }),
});
export type DevPeopleStore = z.infer<typeof DevPeopleStoreSchema>;

/**
 * Controlled vocabulary
 */
export const TAG_VOCABULARY = [
  'java', 'python', 'javascript', 'c', 'cpp', 'linux', 'git',
  'ai', 'deep-learning', 'clean-code', 'architecture', 'tdd', 'agile',
  'refactoring', 'design-patterns', 'free-software', 'web', 'game', 'education', 'youtube',
] as const;
export type Tag = typeof TAG_VOCABULARY[number];
```

### `merge.ts`

```typescript
/**
 * Merge ko + en person files into canonical MergedPerson record.
 * Ko metadata is canonical (tags, era, nationality, achievements, books, related, links, photo).
 * En inherits if absent, must match if present.
 * Name, knownFor, biography_body are per-locale.
 */
export function mergePair(
  koFront: PersonFileFront,
  enFront: PersonFileFront,
  filename: string, // e.g., "grace-hopper"
): MergedPerson {
  // Resolve slug from ko file, fall back to filename
  const slug = koFront.slug || filename;
  
  // Validate ke metadata is present (canonical source)
  if (!koFront.tags?.length) throw new Error(`${filename}: ko.tags required`);
  if (!koFront.era) throw new Error(`${filename}: ko.era required`);
  if (!koFront.nationality) throw new Error(`${filename}: ko.nationality required`);
  
  // Validate en inherit or match
  if (enFront.tags && !arraysEqual(enFront.tags, koFront.tags)) {
    throw new Error(`${filename}: en.tags must match ko.tags or be omitted`);
  }
  if (enFront.era && enFront.era !== koFront.era) {
    throw new Error(`${filename}: en.era must match ko.era or be omitted`);
  }
  // ... (similar for nationality, achievements count+years, books count+years)
  
  return {
    slug,
    tags: koFront.tags,
    era: koFront.era,
    nationality: koFront.nationality,
    achievements: /* validated count+years match ko↔en */,
    books: /* validated count+years match ko↔en */,
    related: koFront.related || [],
    links: koFront.links || [],
    photo: koFront.photo,
    photoCredit: koFront.photoCredit,
    ko: { name: koFront.name, knownFor: koFront.knownFor, ... },
    en: { name: enFront.name, knownFor: enFront.knownFor, ... },
    birthYear: koFront.birthYear || enFront.birthYear,
    deathYear: koFront.deathYear || enFront.deathYear,
  };
}

/**
 * Collect validation errors (warnings/failures) during parse
 */
export function validatePair(ko: PersonFileFront, en: PersonFileFront, filename: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!ko.name) errors.push({ file: filename, field: 'ko.name', reason: 'required' });
  if (!en.name) errors.push({ file: filename, field: 'en.name', reason: 'required' });
  if (!ko.knownFor || ko.knownFor.length < BIO_MIN_LENGTH) 
    errors.push({ file: filename, field: 'ko.knownFor', reason: `required, ≥${BIO_MIN_LENGTH} chars` });
  // ... (validate tags vocab, year sanity, etc)
  
  return errors;
}
```

### `catalog.ts`

```typescript
/**
 * Typed, immutable catalog accessors (no init state machine).
 * Catalog is static: loaded from dev-people.generated.json at runtime.
 */
export function allPeople(catalog: MergedPerson[]): MergedPerson[] {
  return catalog; // Returns in generation order (era → tag → birthYear)
}

export function byId(catalog: MergedPerson[], slug: string): MergedPerson | undefined {
  return catalog.find(p => p.slug === slug);
}

export function byTag(catalog: MergedPerson[], tag: Tag): MergedPerson[] {
  return catalog.filter(p => p.tags.includes(tag));
}

export function byEra(
  catalog: MergedPerson[],
  era: '1940-1960' | '1960-1980' | '1980-2000' | '2000-present',
): MergedPerson[] {
  return catalog.filter(p => p.era === era);
}

export function peoples(catalog: MergedPerson[]): string[] {
  return catalog.map(p => p.slug);
}
```

### `search.ts`

```typescript
/**
 * Filter people by query + optional tag/era filters.
 * Searches name, aliases, knownFor (both locales), tags across both locales.
 * Case/diacritic insensitive. Returns stable order.
 */
export function filterPeople(
  people: MergedPerson[],
  query: string = '',
  tag?: Tag,
  era?: Era,
  locale?: Locale, // Preferred locale for relevance
): MergedPerson[] {
  let result = people;
  
  // Tag filter
  if (tag) result = result.filter(p => p.tags.includes(tag));
  
  // Era filter
  if (era) result = result.filter(p => p.era === era);
  
  // Query filter (both locales)
  if (query.trim()) {
    const normalized = normalizeQuery(query); // NFC, lowercase, remove diacritics
    result = result.filter(person => {
      const ko = person.ko;
      const en = person.en;
      const namesAll = [ko.name, en.name, ...(ko.aliases || []), ...(en.aliases || [])];
      const textsAll = [ko.knownFor, en.knownFor];
      const tagsStr = person.tags.join(' ');
      const searchSpace = [...namesAll, ...textsAll, tagsStr].map(normalizeQuery);
      return searchSpace.some(s => s.includes(normalized));
    });
  }
  
  return result; // Stable order: generation order preserved
}
```

### `favorites.ts`

```typescript
/**
 * Immutable favorites/recents operations
 */
export function toggleFavorite(list: string[], slug: string): string[] {
  const idx = list.indexOf(slug);
  if (idx === -1) return [...list, slug]; // Add
  return list.slice(0, idx).concat(list.slice(idx + 1)); // Remove
}

export function pushRecent(list: string[], slug: string, max: number = RECENTS_MAX): string[] {
  const idx = list.indexOf(slug);
  const filtered = idx === -1 ? list : list.slice(0, idx).concat(list.slice(idx + 1));
  return [slug, ...filtered].slice(0, max);
}

export function pruneUnknown(slugs: string[], catalog: MergedPerson[]): string[] {
  const valid = new Set(peoples(catalog));
  return slugs.filter(s => valid.has(s));
}
```

### `birthdate.ts`

```typescript
/**
 * Calculate age or year-of-death display from birthYear/deathYear
 */
export function calculateAge(
  birthYear?: number,
  deathYear?: number,
  currentYear: number = new Date().getFullYear(),
): { type: 'age' | 'ageAtDeath'; value: number } | undefined {
  if (!birthYear) return undefined;
  if (deathYear) return { type: 'ageAtDeath', value: deathYear - birthYear };
  return { type: 'age', value: currentYear - birthYear };
}

/**
 * Format age display for UI (i18n handles "만" vs "age")
 */
export function formatAgeDisplay(
  ageInfo: ReturnType<typeof calculateAge>,
  locale: 'ko' | 'en',
): string | undefined {
  if (!ageInfo) return undefined;
  if (locale === 'ko') {
    return ageInfo.type === 'age' ? `만 ${ageInfo.value}세` : `향년 ${ageInfo.value}세`;
  }
  return ageInfo.type === 'age' ? `age ${ageInfo.value}` : `age ${ageInfo.value} at death`;
}
```

---

## 3. Hook Layer Contract — `useDevPeopleCatalog.ts`

```typescript
/**
 * Single hook: owns catalog import, localStorage persistence, state derivation
 */
export function useDevPeopleCatalog() {
  return {
    catalog: MergedPerson[], // Full catalog, immutable
    allPeopleFiltered: MergedPerson[], // Computed: filtered by query+tag+era
    favorites: string[], // Current favorites slugs
    recents: string[], // Current recents slugs
    query: string,
    selectedTag: Tag | undefined,
    selectedEra: Era | undefined,
    
    // Handlers
    setQuery: (q: string) => void,
    setTag: (t: Tag | undefined) => void,
    setEra: (e: Era | undefined) => void,
    toggleFavorite: (slug: string) => void,
    pushRecent: (slug: string) => void,
    
    // Computed
    resultCount: number,
    selectedPerson: MergedPerson | undefined, // If clicked
  };
}
```

---

## 4. i18n Key Contract — Full Tree

The hub and spoke both consume UI strings from `tools.dev-people.*` (ko/en):

```typescript
{
  "tools": {
    "dev-people": {
      // Hub & spoke common
      "title": "개발 인물 사전",  // searchable-tools, footer, home card
      "description": "소프트웨어 역사의 주요 인물들 이야기",  // SEO meta, searchable-tools
      
      // Hub UI
      "search": {
        "label": "인물 이름·태그·기간으로 검색…",
        "aria": "인물 검색",
        "resultCount": "{count, plural, one {결과 # 명} other {결과 # 명}}",
      },
      "tabs": {
        "all": "전체",
        "favorites": "즐겨찾기",
        "recent": "최근",
      },
      "tags": {
        // 20 controlled vocab tags
        "java": "Java",
        "python": "Python",
        "javascript": "JavaScript",
        "c": "C",
        "cpp": "C++",
        "linux": "Linux",
        "git": "Git",
        "ai": "AI",
        "deep-learning": "Deep Learning",
        "clean-code": "Clean Code",
        "architecture": "Architecture",
        "tdd": "TDD",
        "agile": "Agile",
        "refactoring": "Refactoring",
        "design-patterns": "Design Patterns",
        "free-software": "Free Software",
        "web": "Web",
        "game": "Game Dev",
        "education": "Education",
        "youtube": "YouTube",
      },
      "eras": {
        "1940-1960": "1940–1960",
        "1960-1980": "1960–1980",
        "1980-2000": "1980–2000",
        "2000-present": "2000–현재",
      },
      "empty": {
        "noResults": "'{query}'에 해당하는 인물이 없어요",
        "noFavorites": "별을 눌러 자주 보는 인물을 저장하세요",
        "noRecent": "최근 본 인물이 여기에 모여요",
      },
      "card": {
        "toggleFavorite": "즐겨찾기 토글",
        "ageDisplay": "만 {age}세",  // ICU age formatting
        "ageAtDeath": "향년 {age}세",
      },
      
      // Spoke page
      "spoke": {
        "about": "소개",
        "anecdotes": "일화",
        "achievements": "업적",
        "books": "저서",
        "related": "관련 인물",
        "links": "관련 링크",
        "disclaimer": "이 정보는 편집자가 정리한 것으로 부정확할 수 있습니다. 정확한 정보는 원문 링크를 확인해 주세요.",
      },
      
      // SEO sections
      "intro": {
        "eyebrow": "개발 도구",
        "headline": "개발 인물 사전",
        "lead": "소프트웨어를 만든 위대한 인물들의 이야기를 찾아보세요.",
      },
      "howTo": {
        "title": "누가 소프트웨어 역사를 형성했는가?",
        "body": "...", // Long-form content
      },
      "faq": {
        "items": [
          { "question": "개발 인물 사전이란?", "answer": "..." },
          // ... 3–5 QA items
        ],
      },
    },
  },
}
```

---

## 5. Build Order & Task Decomposition

### Phase 1: Domain + Generator
**Owner:** domain-engineer  
**Duration:** ~2 days  
**Output:** Pure lib/dev-people/** + scripts/generate-dev-people.mjs, 100% tested

1. **schema.ts** — PersonFileFront, MergedPerson, DevPeopleStore zod schemas
2. **merge.ts** — mergePair, validatePair (ko canonical rule)
3. **slug.ts** — slugify, resolveSlug
4. **catalog.ts** — allPeople, byId, byTag, byEra, peoples
5. **search.ts** — filterPeople (case/diacritic insensitive, both locales)
6. **favorites.ts** — toggleFavorite, pushRecent, pruneUnknown (immutable)
7. **birthdate.ts** — calculateAge, formatAgeDisplay
8. **scripts/generate-dev-people.mjs** — Full generator with gray-matter + zod validation

**Tests:** 100% line coverage minimum, RED→GREEN per function, pair-missing/tag-invalid/year-sanity fixtures

---

### Phase 2: Content Pipeline + Platform Registry
**Owners:** content-writer, platform-engineer  
**Parallel with Phase 1**

**content-writer:**
- 13 seed person markdown pairs (ko + en, 2–4 paragraph bios, achievements, books, links)
- _TEMPLATE.md / _TEMPLATE_en.md + README.md authoring guide

**platform-engineer:**
- registry.ts: ONE ToolMeta entry (dev-people, sky accent, dev category, order 19)
- [slug]/page.tsx: slug→component branches (hub: DevPeople, spoke: server component stub)
- generateMetadata branches (hub title/desc, spoke Person JSON-LD + hreflang)
- i18n ko.json / en.json: FULL tools.dev-people.* tree (search, tags, eras, empty, card, spoke, intro, howTo, faq keys — 100+ keys total with examples)
- sitemap integration: app/sitemap.ts appends 26 spoke URLs (ko + en)

---

### Phase 3: Hub UI + Spoke Components
**Owner:** ui-engineer (×2 parallel)  
**Duration:** ~2 days  
**Blockers:** Phase 1 domain contracts + Phase 2 platform routes + registry i18n

1. **useDevPeopleCatalog.ts** — Hook: dynamic import, localStorage (favorites/recents), zod parse, pruneUnknown on load
2. **DevPeople.tsx** — Client, owns state (query, tag, era, selectedSlug); mounts useDevPeopleCatalog
3. **PeopleSearch.tsx** — Input with "/" focus, debounce SEARCH_DEBOUNCE=120ms, clear, result count aria
4. **TagTabs.tsx** — Pill row: All + controlled vocab tags + Favorites (cond) + Recent (cond); ArrowLeft/Right nav
5. **EraTabs.tsx** — Secondary row: All + 4 era buckets; composes with TagTabs
6. **PeopleList.tsx** — Responsive grid (1/2/3-col), roving tabindex, Home/End navigation, Enter opens spoke
7. **PersonCard.tsx** — Name (headline), knownFor (2-line clamp), tag/era badges, photo/avatar, star, `<a href={spokeUrl}>`
8. **DevPeopleIntro.tsx, DevPeopleHowTo.tsx, DevPeopleFaq.tsx** — SSR-safe sections (Intro/HowTo outside mounted gate)
9. **Disclaimer.tsx** — Reusable footer (hub + spoke)
10. **[person]/page.tsx spoke component** — Server component: PersonHeader (name, birth/death, age display, photo), PersonBiography (SSR outside gate), PersonAchievements, RelatedPeopleSection, ShareButtons (auto-included), Disclaimer

**Tests:**
- Hub roving tabindex keyboard nav (Arrow, Enter, Esc, "/", "f")
- Spoke generateStaticParams returns 26 params (13×2)
- Person JSON-LD present in rendered HTML + BreadcrumbList
- Accessibility: axe-core pass, ARIA labels, focus visible
- Visual: Playwright E2E for hub filter/search + spoke content visibility

---

### Phase 4: Integration QA + SEO/GEO Validation
**Owner:** qa-integration, seo-geo-engineer  
**Duration:** ~1 day

**qa-integration:**
- Full test suite (vitest + Playwright)
- Build green (pnpm build → /out/[locale]/tools/dev-people/** SSG)
- E2E scenarios: folder→hub→spoke, hub search/tag/era filters, spoke breadcrumb back to hub
- `out/sitemap.xml`: 27 dev-people URLs (1 hub + 26 spokes), xmllint valid

**seo-geo-engineer:**
- Prere nder HTML: all Intro/HowTo/FAQ visible in `out/` (no mounted gate hiding)
- Person JSON-LD: 13 spokes, each has schema.org Person (name, description, birthDate, deathDate, nationality, jobTitle, knowsAbout, sameAs)
- BreadcrumbList: Home > Tools > Dev-People > Person Name
- Canonical + hreflang (ko↔en alternates)
- llms.txt: dev-people slug listed

---

## 6. Integration Points with Platform

- **registry.ts**: Add ONE entry + slug→component + generateMetadata branches
- **[slug]/page.tsx**: Spoke route (`[person]`) for dynamic routing
- **sitemap.ts**: Import + iterate 26 spoke URLs
- **i18n/messages/{ko,en}.json**: Full tools.dev-people namespace
- **lib/seo.ts**: Reuse `buildToolEntityMetadata`, add `personJsonLd(person, locale)`, `breadcrumbListJsonLd()`
- **<ShareButtons>**: Auto-included in spoke route template; no config needed

---

## 7. Key Decisions & Constraints

1. **No Backend / No DB**: All 13 people + metadata live as markdown + generated JSON. Catalog is static at runtime.
2. **Hub = Pure SPA**: No route navigation within hub. All state = React useState + localStorage (favorites/recents).
3. **Spokes = SSG**: Per-person static pages for SEO. Biography SSR'd outside mounted gate so crawlers see full text.
4. **Ko Canonical**: All structural metadata (tags, era, nationality, achievements, books, related, links, photo) is defined in Korean file. English inherits or must match.
5. **Immutability Enforced**: All domain functions return new arrays/objects, never mutate input.
6. **Validation = Build Failure**: Any pair-missing, dupe-slug, dangling-related, year-sanity, tag-vocab, count-mismatch, photo-missing → generator exits non-zero. No warnings-and-exclude.
7. **Favorites/Recents = localStorage**: No network persistence. MRU order, maxing RECENTS_MAX=20, auto-prune unknown slugs on load.
8. **i18n = Full Contract**: All UI strings from i18n namespace. No hardcoded labels. Age display uses ICU ("만 N세" / "향년 N세" / "age N").

---

## 8. Success Metrics

- **Domain**: 100% test coverage (lib/dev-people/*), all schema validations Red→Green, pair/slug/tag/year/photo fixtures passing
- **Generator**: Exits 0 on valid content, exits 1 on first violation with clear file+field+reason message
- **Hub**: All filters (tag/era/query) working, keyboard nav (/"/"/ arrows/Enter/Esc/"f") responsive, favorites/recents persist
- **Spokes**: 26 pages SSG'd, each with Person JSON-LD + BreadcrumbList + canonical/hreflang, biography visible in HTML (not behind mounted gate)
- **E2E**: Playwright scenarios 1–5 pass (folder→hub→spoke, filter/search, spoke details, sitemap 27 URLs)
- **Accessibility**: axe-core clean, WCAG 2.1 AA, ≥44px targets, visible focus, ARIA labels

---

## 9. Appendix: seo.ts Helper Signatures (Existing Library)

```typescript
// Already exist in src/lib/seo.ts; reuse for hub + spokes
export function buildToolEntityMetadata({
  locale: string,
  tool: string, // e.g., 'dev-people'
  entity: MergedPerson,
  title: string,
  description: string,
}): Metadata

export function breadcrumbListJsonLd(
  items: Array<{ name: string; url?: string }>,
): StructuredData

// NEW for dev-people:
export function personJsonLd(
  person: MergedPerson,
  locale: 'ko' | 'en',
): Person // schema.org Person
```
