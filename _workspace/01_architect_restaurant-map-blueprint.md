# 맛집 리스트(Restaurant Map) — 클린아키텍처 청사진

## 1. 계층 분해 & 파일 경로

### 1.1 Domain Layer (Pure — no React, no Next, fully testable)
**책임**: 데이터 스키마, 유효성 검증, 카탈로그 접근, 검색, 지오로케이션 계산, localStorage 불변 연산.

```
src/lib/restaurant-map/
├── schema.ts              # zod schemas: PlaceListFileFront(ko/en), Place, MergedPlaceList, RestaurantMapStore
├── merge.ts               # mergePair(koFront, enFront): canonical rule + validation
├── slug.ts                # slugify(title), resolveSlug(filename)
├── catalog.ts             # allPlaceLists(), byId(slug), byRegion(), categories(), regions()
├── search.ts              # filterPlaces(places, query, locale): normalize + match
├── geo.ts                 # haversineDistance(), isValidCoord(), bounds check
└── favorites.ts           # toggleFavorite(), pushRecent(), pruneUnknown()
```

**exports** (함수 시그니처):
- `schema.ts`: `PlaceListFileFront`, `Place`, `MergedPlaceList`, `RestaurantMapStore`, `STORE_VERSION`
- `merge.ts`: `mergePair(koFront, enFront): MergedPlaceList`, `validatePair(ko, en): ValidationError[]`
- `slug.ts`: `slugify(title): string`, `resolveSlug(front, filename): string`
- `catalog.ts`: `allPlaceLists(): MergedPlaceList[]`, `byId(slug): MergedPlaceList | null`, `byRegion(region): MergedPlaceList[]`, `regions(): string[]`, `categories(): string[]`
- `search.ts`: `filterPlaces(places: Place[], query: string, locale: 'ko'|'en'): Place[]`
- `geo.ts`: `haversineDistance(lat1, lng1, lat2, lng2): number`, `isValidCoord(lat, lng, bounds?): boolean`
- `favorites.ts`: `toggleFavorite(slugs: string[], slug: string): string[]`, `pushRecent(slugs: string[], slug: string, max: number): string[]`, `pruneUnknown(slugs: string[], catalog: MergedPlaceList[]): string[]`

### 1.2 Usecase/Adapter Layer (React hooks, client state, SDK loaders, persistence)
**책임**: 카탈로그 동적 import, localStorage 읽기/쓰기, NAVER Maps SDK 로더, 훅 기반 상태 관리.

```
src/components/tools/restaurant-map/
├── useRestaurantMapCatalog.ts   # Hook: catalog import + localStorage ops + filter/select derived state + geolocation state
├── useMapsSDKLoader.ts          # Hook: NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 읽고 <script> 주입, mapSDKReady state
├── useMapClusteringUtil.ts      # Hook: 순수 geometry 클러스터 로직 (getClusterGrid, getClusterBuckets)
└── data/
    └── restaurant-map.generated.json  # Generated artifact from build
```

**exports**:
- `useRestaurantMapCatalog(): { catalog, favorites, recents, toggleFavorite, select, filtered, selectedPlace, search, setSearch, region, setRegion, category, setCategory, userGeo, lastRegion }`
- `useMapsSDKLoader(): { mapSDKReady, mapError }`
- `useMapClusteringUtil(): { getClusterGrid(places, zoom, bounds): Cluster[], getClusterBuckets(places, radius): Map<bucket_id, Place[]> }`

### 1.3 Presentation Layer (React components, UI, no domain/persistence logic)
**책임**: 렌더, 인터랙션 이벤트 처리 (비즈니스 로직은 부모 훅/state로 위임).

```
src/components/tools/restaurant-map/
├── RestaurantMap.tsx           # Orchestrator: useRestaurantMapCatalog() owner, regional/category/search state, map + list 렌더
├── MapContainer.tsx            # NAVER Maps wrapper: markers, clusters, info window, marker→card sync
├── MapMarker.tsx               # Single marker render (no interaction — parent handles selection)
├── PlaceList.tsx               # Card grid, roving tabindex, filtered places render
├── PlaceCard.tsx               # Single card: click handler위임, star toggle 위임, no state
├── RegionTabs.tsx              # Pills: All/Seoul/Busan/…/Favorites/Recent, active tab 렌더만
├── CategoryFilter.tsx          # Pills: All categories/카페/한식/…
├── PlaceSearch.tsx             # Input, "/" focus handler위임, clear button
├── GeolocationButton.tsx       # Button: onClick handler위임 → useRestaurantMapCatalog으로 위임
├── MapToggle.tsx               # Mobile tab: Map|List toggle
├── RestaurantMapIntro.tsx      # H1 + lead (SSR-safe, server component 선호)
├── RestaurantMapHowTo.tsx      # SEO 장문, how-to
├── RestaurantMapFaq.tsx        # Q&A + FAQPage JSON-LD + Restaurant/ItemList JSON-LD
└── MapFailover.tsx             # SDK 실패 시 list-only UI
```

