# Restaurant-Map Platform Integration — i18n Keys & Registry

**Date**: 2026-07-04  
**Confirmed from**: Generator run (4 place lists, 19 places), domain completion (99 tests, 97% coverage), UI pending (ui-engineer parallel)

## Registry Entry

**File**: `src/tools/registry.ts`

```typescript
{
  id: 'restaurant-map',
  slug: 'restaurant-map',
  category: 'fun',
  icon: 'MapPin',
  accent: 'rose',
  status: 'coming_soon',
  isNew: true,
  order: 22,
  keywords: ['맛집', '맛집리스트', '맛집지도', '카페', '라면', '족발', '참치', '음식', '추천', '지도', 'restaurant', 'map', 'food', 'cafe', 'ramen', 'tuna', 'local favorite', 'curator', 'dining', 'lunch', 'dinner'],
}
```

**Notes**:
- `status: 'coming_soon'` — tool not yet live (ui-engineer still building components)
- `category: 'fun'` — must be wired in `CATEGORY_ORDER` + `FOOTER_CATEGORIES` in platform layer
- `icon: 'MapPin'` — lucide-react icon representing the map-based discovery
- `accent: 'rose'` — tool identity color (TBD design review may change to coral)
- `order: 22` — next after qr-code (order 21)

## i18n Keys — Complete Schema

**Location**: `src/i18n/messages/{ko,en}.json` → `tools.restaurant-map.*`

### Top-level (required by platform — home card, footer, search)

```json
"tools.restaurant-map": {
  "title": "맛집 리스트",              // "Restaurant List" (en)
  "description": "지역·음식·카테고리별 맛집 지도",  // short tagline (en)
  "meta": {
    "title": "맛집 리스트 — 지도에서 발견하는 로컬 맛집",  // longer for <meta> tag
    "description": "전국 맛집과 카페를 지도에서 한 눈에 발견하세요."
  }
}
```

### Regions (localized labels for region tabs)

```json
"regions": {
  "all": "전체",
  "seoul": "서울",
  "busan": "부산",
  "daegu": "대구",
  "daejeon": "대전",
  "gwangju": "광주",
  "ulsan": "울산",
  "gyeonggi": "경기",
  "gangwon": "강원",
  "chungbuk": "충북",
  "chungnam": "충남",
  "jeonbuk": "전북",
  "jeonnam": "전남",
  "gyeongbuk": "경북",
  "gyeongnam": "경남",
  "jeju": "제주",
  "nationwide": "전국",
  "favorites": "즐겨찾기",
  "recent": "최근 본"
}
```

### Categories (place type labels for category filter)

```json
"categories": {
  "all": "전체 카테고리",
  "cafe": "카페",
  "korean": "한식",
  "japanese": "일식",
  "chinese": "중식",
  "brunch": "브런치",
  "bar": "바",
  "dessert": "디저트",
  "other": "기타"
}
```

### Search UI

```json
"search": {
  "label": "검색",
  "placeholder": "맛집·카페·지역으로 검색…",
  "resultCount": "결과 {count}개"  // ICU — "results" (en)
}
```

### Buttons

```json
"buttons": {
  "myLocation": "내 위치",            // "My Location" (en)
  "clearSearch": "검색 초기화"          // "Clear" (en)
}
```

### Geolocation Status

```json
"geolocation": {
  "granted": "위치 권한 허용됨",        // "Location access granted" (en)
  "denied": "위치 권한이 거부되었습니다.",  // "Location access denied" (en)
  "error": "위치를 가져올 수 없습니다.",    // "Unable to get location" (en)
  "loading": "위치 가져오는 중…"         // "Getting location..." (en)
}
```

### Place Field Labels

```json
"personalNote": {
  "label": "개인적인 견해"              // "Personal Take" (en)
},
"sourceNote": {
  "label": "출처"                      // "Source" (en)
},
"asOfDate": {
  "label": "기준일"                    // "As of" (en)
}
```

### Distance (for geolocation distance display)

```json
"distance": {
  "unit": "km",
  "away": "{distance}km 거리"           // "{distance}km away" (en)
}
```

### Empty States

```json
"empty": {
  "noResults": "'{query}'에 해당하는 맛집이 없어요.",
  "noFavorites": "별을 눌러 즐겨찾기를 저장하세요.",
  "noRecents": "본 맛집이 없습니다."
}
```

