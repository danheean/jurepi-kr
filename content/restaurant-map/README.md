# Authoring Restaurant Lists

This folder contains curated place lists (themed by region/cuisine) as markdown files.

## File Naming Convention

- Pair files: `<slug>.md` (Korean) + `<slug>_en.md` (English)
- Example: `seongsu-cafes.md` + `seongsu-cafes_en.md`
- Excluded: files starting with `_` (e.g., `_TEMPLATE.md`) are not processed

## Markdown Structure

Each file contains YAML frontmatter + optional markdown body.

### Frontmatter Schema

```yaml
title: "string — list title (required, non-empty)"
slug: "string — optional identifier (auto-derived from filename if omitted)"
region: "enum — required (see Region List below)"
city: "string — optional, e.g. '강남구' or 'Gangnam-gu'"
asOfDate: "ISO date — required (e.g. '2026-07-04', '2026-07')"
sourceNote: "string — required (max 200 chars), localized per-file"
sourceUrl: "URL — optional, clickable source link"
places:
  - name: "string — required"
    lat: "number — required [33–39 for Korea]"
    lng: "number — required [124–132 for Korea]"
    category: "enum — required (see Categories below)"
    address: "string — required, human-readable"
    description: "string — required, factual summary"
    personalNote: "string — REQUIRED, curator's first-person opinion"
    link: "URL — optional, external link (e.g. Naver Place, Google Maps)"
    priceRange: "string — optional (e.g. '₩10,000–20,000')"
    imageUrl: "URL — optional"
    imageWidth: "number — required if imageUrl set"
    imageHeight: "number — required if imageUrl set"
```

### Region List (enum values)

- `seoul` — 서울
- `busan` — 부산
- `daegu` — 대구
- `daejeon` — 대전
- `gwangju` — 광주
- `ulsan` — 울산
- `gyeonggi` — 경기
- `gangwon` — 강원
- `chungbuk` — 충북
- `chungnam` — 충남
- `jeonbuk` — 전북
- `jeonnam` — 전남
- `gyeongbuk` — 경북
- `gyeongnam` — 경남
- `jeju` — 제주
- `nationwide` — 전국 (for multi-region food-themed lists)

### Categories (enum values)

- `cafe` — 카페
- `korean` — 한식
- `japanese` — 일식
- `chinese` — 중식
- `brunch` — 브런치
- `bar` — 바
- `dessert` — 디저트
- `other` — 기타

## Key Fields

### personalNote (CRITICAL)

Every place **must** have a non-empty `personalNote` — a short, first-person opinion from the curator. Example:
- "겉바속촉이란 말이 족발에도 쓰일 줄 몰랐어요. 웨이팅 각오는 필수."
- "Didn't expect 'crispy outside, tender inside' to apply to pork hock. Budget time for the line."

This is distinct from `description` (which is factual) and is the core trust signal: lists are hand-written by a person with a point of view, not scraped or AI-generated.

### sourceNote (per-locale)

Declare the source/provenance in each locale:
- Korean file: "직접 다녀온 곳 위주, 2026년 상반기 기준"
- English file: "First-hand visits only, as of H1 2026" (or inherit from Korean if omitted by leaving empty)

### Theme Shapes

Two valid themes:

1. **Place-based** (neighborhood/area): `region: seoul`, e.g. "성수동 감성 카페"
2. **Food-name-based** (cuisine/dish):
   - Region-scoped: `region: seoul`, e.g. "서울지역 족발"
   - Multi-region: `region: nationwide`, e.g. "전국 참치 맛집"

## Validation Rules

The generator (`scripts/generate-restaurant-map.mjs`) enforces:

- ✓ Both `.md` and `_en.md` files exist per pair
- ✓ Frontmatter parses as YAML
- ✓ All required fields present
- ✓ Coordinates within bounds [33–39 lat, 124–132 lng]
- ✓ ≥3 places per list
- ✓ **personalNote non-empty, non-whitespace per place**
- ✓ ko/en places arrays same length
- ✓ Slug unique per region

On violation, the build fails with detailed error messages.

## Build & Testing

```bash
# Generate from content/restaurant-map/* → src/components/tools/restaurant-map/data/restaurant-map.generated.json
npm run predev
npm run prebuild

# Run full build
npm run build

# View generated artifact
cat src/components/tools/restaurant-map/data/restaurant-map.generated.json
```

## Adding a New List

1. Create `<slug>.md` + `<slug>_en.md` in this folder
2. Fill frontmatter (title, region, asOfDate, sourceNote, places[])
3. Ensure every place has `personalNote` (non-empty)
4. Run `npm run predev` — generator validates and emits
5. Visit tool route `/[locale]/tools/restaurant-map` to see the new list rendered