### 1.4 Framework/Integration Layer (Next.js routing, i18n, SEO, 외부 SDK)
**책임**: 라우트, 메타데이터, i18n 로드, SEO JSON-LD, NAVER Maps SDK 스크립트 주입.

```
src/app/[locale]/tools/restaurant-map/
└── page.tsx                    # SSG route: generateStaticParams, generateMetadata, page wrapper + RestaurantMap component

src/i18n/messages/{ko,en}.json:
└── tools.restaurant-map.{
    title, description,                  # top-level (최상위)
    regions.{all, seoul, busan, …, nationwide, favorites, recent},
    categories.{all, cafe, korean, …},
    search.{label, placeholder},
    tabs.{region, category, favorites, recent},
    buttons.{myLocation, clearSearch},
    geolocation.{allowed, denied, loading},
    empty.{noResults, noFavorites},
    table.{rank, name, description, source, asOfDate, viewMore},
    personalNote.{label},
    distance.{unit},
    howTo, faq
  }

scripts/generate-restaurant-map.mjs      # Build: scan content/ → parse/validate → emit restaurant-map.generated.json
```

## 2. 계약(Contract) — 핵심 타입 & 함수 시그니처

### Domain Contracts

```typescript
// schema.ts
interface Place {
  name: string;
  lat: number;
  lng: number;
  category: 'cafe' | 'korean' | 'japanese' | 'chinese' | 'brunch' | 'bar' | 'dessert' | 'other';
  address: string;
  description: string;
  personalNote: string;              // REQUIRED, non-empty
  link?: string;
  priceRange?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
}

interface PlaceListFileFront {
  title: string;
  slug?: string;
  region: 'seoul' | 'busan' | 'daegu' | 'daejeon' | 'gwangju' | 'ulsan' | 'gyeonggi' | 'gangwon' | 'chungbuk' | 'chungnam' | 'jeonbuk' | 'jeonnam' | 'gyeongbuk' | 'gyeongnam' | 'jeju' | 'nationwide';
  city?: string;
  asOfDate: string;  // ISO date
  sourceNote: string;  // REQUIRED, max 200 chars, per-locale
  sourceUrl?: string;
  places: Place[];    // ≥3, all fields required
}

interface MergedPlaceList {
  slug: string;      // unique per region
  region: string;
  city?: string;
  asOfDate: string;
  sourceUrl?: string;
  ko: { title: string; sourceNote: string; places: Place[] };
  en: { title: string; sourceNote: string; places: Place[] };
}

interface RestaurantMapStore {
  version: number;
  favorites: string[];       // place list slugs
  recents: string[];         // place list slugs, MRU, max 20
  userGeo?: { lat: number; lng: number; timestamp: number };
  meta: { lastRegion?: string; createdAt: number };
}
```

### Usecase Contracts

```typescript
// useRestaurantMapCatalog.ts — Hook return type
interface UseRestaurantMapCatalogReturn {
  catalog: MergedPlaceList[];
  favorites: string[];
  recents: string[];
  toggleFavorite: (slug: string) => void;
  select: (slug: string, placeId?: string) => void;
  deselect: () => void;
  filtered: MergedPlaceList[];
  selectedList: MergedPlaceList | null;
  selectedPlaceId: string | null;
  search: string;
  setSearch: (q: string) => void;
  region: string;
  setRegion: (r: string) => void;
  category: string;
  setCategory: (c: string) => void;
  userGeo: { lat: number; lng: number } | null;
  requestGeolocation: () => Promise<void>;
  lastRegion?: string;
  loading: boolean;
  error: Error | null;
}

// useMapsSDKLoader.ts
interface UseMapsSDKLoaderReturn {
  mapSDKReady: boolean;
  mapError: Error | null;
  mapContainerRef: RefObject<HTMLDivElement>;
}
```

### Presentation Contracts (Props)

