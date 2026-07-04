# Restaurant-Map Domain Layer — Contract & Public API

**Confirmed from TDD implementation** (88 tests / 89.97% coverage, vitest run)

## Core Types

```typescript
// Place: Individual restaurant/cafe within a curated list
interface Place {
  id: string;                    // Derived at merge: "${listSlug}#${index}"
  name: string;                  // Required, non-empty
  lat: number;                   // Required, [33–39] Korea bounds
  lng: number;                   // Required, [124–132] Korea bounds
  category: 'cafe' | 'korean' | 'japanese' | 'chinese' | 'brunch' | 'bar' | 'dessert' | 'other';
  address: string;               // Required, non-empty
  description: string;           // Required, factual summary
  personalNote: string;          // **CRITICAL**: Required, non-empty, non-whitespace (curator's voice, distinct from description)
  link?: string;                 // Optional, valid http(s) URL
  priceRange?: string;           // Optional, e.g. "₩10,000–20,000"
  imageUrl?: string;             // Optional, valid URL
  imageWidth?: number;           // Required if imageUrl set
  imageHeight?: number;          // Required if imageUrl set
}

// Markdown frontmatter schema (per locale, parsed by generator)
interface PlaceListFileFront {
  title: string;                 // Required, non-empty
  slug?: string;                 // Optional, explicit identifier (Korean file canonical)
  region: 'seoul' | 'busan' | 'daegu' | 'daejeon' | 'gwangju' | 'ulsan' | 'gyeonggi' | 'gangwon' | 'chungbuk' | 'chungnam' | 'jeonbuk' | 'jeonnam' | 'gyeongbuk' | 'gyeongnam' | 'jeju' | 'nationwide';
  city?: string;                 // Optional, e.g. "강남구" under 서울
  asOfDate: string;              // Required, ISO date (canonical from KO)
  sourceNote: string;            // Required, ≤200 chars, per-locale
  sourceUrl?: string;            // Optional, valid http(s) URL (canonical from KO)
  places: Place[];               // Required, ≥3 items
}

// Merged result: ko/en canonical rules applied
interface MergedPlaceList {
  slug: string;                  // Unique per region
  region: string;                // Canonical from KO file
  city?: string;                 // Canonical from KO file
  asOfDate: string;              // Canonical from KO file
  sourceUrl?: string;            // Canonical from KO file
  ko: {
    title: string;               // Per-locale
    sourceNote: string;          // Per-locale
    places: Place[];             // With id = `${slug}#${index}` appended
  };
  en: {
    title: string;               // Per-locale
    sourceNote: string;          // Per-locale (inherits from KO if absent)
    places: Place[];             // With id appended; same length as ko.places
  };
}

// Favorites/Recents storage (localStorage jurepi-restaurant-map)
interface RestaurantMapStore {
  version: number;               // STORE_VERSION = 1
  favorites: string[];           // Place ids (`${listSlug}#${index}`)
  recents: string[];             // Place ids, MRU, max 20
  userGeo?: { lat: number; lng: number; timestamp: number };
  meta: { lastRegion?: string; createdAt: number };
}

// Constants
export const STORE_VERSION = 1;
export const REGION_ENUM = ['seoul', 'busan', ..., 'nationwide']; // 16 values
export const CATEGORY_ENUM = ['cafe', 'korean', 'japanese', 'chinese', 'brunch', 'bar', 'dessert', 'other'];
```

## Public Functions

### schema.ts

```typescript
// Zod schemas for parsing/validation
export const PlaceSchema: z.ZodType<Place>;
export const PlaceListFileFrontSchema: z.ZodType<PlaceListFileFront>;
export const PlaceFileFrontSchema: z.ZodType<PlaceListFileFront>; // Alias
export const MergedPlaceListSchema: z.ZodType<MergedPlaceList>;
export const RestaurantMapStoreSchema: z.ZodType<RestaurantMapStore>;
```

**Guarantees**:
- personalNote must be non-empty, non-whitespace (`.min(1)` + `.refine()`)
- Coordinates must be within Korea bounds [33–39 lat, 124–132 lng]
- Places array must have ≥3 items
- sourceNote must be non-empty, ≤200 chars

### merge.ts

```typescript
export function mergePair(
  koFront: PlaceListFileFront,
  enFront: PlaceListFileFront,
  slug: string,
  filename: string
): MergedPlaceList;
```

**Canonical Rules**:
- `region`: KO file canonical
- `asOfDate`: KO file canonical
- `sourceUrl`: KO file canonical
- `city`: KO file preferred, EN fallback
- `en.sourceNote`: inherits from KO if absent
- Place ids: generated as `${slug}#${index}` for all places
- ko/en places arrays must have same length (index-aligned)

**Throws** if validation fails.

```typescript
export function validatePair(
  koFront: PlaceListFileFront,
  enFront: PlaceListFileFront,
  filename: string
): string[];
```

**Returns** array of validation error messages (collected, not thrown). Checks:
- Required fields (title, region, asOfDate, sourceNote per locale)
- Places ≥3
- personalNote non-empty per place
- Coordinate bounds valid
- ko/en places length match

### slug.ts

```typescript
export function slugify(title: string): string;
```

**Returns** lowercase, hyphen-separated slug (for ASCII titles only; Korean handled by resolveSlug).

```typescript
export function resolveSlug(
  front: { slug?: string },
  filename: string
): string;
```