### Mobile Map/List Toggle

```json
"mapToggle": {
  "mapView": "지도",
  "listView": "목록"
}
```

### Map Failover (SDK load error)

```json
"mapFailover": {
  "message": "지도를 로드할 수 없습니다. 아래 맛집 목록으로 확인하세요."
}
```

### SEO Sections (Intro, How-To, FAQ)

**Intro:**
```json
"intro": {
  "eyebrow": "맛집 도구",              // "RESTAURANT TOOL" (en)
  "lead": "서울·부산·지역별 맛집과 카페를 지도에서 발견하세요."
}
```

**How-To:**
```json
"howTo": {
  "title": "맛집 리스트 사용하는 방법",
  "step1": "지역이나 카테고리를 선택하면…",
  "step2": "카테고리로 추가 필터링…",
  "step3": "내 위치를 켜면…",
  "step4": "별을 눌러…"
}
```

**FAQ:**
```json
"faq": {
  "items": [
    {
      "question": "맛집 리스트에 어떻게 추가될까요?",
      "answer": "큐레이터가 직접 방문해서 선정한 맛집만 리스트에 올라갑니다."
    },
    {
      "question": "내 위치 정보는 저장되나요?",
      "answer": "내 위치는 당신의 기기에만 저장되며, 서버로 전송되지 않습니다."
    },
    {
      "question": "즐겨찾기는 어디에 저장되나요?",
      "answer": "즐겨찾기는 브라우저 로컬스토리지에 저장됩니다."
    }
  ]
}
```

## Generated Data Artifact

**Location**: `src/components/tools/restaurant-map/data/restaurant-map.generated.json`

**Generator**: `scripts/generate-restaurant-map.mjs`

**Verified Output**:
```
✓ Generated 4 place lists (19 places total)
```

**Seed Content** (ko/en pairs):
1. `seongsu-cafes.md` + `_en.md` — Seoul, 6 places (region-scoped, place-based theme)
2. `seoul-jokbal.md` + `_en.md` — Seoul, 4 places (region-scoped, food-name theme)
3. `busan-ramen.md` + `_en.md` — Busan, 5 places (region-scoped, food-name theme)
4. `national-tuna.md` + `_en.md` — Nationwide, 4 places (multi-region, food-name theme)

**Total**: 19 places across 4 themed lists, all with required `personalNote` field.

## Route Wiring

**File**: `src/app/[locale]/tools/[slug]/page.tsx`

**Change**: Add conditional branch for `slug === 'restaurant-map'` to mount `<RestaurantMap />` component.

**Pattern** (to match existing tools):
```typescript
if (slug === 'restaurant-map') {
  return <RestaurantMap />;
}
```

The `<RestaurantMap />` component is being built in parallel by ui-engineer; path import is `@/components/tools/restaurant-map/RestaurantMap`.

Also add branch in `generateMetadata` (if tool-specific overrides needed).

## Environment

**NAVER Maps API Key**:
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` already configured in `.env.local` (dev) and `.env.production` (prod)
- Public Key ID only; domain-restricted in NCP console
- Secret key (`X-NCP-APIGW-API-KEY`) not used (no server-side geocoding at MVP)

## Integration Checklist

- [x] Generator script created (`scripts/generate-restaurant-map.mjs`)
- [x] Generator wired to `predev` / `prebuild` in `package.json`
- [x] Seed content (4 pairs, 19 places) validated and emitted
- [x] Registry entry added (`src/tools/registry.ts`)
- [ ] i18n keys added (`src/i18n/messages/{ko,en}.json`)
- [ ] Route branch added (`src/app/[locale]/tools/[slug]/page.tsx`)
- [ ] UI components finalized (ui-engineer parallel)

## Notes for Next Steps

1. **UI Component Readiness**: ui-engineer to provide `src/components/tools/restaurant-map/RestaurantMap.tsx` and related components. The domain layer and data generation are ready for integration.

2. **i18n Sync**: Ensure all keys from this schema match between `ko.json` and `en.json`.

3. **Route Integration**: Once UI is ready, wire the route branch so that `/[locale]/tools/restaurant-map` renders the RestaurantMap SPA.

4. **Status Transition**: When UI and platform integration complete, change registry `status` from `'coming_soon'` to `'live'` to enable SSG + SEO.