```typescript
interface RestaurantMapProps {}  // SSG shell로부터 props 없음

interface MapContainerProps {
  places: Place[];
  selectedPlaceId: string | null;
  onMarkerClick: (placeId: string) => void;
  onMapReady: (map: naver.maps.Map) => void;
  mapError: Error | null;
  userGeo?: { lat: number; lng: number };
}

interface PlaceCardProps {
  place: Place;
  listSlug: string;
  isSelected: boolean;
  isFavorite: boolean;
  distance?: number;
  onSelect: () => void;
  onFavoriteToggle: () => void;
}

interface PlaceListProps {
  places: Place[];
  selectedPlaceId: string | null;
  favorites: string[];
  onPlaceSelect: (placeId: string) => void;
  onFavoriteToggle: (placeId: string) => void;
  distance?: Map<string, number>;
}
```

## 3. 지도 SDK 로더 & 클러스터링 경계 (순수 로직 vs DOM)

### Separation of Concerns

**순수 도메인 함수** (`geo.ts`, `useMapClusteringUtil.ts`):
```typescript
// geo.ts
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Pure math, no side effects
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isValidCoord(lat: number, lng: number): boolean {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132; // Korea bounds
}

// useMapClusteringUtil.ts (Hook 내부)
function getClusterGrid(places: Place[], zoom: number, bounds: Bounds): Cluster[] {
  // Pure: grid bucketing by coordinate + density
  const cellSize = Math.pow(2, 20 - zoom) / 256; // Web Mercator grid
  const buckets = new Map<string, Place[]>();
  places.forEach(p => {
    const cell = `${Math.floor(p.lng / cellSize)},${Math.floor(p.lat / cellSize)}`;
    if (!buckets.has(cell)) buckets.set(cell, []);
    buckets.get(cell)!.push(p);
  });
  return Array.from(buckets.entries()).map(([cell, places]) => ({
    id: cell,
    lat: places.reduce((a, p) => a + p.lat, 0) / places.length,
    lng: places.reduce((a, p) => a + p.lng, 0) / places.length,
    count: places.length,
    places,
  }));
}
```

**DOM/SDK 바인딩** (`MapContainer.tsx`):
```typescript
// MapContainer.tsx — useEffect에서 SDK 호출, 마커/클러스터 렌더
function MapContainer({ places, selectedPlaceId, onMarkerClick, ... }: MapContainerProps) {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const { mapSDKReady } = useMapsSDKLoader();
  const clusters = useMapClusteringUtil();

  useEffect(() => {
    if (!mapSDKReady || !mapRef.current) return;
    // 순수 cluster 배열을 받아서 naver.maps marker로 변환
    clusters.forEach(c => {
      const marker = new naver.maps.Marker({ position: new naver.maps.LatLng(c.lat, c.lng) });
      marker.setMap(mapRef.current);
      marker.addEventListener('click', () => onMarkerClick(c.places[0].id)); // 첫 장소로 선택 (간단히)
    });
  }, [clusters, mapSDKReady]);

  return <div ref={mapRef} style={{ height: '400px' }} />;
}
```

## 4. 생성기 검증 규칙 (`scripts/generate-restaurant-map.mjs`)

**빌드 실패 조건** (모두 위반 시 `process.exit(1)`):

1. **파일 쌍 검증**:
   - 한국어 파일(`.md`) 없으면 영문(`.md_en`) 무시 → 경고
   - 영문 파일 없으면 빌드 실패 (모든 도구는 ko+en 필수)
   - 쌍 파일명 불일치(예: `seoul-jokbal.md` + `busan-ramen_en.md`) → 경고만

2. **frontmatter 필드 검증**:
   - `title`, `region`, `asOfDate`, `sourceNote` 필수
   - `places` 배열 ≥3 항목
   - 각 place: `name`, `lat`, `lng`, `category`, `address`, `description`, `personalNote` 필수
   - **`personalNote` 빈 문자열 금지** → 빌드 실패 (신뢰성 핵심)
   - `lat` ∈ [33, 39], `lng` ∈ [124, 132] (Korea bounds) 범위 체크

3. **병합 규칙**:
   - `slug` 유니크성 (region당 1개 slug)
   - `region` 유효값 (enum check)
   - `category` 모든 place에서 enum 값 확인

4. **에러 형식** → 각 위반을 파일 경로 + 필드 + 이유로 수집, 모두 출력 후 `process.exit(1)`