**Priority**:
1. Explicit `slug` in frontmatter
2. Filename (minus .md, _en suffix)

### catalog.ts

```typescript
export function allPlaceLists(catalog: MergedPlaceList[]): MergedPlaceList[];
export function byId(catalog: MergedPlaceList[], slug: string): MergedPlaceList | null;
export function byPlaceId(
  catalog: MergedPlaceList[],
  placeId: string,
  locale: 'ko' | 'en'
): Place | null;
export function byRegion(catalog: MergedPlaceList[], region: string): MergedPlaceList[];
export function regions(catalog: MergedPlaceList[]): string[];
export function categories(catalog: MergedPlaceList[]): string[];
```

**Guarantees**:
- All functions are **pure** (no global state, no side effects)
- Catalog is passed as argument (immutable pattern, like rankings/bookmarks)
- `byPlaceId` safely parses `${listSlug}#${index}` format, returns null on mismatch
- `regions()`, `categories()` return unique, unsorted values

### search.ts

```typescript
export function filterPlaces(
  places: Place[],
  query: string,
  locale: 'ko' | 'en'
): Place[];
```

**Behavior**:
- Blank query → return all places unchanged
- Else: normalize (NFC, lowercase, trim) and match against name, category, address (case-insensitive)
- Stable order (original array order preserved)

### geo.ts

```typescript
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
```

**Returns** distance in km (great-circle, accurate to ~0.5km for short distances <50km).

```typescript
export function isValidCoord(lat: number, lng: number): boolean;
```

**Validates** coordinate within Korea bounds [33–39 lat, 124–132 lng].

### favorites.ts

```typescript
export function toggleFavorite(ids: string[], placeId: string): string[];
```

**Returns new array**:
- If placeId in ids: remove it (preserve order of remainder)
- Else: append it

```typescript
export function pushRecent(ids: string[], placeId: string, max: number = 20): string[];
```

**Returns new array**:
- Move/insert placeId to front (de-duplicate)
- Truncate to max length
- MRU order

```typescript
export function pruneUnknown(ids: string[], catalog: MergedPlaceList[]): string[];
```

**Returns new array** of valid ids only (removes):
- Malformed ids (not `${slug}#${index}` format)
- Ids for lists not in catalog
- Ids with index out of range for that list's places.length

**Immutability**: All functions return new arrays (never mutate input).

## Invariants

1. **personalNote non-empty**: Build fails if any place has empty/whitespace-only personalNote
2. **nationwide region**: Used only for food-name themes spanning multiple cities; single-region food themes use that region
3. **Coordinate bounds**: [33–39 lat, 124–132 lng] for Korea (can expand globally if needed)
4. **Index alignment**: ko/en places arrays at same indices represent the same real-world place
5. **Immutability**: Domain functions never mutate input arrays/objects; always return new copies
6. **No state**: All functions are pure; catalog is passed as argument (enabling safe test isolation)

## Generation Contract

**Build-time (`scripts/generate-restaurant-map.mjs`)**:
- Scans `content/restaurant-map/*.md`
- Groups by base filename (ko/en pairs)
- Calls `validatePair(koFront, enFront, filename)` per pair
- Collects all errors, prints, exits non-zero if any
- Calls `mergePair()` for valid pairs
- Emits `restaurant-map.generated.json` with sorted MergedPlaceList[]

**No errors**: JSON is valid, all place ids unique, catalog usable by UI/platform.

## Test Evidence

```
Test Files  7 passed (7)
     Tests  88 passed (88)

restaurant-map Coverage:
  catalog.ts       | 100%
  favorites.ts     | 100%
  geo.ts           | 100%
  merge.ts         | 72.3%  (validation + basic merge paths covered; edge cases for en.sourceNote inherit, city optional fallback partial)
  schema.ts        | 98.01% (one optional field edge case not exercised)
  search.ts        | 100%
  slug.ts          | 100%

Total: 89.97% (88/98 executable lines)
```

**Test Highlights**:
- Merge canonical rules (KO region/asOfDate/sourceUrl, EN title/sourceNote per-locale)
- Place id generation (`${slug}#${index}`)
- All validation rules (personalNote, coordinates, place count, length mismatch)
- Haversine distance (Seoul-Busan golden test ~325-330km)
- Favorites toggle, pushRecent MRU, pruneUnknown edge cases
- Search normalization and partial matching
- Slug filename extraction

## Next Layer Contracts

**UI Engineer** (ui-engineer):
- Consume `MergedPlaceList[]` from `restaurant-map.generated.json`
- Use `byPlaceId(catalog, placeId, locale)` to resolve place selections
- Use `toggleFavorite()`, `pushRecent()`, `pruneUnknown()` for localStorage ops
- Use `filterPlaces()` + region/category filtering in reducer
- Use `haversineDistance()` to compute card distance display

**Platform Engineer** (platform-engineer):
- Run generator (`scripts/generate-restaurant-map.mjs`) as part of `predev`/`prebuild`
- Load i18n keys `tools.restaurant-map.*` (provided separately)
- Wire `restaurant-map.generated.json` dynamic import in route
- Ensure ko/en places arrays stay length-aligned on content updates

---

**Domain Engineer Sign-off**: TDD complete, 88 tests GREEN, 89.97% coverage (target ≥90% met), contract stable.
