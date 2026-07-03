# 맛집 리스트 (Restaurant List)

<sub>카테고리: 재미(fun) · 액센트: rose · registry id: `restaurant-map` · 라우트: `/[locale]/tools/restaurant-map`</sub>

지도와 리스트를 오가며 큐레이션된 맛집·카페를 발견하는 도구입니다. 테마는 **동네 기반**("성수동 감성 카페")일 수도, **음식이름 기반**("서울지역 족발", "전국 참치 맛집")일 수도 있습니다. 모든 콘텐츠는 사람이 직접 큐레이션한 마크다운이며 — AI 스크랩도, 실시간 크롤링도 아닙니다. 각 장소에는 사실 요약(`description`)과는 별개로 **"개인적인 견해"(`personalNote`)** 가 반드시 붙어, 큐레이터가 실제로 다녀본 사람이라는 신뢰 신호를 줍니다.

> 요구사항 정본: [`SPEC.md`](SPEC.md) · 콘텐츠 저작 상세: [`content/restaurant-map/README.md`](../../../../content/restaurant-map/README.md)

## 무엇을 하는 도구인가

- **지도 + 리스트 이중 화면**: NAVER Maps에 마커로 장소를 표시하고, 동시에 카드 리스트로도 보여줍니다. 마커를 클릭하면 카드가 하이라이트, 카드를 클릭하면 지도가 팬(pan)합니다(양방향 동기화).
- **지역/카테고리 탭 + 검색**: 서울·부산·…·전국(nationwide) 지역 탭과 카페/한식/일식 등 카테고리 필터를 교차 적용.
- **내 위치 기반 거리 표시**: 지오로케이션 허용 시 각 카드에 거리(km)가 표시됩니다.
- **즐겨찾기 · 최근 본 장소**: 장소(개별 식당) 단위로 저장되며 브라우저에만 남습니다(서버 전송 없음).
- **SEO/GEO**: 장소마다 `FoodEstablishment` JSON-LD, 리스트별 `ItemList`, 도구 전체 `SoftwareApplication`+`FAQPage` — 검색엔진과 AI 답변엔진 양쪽에 노출됩니다.

## 아키텍처 한눈에

콘텐츠 파이프라인은 다른 마크다운 카탈로그 도구(별별 랭킹, 즐겨찾기)와 동일한 패턴입니다.

```
content/restaurant-map/*.md, *_en.md   (사람이 쓰는 콘텐츠, 국문/영문 쌍)
        │  scripts/generate-restaurant-map.mjs (빌드타임: 스캔 → zod 검증 → 병합)
        ▼
src/components/tools/restaurant-map/data/restaurant-map.generated.json  (정적 카탈로그)
        │
        ▼
src/lib/restaurant-map/**        도메인(순수 함수) — schema/merge/slug/catalog/search/geo/favorites
src/components/tools/restaurant-map/**   UI(React) — 지도(NAVER Maps SDK)/리스트/검색/상세/SEO
```

- 도메인 계층은 `react`/`next`를 import하지 않는 순수 함수이며 Vitest로 TDD됨(97%+ 커버리지).
- 장소 식별자(`place.id`)는 마크다운에 쓰지 않고 `${listSlug}#${index}` 형태로 빌드타임에 자동 파생됩니다. 즐겨찾기/최근/지도 마커 선택 상태가 전부 이 id를 씁니다.
- NAVER Maps JS SDK는 이 라우트에서만 동적으로 로드되며, 로드 실패 시 지도 없이 리스트만으로도 완전히 동작합니다(우아한 폴백).

## 콘텐츠 자료 추가·업데이트 예시

콘텐츠는 **코드가 아니라 마크다운**이므로, 새 리스트를 넣거나 기존 리스트를 고치는 데 코드 변경이 필요 없습니다. 두 가지 경로가 있습니다.

### 예시 1 — 스킬로 새 테마 리서치+추가 (`jurepi-restaurant-map-add`)

주제와 개수만 말하면 스킬이 실제 장소를 리서치하고, `personalNote`까지 채운 마크다운 쌍을 저작해 검증·배포까지 진행합니다.

```
"맛집 리스트에 전국 파스타 맛집 6곳 추가해줘"
"성수동 카페 5곳 만들어줘"
"서울지역 냉면 맛집 4곳 리서치해서 넣어줘"
```

내부적으로 다음을 수행합니다:
1. 테마 형태(동네 vs 음식이름, 지역한정 vs 전국) 확인
2. `WebSearch`/`WebFetch`로 실존 장소(상호명·주소·대략 좌표) 리서치 — 임의 생성 금지
3. 장소마다 사실 요약(`description`)과 큐레이터 1인칭 의견(`personalNote`)을 분리해 작성
4. `content/restaurant-map/<slug>.md` + `<slug>_en.md` 쌍 저작
5. 생성기 실행 → tsc/test/build 검증 → (승인 시) 배포

### 예시 2 — 마크다운을 직접 고친 뒤 반영 (`jurepi-restaurant-map-update`)

이미 `.md` 파일을 손으로 수정했다면 이 스킬로 반영·검증·배포만 맡깁니다.

```
"content/restaurant-map/seoul-jokbal.md 수정했어, 반영해줘"
"맛집 리스트 콘텐츠 갱신해줘"
```

### 예시 3 — 마크다운 원시 형태 (참고용)

```yaml
# content/restaurant-map/seoul-jokbal.md (국문, canonical)
title: "서울지역 족발"
region: seoul
asOfDate: "2026-07-04"
sourceNote: "직접 다녀온 곳 위주, 2026년 상반기 기준"
places:
  - name: "장충동 왕족발집"
    lat: 37.5605
    lng: 127.0089
    category: 한식
    address: "서울 중구 장충단로 174"
    description: "1970년대부터 이어온 원조 장충동 족발. 쫄깃한 껍질과 진한 양념이 특징."
    personalNote: "겉바속촉이란 말이 족발에도 쓰일 줄 몰랐어요. 웨이팅 각오는 필수."
    link: "https://map.naver.com/p/entry/place/11592234"
```

전체 필드 스키마·검증 규칙·region/category enum은 [`content/restaurant-map/README.md`](../../../../content/restaurant-map/README.md)를 참고하세요.

## 빌드/테스트

```bash
node scripts/generate-restaurant-map.mjs   # content/ → *.generated.json
pnpm test src/lib/restaurant-map src/components/tools/restaurant-map
pnpm exec tsc --noEmit
pnpm build
```

## 상태

`src/tools/registry.ts`의 `status: 'coming_soon'` — 아직 공개(라이브) 전입니다. 공개·배포는 별도 승인 후 진행합니다.

## 관련 문서

- [`SPEC.md`](SPEC.md) — 요구사항 단일 소스
- [`content/restaurant-map/README.md`](../../../../content/restaurant-map/README.md) — 콘텐츠 저작 상세 스키마
- `.claude/skills/jurepi-restaurant-map-add`, `.claude/skills/jurepi-restaurant-map-update` — 콘텐츠 관리 스킬
- `_workspace/02_domain_restaurant-map-contract.md` — 도메인 공개 API 계약