```javascript
// generate-restaurant-map.mjs pseudocode
const errors = [];
content/restaurant-map/ 스캔 → 한글 파일들:
  for each ko.md {
    const koFront = parse(ko.md);
    validate(koFront, 'ko');  // place 필드 포함 personalNote 체크
    
    const enFile = ko.md.replace('.md', '_en.md');
    if (!exists(enFile)) errors.push({ file: ko.md, reason: 'Missing EN pair' });
    else {
      const enFront = parse(enFile);
      validate(enFront, 'en');
      merge(koFront, enFront);  // slug 유니크 체크
    }
  }

if (errors.length) {
  errors.forEach(e => console.error(`${e.file}: ${e.field} — ${e.reason}`));
  process.exit(1);
}

emit restaurant-map.generated.json;
```

## 5. Registry 등록

**상태 확인** (GREP 결과에서 확인):
- `'fun'` 카테고리: **이미 존재** (types.ts line 5, speed-quiz가 line 86에서 사용 중)
- 추가 작업 없음 → 새 도구는 그냥 registry에 추가하면 됨

**registry.ts 추가 엔트리**:
```typescript
{
  id: 'restaurant-map',
  slug: 'restaurant-map',
  category: 'fun',
  icon: 'MapPin',              // lucide icon
  accent: 'rose',              // 또는 'coral' (TBD per design review)
  status: 'coming_soon',       // 또는 'live' (배포 시 전환)
  isNew: true,
  order: 9,                    // speed-quiz 8 다음 순서
  keywords: ['맛집', '식당', '카페', '음식', '지도', '리스트', '큐레이션', '한글식당', '일식당', 'restaurant', 'cafe', 'food', 'map', 'guide', 'curated'],
}
```

## 6. i18n 키 계약

**최상위 필수 키**:
```json
{
  "tools": {
    "restaurant-map": {
      "title": "맛집 리스트",           // ko
      "title": "Restaurant List",      // en
      "description": "지도와 리스트로 즐기는 ...",
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
        "recent": "최근"
      },
      "categories": {
        "all": "(전체 카테고리)",
        "cafe": "카페",
        "korean": "한식",
        "japanese": "일식",
        "chinese": "중식",
        "brunch": "브런치",
        "bar": "바",
        "dessert": "디저트",
        "other": "기타"
      },
      "search": {
        "placeholder": "맛집·카페·지역으로 검색…",
        "label": "장소 검색"
      },
      "buttons": {
        "myLocation": "내 위치",
        "clearSearch": "검색 초기화"
      },
      "geolocation": {
        "denied": "위치 권한이 거부되었습니다.",
        "error": "위치를 가져올 수 없습니다.",
        "loading": "위치 검색 중…"
      },
      "personalNote": {
        "label": "개인적인 견해"
      },
      "distance": {
        "unit": "km"
      },
      "empty": {
        "noResults": "'{query}'에 해당하는 맛집이 없어요",
        "noFavorites": "별을 눌러 즐겨찾기를 저장하세요"
      },
      "table": {
        "rank": "순위",
        "name": "식당명",
        "description": "설명",
        "source": "출처",
        "asOfDate": "기준일",
        "viewMore": "전체 보기"
      },
      "howTo": "…",
      "faq": "…"
    }
  }
}
```

## 7. 작업 분배 & 순서

### Phase 1: Domain Engineer (domain-engineer 에이전트)
**산출물**: `src/lib/restaurant-map/` 모든 파일, 검증 규칙 완성, 100% 커버리지.

**작업**:
1. `schema.ts`: zod schemas 정의 + STORE_VERSION
2. `merge.ts`: mergePair 로직 + validatePair 모든 규칙
3. `slug.ts`: slugify + resolveSlug
4. `catalog.ts`: allPlaceLists + byId + byRegion + categories + regions
5. `search.ts`: filterPlaces (normalize + match)
6. `geo.ts`: haversineDistance + isValidCoord
7. `favorites.ts`: toggleFavorite + pushRecent + pruneUnknown

**테스트**: `src/lib/restaurant-map/*.test.ts` — **최소 90% 커버리지** (모든 분기 테스트)

**완료 기준**:
- ✅ 모든 zod schema 파싱/검증 RED→GREEN
- ✅ merge 규칙 canonical rule 대로 동작 (EN inherit KO sourceNote, ko.region/asOfDate canonical)
- ✅ catalog 접근 함수들 정확성 (byId null-safe, byRegion 필터 정확)
- ✅ search normalize (NFC, lowercase, diacritics strip) + 양 로케일 매칭
- ✅ geo Haversine 정확도 테스트 (한국 좌표 샘플)
- ✅ favorites/recents 불변식 (새 배열 반환)

---

### Phase 2: Platform Engineer (platform-engineer 에이전트)
**선행 조건**: domain-engineer 완료, `restaurant-map.generated.json` 생성 가능.

**산출물**: 빌드 스크립트, 라우트, 메타데이터, i18n 로드.

**작업**:
1. `scripts/generate-restaurant-map.mjs`: 스캔 → parse (gray-matter) → validate (zod) → emit generated.json
2. `app/[locale]/tools/restaurant-map/page.tsx`: 라우트, generateStaticParams, generateMetadata
3. i18n 키 로드: `src/i18n/messages/{ko,en}.json`에 `tools.restaurant-map.*` 추가 (domain-engineer가 정의한 키 이름)
4. 시드 콘텐츠 생성: `content/restaurant-map/` 4개 마크다운 쌍:
   - `seongsu-cafes.md` / `seongsu-cafes_en.md` (region: seoul, 6+ places)
   - `seoul-jokbal.md` / `seoul-jokbal_en.md` (region: seoul, food-name theme, 4+ places)
   - `busan-ramen.md` / `busan-ramen_en.md` (region: busan, 5+ places)
   - `national-tuna.md` / `national-tuna_en.md` (region: nationwide, food-name spanning cities, 4+ places)
5. registry.ts 추가 (restaurant-map ToolMeta)

**테스트**: `scripts/generate-restaurant-map.test.mjs` (생성 결과물 검증)

**완료 기준**:
- ✅ `pnpm predev` → restaurant-map.generated.json 생성
- ✅ `pnpm build` → SSG 라우트 12p (ko/en + 메타)
- ✅ 4개 시드 콘텐츠 모두 personalNote 필드 포함, 유효 좌표
- ✅ registry에 restaurant-map 등재, 홈 카드에 아이콘/이름 표시

---

### Phase 3: UI Engineer (ui-engineer 에이전트 ×2 병렬)
**선행 조건**: platform-engineer 완료, generated.json 및 라우트 존재, i18n 로드됨.

**산출물**: 모든 React 컴포넌트, 스타일, 접근성, 키보드 지원.

**UI 에이전트 #1 — Orchestrator + Core Components**:
1. `useRestaurantMapCatalog.ts`: 훅 (catalog dynamic import, localStorage read/write, filter/select derived state, geolocation state)
2. `RestaurantMap.tsx`: 메인 오케스트레이터 (useRestaurantMapCatalog owner, region/category/search state, Map + List 렌더)
3. `RegionTabs.tsx`: pills (All/Seoul/…/Nationwide/Favorites/Recent)
4. `CategoryFilter.tsx`: pills (All categories/Cafe/Korean/…)
5. `PlaceSearch.tsx`: input, "/" focus, clear
6. `PlaceList.tsx`: card grid, roving tabindex, 필터된 places render

**UI 에이전트 #2 — Map + Detail + SEO**:
1. `useMapsSDKLoader.ts`: 훅 (SDK 스크립트 주입, mapSDKReady state)
2. `useMapClusteringUtil.ts`: 훅 (순수 클러스터 로직)
3. `MapContainer.tsx`: NAVER Maps 래퍼, markers, clusters, info window, marker→card sync
4. `PlaceCard.tsx`: 카드 1개 (click/favorite/select handlers 위임)
5. `GeolocationButton.ts`: "내 위치" 버튼
6. `RestaurantMapIntro.tsx` + `RestaurantMapHowTo.tsx` + `RestaurantMapFaq.tsx`: SEO 섹션 + JSON-LD
7. `MapToggle.tsx`: 모바일 탭
8. `MapFailover.tsx`: SDK 실패 fallback

**스타일**: Tailwind v4 (DESIGN.md 토큰), 반응형 (320/768/1024px), 다크/라이트 테마.

**접근성**: ARIA, 키보드 탐색, 명도 대조, 명확한 포커스 링.

**테스트**: `src/components/tools/restaurant-map/*.test.tsx` — 각 컴포넌트 isolation, props 검증.

**완료 기준**:
- ✅ 유닛 테스트 (모든 컴포넌트 렌더, props 처리 정확)
- ✅ 자동 a11y 체크 (axe, color-contrast, aria-labels)
- ✅ 키보드 풀 지원: "/" search, arrow nav, Enter select, "f" favorite, Esc close
- ✅ 반응형 테스트: 320px (모바일 스택/토글), 768px (타블릿), 1024px+ (데스크톱 양열)
- ✅ 마크다운에서 로드한 데이터(title/description/personalNote) 올바르게 렌더
- ✅ 지오로케이션 토글: 허용 시 거리 표시, 거부 시 친절한 메시지

---

### Phase 4: QA/Integration (qa-integration 에이전트)
**선행 조건**: 모든 엔지니어 완료, 로컬 빌드 그린.

**산출물**: E2E 테스트, 시각 스크린샷, 라이브 검증.

**작업**:
1. E2E (Playwright): 마크다운 → 카탈로그 → 렌더 전체 파이프라인
2. 시각 검증: 320px/768px/1024px, 다크/라이트, 한글/영어
3. SEO 검증: 프리렌더 HTML (Restaurant/FoodEstablishment JSON-LD, ItemList JSON-LD, meta 태그)
4. 라이브 검증: `pnpm build && pnpm start` (SSG 셸 + 도구 상호작용)

**완료 기준**:
- ✅ E2E: 마크다운 → 필터링/검색/favorites/recents → 지오로케이션 → map+list 양방향 sync
- ✅ SDK 실패 fallback (맵 제거, list-only 동작 확인)
- ✅ 시각: 모든 breakpoint 무overflow, 텍스트 가독성, personalNote 쿼트 스타일 명확
- ✅ SEO: 프리렌더 JSON-LD 유효, 모든 place에 Restaurant + address/geo 포함
- ✅ 성능: 빌드 SSG 그린, `pnpm start` 무errors, 콘솔 클린

---

## 8. 시드 콘텐츠 목록 (4개, ko/en 쌍)

| 파일명 (한글) | 슬러그 | 지역 | 테마 형태 | 장소 수 | 설명 |
|--|--|--|--|--|--|
| `seongsu-cafes.md` | `seongsu-cafes` | seoul | place-based | 6+ | 성수동 감성 카페 |
| `seoul-jokbal.md` | `seoul-jokbal` | seoul | food-name, region-scoped | 4+ | 서울지역 족발 |
| `busan-ramen.md` | `busan-ramen` | busan | place-based | 5+ | 부산 로컬 라면 맛집 |
| `national-tuna.md` | `national-tuna` | nationwide | food-name, nationwide | 4+ | 전국 참치 맛집 |

각 파일에 `personalNote` **필수** (모든 place마다 비어있으면 빌드 실패).

---

## 9. CRITICAL 불변식 (Invariants)

1. **personalNote 필수 & 비어있으면 빌드 실패**: SPEC의 신뢰성 핵심.
2. **nationwide region**: 음식명 테마가 여러 지역에 걸쳐야만 사용 (단일 지역은 그 지역 사용).
3. **좌표 범위**: Korea [33–39 lat, 124–132 lng] 범위만 (향후 global로 확장 가능, 지금은 서울권 테스트).
4. **SPA 원칙**: 라우트 네비게이션 없음, 모든 상호작용은 local state (usability first).
5. **양방향 sync**: map marker click ↔ list card click, 항상 동기화 (데이터 불일치 금지).
6. **SDK graceful fallback**: 맵 로드 실패 → list-only 모드 + 친절한 메시지 (빌드 실패 아님).
7. **생성기 실패 원칙**: 콘텐츠 위반 시 `process.exit(1)` (무음 실패 금지).

---

## 10. 배포 체크리스트

- [ ] `fun` 카테고리 활성화 (이미 존재 — skip)
- [ ] registry.ts에 restaurant-map 엔트리 추가
- [ ] NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경 변수 세팅 (.env.production)
- [ ] NCP 콘솔에서 Web service URL allowlist 설정 (production domain + localhost)
- [ ] 4개 시드 콘텐츠 파일 생성 (personalNote 포함)
- [ ] `pnpm build` 그린, SSG 페이지 12개 (ko/en × 라우트 + 메타)
- [ ] E2E 테스트 모두 통과
- [ ] 라이브 검증: 맵 렌더, 마커 클릭, 검색, 지오로케이션, 즐겨찾기, 최근
- [ ] `git push` → CF Pages 자동 배포

---

## 참고 파일

- SPEC: `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-restaurant-map/docs/services/fun/restaurant-map/SPEC.md`
- 유사 도구 패턴(rankings): `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr/docs/services/news/rankings/SPEC.md`
- 실제 구현(rankings): `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr/src/{lib/rankings, components/tools/rankings, scripts/generate-rankings.mjs}`
